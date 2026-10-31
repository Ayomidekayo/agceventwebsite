import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AdminVolunteersController, PublicVolunteersController } from './volunteers.controller';
import { VolunteersRepository } from './volunteers.repository';
import { VolunteersService } from './volunteers.service';

@Module({
  imports: [CommonModule],
  controllers: [PublicVolunteersController, AdminVolunteersController],
  providers: [VolunteersService, VolunteersRepository],
  exports: [VolunteersService],
})
export class VolunteersModule {}
