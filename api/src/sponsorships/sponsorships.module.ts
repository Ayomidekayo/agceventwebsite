import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AdminSponsorshipsController, PublicSponsorshipsController } from './sponsorships.controller';
import { SponsorshipsRepository } from './sponsorships.repository';
import { SponsorshipsService } from './sponsorships.service';

@Module({
  imports: [CommonModule],
  controllers: [PublicSponsorshipsController, AdminSponsorshipsController],
  providers: [SponsorshipsService, SponsorshipsRepository],
  exports: [SponsorshipsService],
})
export class SponsorshipsModule {}
