import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateSponsorshipEnquiryDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) sponsorType!: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(140) name!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(180) organisation?: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsEmail() @MaxLength(254) email!: string;
  @Transform(trim) @IsString() @MinLength(7) @MaxLength(30) phone!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) supportLevel?: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(100) supportType!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(80) amount?: string;
  @Transform(trim) @IsString() @MinLength(10) @MaxLength(3000) message!: string;
  @IsBoolean() consentToPrivacy!: boolean;
}
