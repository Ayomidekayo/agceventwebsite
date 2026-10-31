import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminUsersModule } from './users/admin-users.module';

@Module({
  imports: [DashboardModule, AdminUsersModule],
  exports: [DashboardModule, AdminUsersModule],
})
export class AdminModule {}
