import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateVolunteerDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(140) fullName!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsEmail() @MaxLength(254) email!: string;
  @Transform(trim) @IsString() @MinLength(7) @MaxLength(30) phone!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) location?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(80) occupation?: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(100) department!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(2000) experience?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) availability?: string;
  @Transform(trim) @IsString() @MinLength(10) @MaxLength(3000) motivation!: string;
  @IsBoolean() consentToPrivacy!: boolean;
}
