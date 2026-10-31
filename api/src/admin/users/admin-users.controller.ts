import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { AuthenticatedRequest } from '../../common/types';
import { AdminUsersService } from './admin-users.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { SetUserActiveDto, UpdateUserRoleDto } from './dto/update-user.dto';

@Controller('admin/users')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers() {
    return this.adminUsersService.listUsers();
  }

  @Post('invitations')
  createInvitation(@Body() dto: CreateInvitationDto, @Req() request: AuthenticatedRequest) {
    return this.adminUsersService.createInvitation(dto, request.adminUser!.id);
  }

  @Patch(':id/active')
  setUserActive(@Param('id') id: string, @Body() dto: SetUserActiveDto, @Req() request: AuthenticatedRequest) {
    return this.adminUsersService.setUserActive(id, dto.isActive, request.adminUser!.id);
  }

  @Patch(':id/role')
  setUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto, @Req() request: AuthenticatedRequest) {
    return this.adminUsersService.setUserRole(id, dto.role, request.adminUser!.id);
  }
}
