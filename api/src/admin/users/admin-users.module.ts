import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersRepository } from './admin-users.repository';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [CommonModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminUsersRepository],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
