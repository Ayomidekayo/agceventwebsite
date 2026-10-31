import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AdminRole } from '../../prisma/prisma-exports';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { AuthenticatedRequest } from '../../common/types';
import { DashboardService } from './dashboard.service';

const dashboardRoles: AdminRole[] = [
  'SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_MANAGER', 'SPONSORSHIP_MANAGER',
  'VOLUNTEER_MANAGER', 'CHECK_IN_OFFICER', 'REPORT_VIEWER', 'CONTENT_MANAGER',
];

@Controller('admin/dashboard')
@UseGuards(SessionAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(...dashboardRoles)
  getSummary(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getSummary(request.adminUser!.role);
  }
}
