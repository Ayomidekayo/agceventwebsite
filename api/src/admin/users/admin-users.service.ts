import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole } from '../../prisma/prisma-exports';
import { createHash, randomBytes } from 'node:crypto';
import { isPrismaTransactionConflict, isPrismaUniqueConstraintError } from '../../common/utils/prisma-error.util';
import { AdminUsersRepository } from './admin-users.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly repository: AdminUsersRepository) {}

  listUsers() {
    return this.repository.listUsers();
  }

  async createInvitation(dto: CreateInvitationDto, invitedById: string) {
    const email = dto.email.trim().toLowerCase();
    if (await this.repository.findUserByEmail(email)) throw new ConflictException('An account already exists for this email.');
    const now = new Date();
    if (await this.repository.findValidInvitation(email, now)) throw new ConflictException('A valid invitation already exists for this email.');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    try {
      const invitation = await this.repository.createInvitation({
        email,
        name: dto.name.trim(),
        role: dto.role,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt,
        invitedById,
      });
      const webOrigin = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',')[0]!.trim().replace(/\/+$/, '');
      return {
        invitation: { id: invitation.id, email: invitation.email, name: invitation.name, role: invitation.role, expiresAt },
        inviteUrl: `${webOrigin}/admin/accept-invitation#token=${token}`,
        note: 'Email delivery is not configured yet. Share this one-time link privately; it expires in 48 hours.',
      };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) throw new ConflictException('A valid invitation already exists for this email.');
      throw error;
    }
  }

  async setUserActive(id: string, isActive: boolean, actorId: string) {
    if (id === actorId && !isActive) throw new BadRequestException('You cannot deactivate your own account.');
    try {
      const result = await this.repository.setActive(id, isActive, actorId);
      if (result.kind === 'NOT_FOUND') throw new NotFoundException('Team account not found.');
      if (result.kind === 'LAST_SUPER_ADMIN') throw new BadRequestException('At least one active Super Admin must remain.');
      return { id: result.user.id, email: result.user.email, isActive: result.user.isActive };
    } catch (error) {
      if (isPrismaTransactionConflict(error)) throw new ConflictException('The team account changed concurrently. Refresh and try again.');
      throw error;
    }
  }

  async setUserRole(id: string, role: AdminRole, actorId: string) {
    if (id === actorId && role !== 'SUPER_ADMIN') throw new BadRequestException('You cannot remove your own Super Admin role.');
    try {
      const result = await this.repository.setRole(id, role, actorId);
      if (result.kind === 'NOT_FOUND') throw new NotFoundException('Team account not found.');
      if (result.kind === 'LAST_SUPER_ADMIN') throw new BadRequestException('At least one active Super Admin must remain.');
      return { id: result.user.id, email: result.user.email, role: result.user.role };
    } catch (error) {
      if (isPrismaTransactionConflict(error)) throw new ConflictException('The team account changed concurrently. Refresh and try again.');
      throw error;
    }
  }
}
