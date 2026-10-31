import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RegistrationStatus } from '../prisma/prisma-exports';
import { IsEnum } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import type { AuthenticatedRequest } from '../common/types';
import { CreateRegistrationDto } from './registrations.dto';
import { RegistrationsService } from './registrations.service';

class UpdateRegistrationStatusDto {
  @IsEnum(RegistrationStatus)
  status!: RegistrationStatus;
}

const registrationRoles = ['SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_MANAGER', 'CHECK_IN_OFFICER'] as const;

@Controller('registrations')
export class PublicRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(dto);
  }
}

@Controller('admin/registrations')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...registrationRoles)
export class AdminRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get()
  list(
    @Query('search') search = '',
    @Query('limit') limit = '25',
    @Query('page') page = '1',
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationsService.listForAdmin(search, page, limit, request.adminUser!.role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationsService.updateStatus(id, dto.status, request.adminUser!.role, request.adminUser!.id);
  }
}
