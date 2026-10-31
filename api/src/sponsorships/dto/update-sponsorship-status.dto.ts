import { SponsorshipStatus } from '../../prisma/prisma-exports';
import { IsEnum } from 'class-validator';

export class UpdateSponsorshipStatusDto {
  @IsEnum(SponsorshipStatus)
  status!: SponsorshipStatus;
}
