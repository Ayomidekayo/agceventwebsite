import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { AdminRole } from '../prisma/prisma-exports';
import { compare, hash } from 'bcryptjs';
import { isPrismaUniqueConstraintError } from '../common/utils/prisma-error.util';
import { AuthRepository } from './auth.repository';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async validateCredentials(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.repository.findAdminByEmail(email);
    if (!user || !user.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  recordSuccessfulLogin(userId: string, ipAddress?: string, userAgent?: string) {
    return this.repository.recordSuccessfulLogin(userId, ipAddress, userAgent);
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('The passwords do not match.');
    }

    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const now = new Date();
    const invitation = await this.repository.findInvitationByTokenHash(tokenHash);
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) {
      throw new BadRequestException('This invitation is invalid, expired, or already used. Ask an administrator for a new invitation.');
    }

    const passwordHash = await hash(dto.password, 12);
    try {
      const user = await this.repository.acceptInvitation({
        invitationId: invitation.id,
        invitedById: invitation.invitedById,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role as AdminRole,
        passwordHash,
        now,
      });
      if (!user) throw new BadRequestException('This invitation is invalid, expired, or already used.');
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('This email already has an account. Ask an administrator to review access.');
      }
      throw error;
    }
  }
}
