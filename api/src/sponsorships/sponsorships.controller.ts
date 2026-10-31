import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import type { AuthenticatedRequest } from '../common/types';
import { CreateSponsorshipEnquiryDto } from './sponsorships.dto';
import { SponsorshipsService } from './sponsorships.service';
import { UpdateSponsorshipStatusDto } from './dto/update-sponsorship-status.dto';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Controller('sponsorship-enquiries')
export class PublicSponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  create(@Body() dto: CreateSponsorshipEnquiryDto) {
    return this.sponsorshipsService.createEnquiry(dto);
  }
}

@Controller('admin/sponsorship')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'EVENT_ADMIN', 'SPONSORSHIP_MANAGER')
export class AdminSponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Get()
  list(@Query('search') search = '', @Query('limit') limit = '25', @Query('page') page = '1') {
    return this.sponsorshipsService.listForAdmin(search, page, limit);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSponsorshipStatusDto, @Req() request: AuthenticatedRequest) {
    return this.sponsorshipsService.updateEnquiryStatus(id, dto.status, request.adminUser!.id);
  }

  @Post('commitments')
  createCommitment(@Body() dto: CreateCommitmentDto, @Req() request: AuthenticatedRequest) {
    return this.sponsorshipsService.createCommitment(dto, request.adminUser!.id);
  }

  @Post('commitments/:id/receipts')
  addReceipt(@Param('id') id: string, @Body() dto: CreateReceiptDto, @Req() request: AuthenticatedRequest) {
    return this.sponsorshipsService.addReceipt(id, dto, request.adminUser!.id);
  }

  @Get('commitments')
  commitments() {
    return this.sponsorshipsService.listCommitments();
  }
}
