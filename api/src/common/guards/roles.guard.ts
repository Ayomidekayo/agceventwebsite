import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '../../prisma/prisma-exports';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.adminUser || !allowed.includes(request.adminUser.role)) {
      throw new ForbiddenException('Your account does not have permission to perform this action.');
    }
    return true;
  }
}
