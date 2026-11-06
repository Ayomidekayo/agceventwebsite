import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';

import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dtos/initialize-payment.dto';
import { SubmitBankTransferDto } from './dtos/submit-bank-transfer.dto';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Initialize Paystack payment.
   * POST /api/v1/payments/initialize
   */
  @Post('initialize')
  initialize(@Body() dto: InitializePaymentDto) {
    return this.paymentsService.initialize(dto);
  }

  /**
   * Verify Paystack payment.
   * GET /api/v1/payments/verify/:reference
   */
  @Get('verify/:reference')
  verify(@Param('reference') reference: string) {
    return this.paymentsService.verify(reference);
  }

  /**
   * Retrieve authorised bank account details.
   * GET /api/v1/payments/bank-details
   */
  @Get('bank-details')
  getBankDetails() {
    return this.paymentsService.getBankDetails();
  }

  /**
   * Submit bank transfer details for admin verification.
   * POST /api/v1/payments/bank-transfer
   */
  @Post('bank-transfer')
  submitBankTransfer(@Body() dto: SubmitBankTransferDto) {
    return this.paymentsService.submitBankTransfer(dto);
  }

  /**
   * Receive and verify Paystack webhook notifications.
   * POST /api/v1/payments/webhook
   */
  @Post('webhook')
  async webhook(
    @Req() request: RawBodyRequest,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const rawBody = request.rawBody;

    if (
      !rawBody ||
      !this.paymentsService.verifyWebhookSignature(rawBody, signature)
    ) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    return this.paymentsService.handleWebhook(request.body);
  }
}