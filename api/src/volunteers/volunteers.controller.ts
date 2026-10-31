import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { VolunteerStatus } from '../prisma/prisma-exports';
import { IsEnum } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import type { AuthenticatedRequest } from '../common/types';
import { CreateVolunteerDto } from './volunteers.dto';
import { VolunteersService } from './volunteers.service';

class UpdateVolunteerStatusDto {
  @IsEnum(VolunteerStatus)
  status!: VolunteerStatus;
}

@Controller('volunteers')
export class PublicVolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post()
  create(@Body() dto: CreateVolunteerDto) {
    return this.volunteersService.create(dto);
  }
}

@Controller('admin/volunteers')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'EVENT_ADMIN', 'VOLUNTEER_MANAGER')
export class AdminVolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get()
  list(@Query('search') search = '', @Query('limit') limit = '25', @Query('page') page = '1') {
    return this.volunteersService.listForAdmin(search, page, limit);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVolunteerStatusDto, @Req() request: AuthenticatedRequest) {
    return this.volunteersService.updateStatus(id, dto.status, request.adminUser!.id);
  }
}
