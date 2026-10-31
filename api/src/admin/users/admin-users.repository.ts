import { Injectable } from '@nestjs/common';
import { AdminRole, Prisma } from '../../prisma/prisma-exports';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const [users, invitations] = await Promise.all([
      this.prisma.adminUser.findMany({
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      }),
      this.prisma.adminInvitation.findMany({
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, expiresAt: true, createdAt: true },
      }),
    ]);
    return { users, invitations };
  }

  findUserByEmail(email: string) {
    return this.prisma.adminUser.findUnique({ where: { email } });
  }

  findValidInvitation(email: string, now: Date) {
    return this.prisma.adminInvitation.findFirst({ where: { email, acceptedAt: null, expiresAt: { gt: now } } });
  }

  createInvitation(data: Prisma.AdminInvitationUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.adminInvitation.create({ data });
      await tx.auditLog.create({
        data: {
          actorId: data.invitedById,
          action: 'ADMIN_INVITATION_CREATED',
          entityType: 'AdminInvitation',
          entityId: invitation.id,
          metadata: { email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt.toISOString() },
        },
      });
      return invitation;
    });
  }

  setActive(id: string, isActive: boolean, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.adminUser.findUnique({ where: { id } });
      if (!existing) return { kind: 'NOT_FOUND' as const };
      if (!isActive && existing.role === 'SUPER_ADMIN' && existing.isActive) {
        const activeSuperAdmins = await tx.adminUser.count({ where: { role: 'SUPER_ADMIN', isActive: true } });
        if (activeSuperAdmins <= 1) return { kind: 'LAST_SUPER_ADMIN' as const };
      }
      const updated = await tx.adminUser.update({ where: { id }, data: { isActive } });
      await tx.auditLog.create({
        data: { actorId, action: 'ADMIN_ACCOUNT_STATUS_UPDATED', entityType: 'AdminUser', entityId: id, metadata: { from: existing.isActive, to: updated.isActive } },
      });
      return { kind: 'UPDATED' as const, user: updated };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  setRole(id: string, role: AdminRole, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.adminUser.findUnique({ where: { id } });
      if (!existing) return { kind: 'NOT_FOUND' as const };
      if (existing.isActive && existing.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
        const activeSuperAdmins = await tx.adminUser.count({ where: { role: 'SUPER_ADMIN', isActive: true } });
        if (activeSuperAdmins <= 1) return { kind: 'LAST_SUPER_ADMIN' as const };
      }
      const updated = await tx.adminUser.update({ where: { id }, data: { role } });
      await tx.auditLog.create({
        data: { actorId, action: 'ADMIN_ROLE_UPDATED', entityType: 'AdminUser', entityId: id, metadata: { from: existing.role, to: updated.role } },
      });
      return { kind: 'UPDATED' as const, user: updated };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
