import type { AdminRole } from '../prisma/prisma-exports';
import type { Request } from 'express';

export interface SafeAdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
}

export type AuthenticatedRequest = Request & {
  adminUser?: SafeAdminUser;
};

export type RoleName = AdminRole;
