import { Injectable } from '@nestjs/common';
import type { AdminRole } from '../prisma/prisma-exports';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAdminByEmail(email: string) {
    return this.prisma.adminUser.findUnique({ where: { email } });
  }

  async recordSuccessfulLogin(userId: string, ipAddress?: string, userAgent?: string) {
    const now = new Date();
    return this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: userId }, data: { lastLoginAt: now } }),
      this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'AUTH_LOGIN',
          entityType: 'AdminUser',
          entityId: userId,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      }),
    ]);
  }

  findInvitationByTokenHash(tokenHash: string) {
    return this.prisma.adminInvitation.findUnique({ where: { tokenHash } });
  }

  async acceptInvitation(input: {
    invitationId: string;
    invitedById: string;
    email: string;
    name: string;
    role: AdminRole;
    passwordHash: string;
    now: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.adminInvitation.updateMany({
        where: { id: input.invitationId, acceptedAt: null, expiresAt: { gt: input.now } },
        data: { acceptedAt: input.now },
      });
      if (claimed.count !== 1) return null;

      const user = await tx.adminUser.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash: input.passwordHash,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: input.invitedById,
          action: 'ADMIN_INVITATION_ACCEPTED',
          entityType: 'AdminUser',
          entityId: user.id,
          metadata: { email: user.email, role: user.role },
        },
      });
      return user;
    });
  }
}
