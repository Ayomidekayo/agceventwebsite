import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AdminRegistrationsController, PublicRegistrationsController } from './registrations.controller';
import { RegistrationsRepository } from './registrations.repository';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [CommonModule],
  controllers: [PublicRegistrationsController, AdminRegistrationsController],
  providers: [RegistrationsService, RegistrationsRepository],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
