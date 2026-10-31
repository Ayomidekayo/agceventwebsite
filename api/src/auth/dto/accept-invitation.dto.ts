import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @MinLength(64)
  @MaxLength(128)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  confirmPassword!: string;
}
