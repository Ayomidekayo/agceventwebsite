import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateRegistrationDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(80) firstName!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(80) lastName!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsEmail() @MaxLength(254) email!: string;
  @Transform(trim) @IsString() @MinLength(7) @MaxLength(30) phone!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(160) affiliation?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(80) occupation?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) interest?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(80) source?: string;
  @IsBoolean() consentToPrivacy!: boolean;
}
