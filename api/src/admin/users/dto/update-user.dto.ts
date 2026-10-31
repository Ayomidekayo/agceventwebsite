import { AdminRole } from '../../../prisma/prisma-exports';
import { IsBoolean, IsEnum } from 'class-validator';

export class SetUserActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class UpdateUserRoleDto {
  @IsEnum(AdminRole)
  role!: AdminRole;
}
