import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';

import type { AuthenticatedRequest } from '../common/types';

import { PaymentsService } from './payments.service';
import { RejectBankTransferDto } from './dtos/reject-bank-transfer.dto';

@Controller('admin/payments')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'EVENT_ADMIN', 'SPONSORSHIP_MANAGER')
export class AdminPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('transfers')
  listTransfers(
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = Math.max(
      1,
      Number.parseInt(page, 10) || 1,
    );

    const parsedLimit = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 25),
    );

    const allowedStatuses = [
      'PENDING',
      'SUCCESSFUL',
      'FAILED',
    ];

    const normalizedStatus = status?.trim().toUpperCase();

    if (
      normalizedStatus &&
      !allowedStatuses.includes(normalizedStatus)
    ) {
      throw new BadRequestException(
        'Invalid payment status.',
      );
    }

    return this.paymentsService.listBankTransfers({
      page: parsedPage,
      limit: parsedLimit,
      status: normalizedStatus as
        | 'PENDING'
        | 'SUCCESSFUL'
        | 'FAILED'
        | undefined,
      search: search?.trim(),
    });
  }

  @Patch('transfers/:id/verify')
  verifyTransfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.paymentsService.verifyBankTransfer(
      id,
      request.adminUser!.id,
    );
  }

  @Patch('transfers/:id/reject')
  rejectTransfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectBankTransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.paymentsService.rejectBankTransfer(
      id,
      request.adminUser!.id,
      dto.reason,
    );
  }
}