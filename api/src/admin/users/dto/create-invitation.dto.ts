import { AdminRole } from '../../../prisma/prisma-exports';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(2) @MaxLength(140)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254)
  email!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}
