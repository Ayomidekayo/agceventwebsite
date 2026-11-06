import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';

import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { PaystackService } from './providers/paystack.service';


import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentsController } from './PaymentsController';

@Module({
  imports: [CommonModule],

  controllers: [
    PaymentsController,
    AdminPaymentsController,
  ],

  providers: [
    PaymentsRepository,
    PaymentsService,
    PaystackService,
  ],

  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule {}