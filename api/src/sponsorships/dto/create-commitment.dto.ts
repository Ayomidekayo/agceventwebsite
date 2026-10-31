import { SponsorshipCommitmentStatus } from '../../prisma/prisma-exports';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCommitmentDto {
  @IsOptional() @IsString() enquiryId?: string;
  @IsString() @MinLength(2) @MaxLength(180) sponsorName!: string;
  @IsString() @MinLength(2) @MaxLength(100) supportType!: string;
  @IsOptional() @IsString() @Matches(/^\d+(?:\.\d{1,2})?$/) amount?: string;
  @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/) currency?: string;
  @IsOptional() @IsEnum(SponsorshipCommitmentStatus) status?: SponsorshipCommitmentStatus;
  @IsOptional() @IsString() @MaxLength(3000) notes?: string;
}
