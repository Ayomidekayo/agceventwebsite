import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.session?.userId;
    if (!userId) throw new UnauthorizedException('Please sign in to continue.');

    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      request.session?.destroy(() => undefined);
      throw new UnauthorizedException('This account is not active.');
    }

    request.adminUser = user;
    return true;
  }
}
