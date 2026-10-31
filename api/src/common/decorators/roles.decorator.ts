import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '../../prisma/prisma-exports';

export const ROLES_KEY = 'agn:roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
