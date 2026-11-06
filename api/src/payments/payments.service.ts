import {
BadRequestException,
ConflictException,
Injectable,
Logger,
NotFoundException,
ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { createReference } from '../common/utils/reference.util';
import { isPrismaTransactionConflict } from '../common/utils/prisma-error.util';

import { PaystackService } from './providers/paystack.service';
import { PaymentsRepository } from './payments.repository';
import { InitializePaymentDto } from './dtos/initialize-payment.dto';
import { SubmitBankTransferDto } from './dtos/submit-bank-transfer.dto';

@Injectable()
export class PaymentsService {
private readonly logger = new Logger(PaymentsService.name);

constructor(
private readonly repository: PaymentsRepository,
private readonly paystack: PaystackService,
private readonly config: ConfigService,
) {}

async initialize(dto: InitializePaymentDto) {
const reference = createReference('AGNP');


let payment;

try {
  const result = await this.repository.createPendingPayment({
    purpose: dto.purpose,
    enquiryId: dto.enquiryId,
    commitmentId: dto.commitmentId,
    amount: dto.amount,
    reference,
    payerName: dto.payerName,
    payerEmail: dto.payerEmail,
    payerPhone: dto.payerPhone,
  });

  switch (result.kind) {
    case 'NOT_FOUND':
      throw new NotFoundException(
        'Sponsorship enquiry or commitment not found.',
      );

    case 'INVALID_COMMITMENT':
      throw new BadRequestException(
        'This sponsorship commitment cannot receive payments.',
      );

    case 'UNSUPPORTED_CURRENCY':
      throw new BadRequestException(
        'Only NGN payments are currently supported.',
      );

    case 'INVALID_AMOUNT':
      throw new BadRequestException('Invalid payment amount.');

    case 'NO_OUTSTANDING_BALANCE':
      throw new ConflictException(
        'This sponsorship commitment has no outstanding balance.',
      );

    case 'EXCEEDS_BALANCE':
      throw new BadRequestException(
        'Payment amount exceeds the outstanding commitment balance.',
      );

    case 'CREATED':
      payment = result.payment;
      break;
  }
} catch (error) {
  if (isPrismaTransactionConflict(error)) {
    throw new ConflictException(
      'Another payment is being processed. Please try again.',
    );
  }

  throw error;
}

const amountInKobo = Number(payment.amount.mul(100).toFixed(0));

if (!Number.isSafeInteger(amountInKobo)) {
  await this.repository.markInitializationFailed(reference);

  throw new BadRequestException(
    'Payment amount is outside the supported range.',
  );
}

const callbackUrl = this.config.get<string>(
  'PAYSTACK_CALLBACK_URL',
);

if (!callbackUrl) {
  await this.repository.markInitializationFailed(reference);

  throw new ServiceUnavailableException(
    'Payment callback URL is not configured.',
  );
}
let response;

try {
  response = await this.paystack.initializeTransaction({
    email: payment.payerEmail,
    amount: amountInKobo,
    reference,
    callbackUrl,
    metadata: {
      paymentReference: reference,
      enquiryId: payment.enquiryId,
      commitmentId: payment.commitmentId,
      eventId: payment.eventId,
      purpose: payment.purpose,
    },
  });
} catch (error) {
  await this.repository.markInitializationFailed(reference);

  this.logger.error(
    `Paystack initialization failed for ${reference}`,
  );

  throw error;
}

try {
  await this.repository.updateAuthorization({
    reference,
    authorizationUrl: response.data.authorization_url,
    providerReference: response.data.reference,
  });
} catch (error) {
  // Paystack may already have created the transaction.
  // Keep the database payment PENDING for reconciliation.
  this.logger.error(
    `Paystack transaction initialized but authorization persistence failed for ${reference}`,
  );

  throw new ServiceUnavailableException(
    'Payment was initialized but could not be prepared for checkout. Please contact support before attempting another payment.',
  );
}

return {
  success: true,
  reference,
  authorizationUrl: response.data.authorization_url,
};


}

async verify(reference: string) {
const payment = await this.repository.findByReference(reference);

if (!payment) {
  throw new NotFoundException('Payment not found.');
}

if (payment.status === 'SUCCESSFUL') {
  return {
    success: true,
    status: 'SUCCESSFUL',
    reference,
  };
}

const response = await this.paystack.verifyTransaction(reference);
const transaction = response.data;

if (transaction.reference !== payment.reference) {
  throw new BadRequestException(
    'Transaction reference mismatch.',
  );
}

if (transaction.status !== 'success') {
  return {
    success: false,
    status: transaction.status,
    reference,
  };
}

const amount = payment.amount.toString();

if (
  transaction.amount !== Number(payment.amount.mul(100).toFixed(0)) ||
  transaction.currency !== payment.currency
) {
  throw new ConflictException(
    'Verified transaction amount or currency does not match the payment.',
  );
}

try {
  const result = await this.repository.settleVerifiedPayment({
    reference,
    providerReference: String(transaction.id),
    amount,
    currency: transaction.currency,
    providerResponse:
      response as unknown as import('../prisma/prisma-exports').Prisma.InputJsonValue,
  });

  if (
    result.kind === 'NOT_FOUND' ||
    result.kind === 'INVALID_STATUS' ||
    result.kind === 'INVALID_COMMITMENT' ||
    result.kind === 'INVALID_ENQUIRY' ||
    result.kind === 'CURRENCY_MISMATCH' ||
    result.kind === 'EXCEEDS_COMMITMENT' ||
    result.kind === 'PAYMENT_MISMATCH'
  ) {
    throw new ConflictException(
      'The payment could not be safely recorded.',
    );
  }

  return {
    success: true,
    status: 'SUCCESSFUL',
    reference,
  };
} catch (error) {
  if (isPrismaTransactionConflict(error)) {
    throw new ConflictException(
      'Payment processing is being completed. Please retry shortly.',
    );
  }

  throw error;

}

}

verifyWebhookSignature(
rawBody: Buffer,
signature?: string,
): boolean {
const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');

if (!secret || !signature || !Buffer.isBuffer(rawBody)) {
  return false;
}

const expected = createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex');

const expectedBuffer = Buffer.from(expected, 'hex');
const suppliedBuffer = Buffer.from(signature, 'hex');

return (
  expectedBuffer.length === suppliedBuffer.length &&
  timingSafeEqual(expectedBuffer, suppliedBuffer)
);


}

async handleWebhook(event: {
event?: string;
data?: { reference?: string };
}) {
if (event.event !== 'charge.success') {
return { received: true };
}

const reference = event.data?.reference;

if (!reference) {
  throw new BadRequestException(
    'Webhook transaction reference is missing.',
  );
}

await this.verify(reference);

return { received: true };


}
getBankDetails() {
  const bankName = this.config.get<string>('BANK_TRANSFER_BANK_NAME');
  const accountName = this.config.get<string>('BANK_TRANSFER_ACCOUNT_NAME');
  const accountNumber = this.config.get<string>('BANK_TRANSFER_ACCOUNT_NUMBER');

  if (!bankName || !accountName || !accountNumber) {
    throw new ServiceUnavailableException(
      'Bank transfer details are not currently available.',
    );
  }

  return {
    bankName,
    accountName,
    accountNumber,
    currency: 'NGN',
  };
}

async submitBankTransfer(dto: SubmitBankTransferDto) {

 const amount = dto.amount.trim();

if (
  !/^\d{1,12}(\.\d{1,2})?$/.test(amount) ||
  !Number.isFinite(Number(amount)) ||
  Number(amount) <= 0
) {
  throw new BadRequestException(
    'Enter a valid contribution amount.',
  );
}

  if (dto.proofUrl && !dto.proofUrl.startsWith('https://')) {
    throw new BadRequestException(
      'The proof URL must use a secure HTTPS address.',
    );
  }

  const reference = createReference('AGN');

  try {
    const result = await this.repository.createBankTransferPayment({
      enquiryId: dto.enquiryId,
      commitmentId: dto.commitmentId,
      amount,
      reference,
      payerName: dto.payerName,
      payerEmail: dto.payerEmail,
      payerPhone: dto.payerPhone,
      transferSenderName: dto.transferSenderName,
      transferReference: dto.transferReference,
      transferDate: dto.transferDate,
      proofUrl: dto.proofUrl,
    });

    switch (result.kind) {
      case 'NOT_FOUND':
        throw new NotFoundException('Sponsorship enquiry not found.');

      case 'INVALID_AMOUNT':
        throw new BadRequestException('Invalid transfer amount.');

      case 'INVALID_COMMITMENT':
        throw new BadRequestException(
          'This sponsorship commitment cannot receive payments.',
        );

      case 'UNSUPPORTED_CURRENCY':
        throw new BadRequestException('Only NGN transfers are supported.');

      case 'NO_OUTSTANDING_BALANCE':
        throw new ConflictException(
          'This sponsorship commitment has no outstanding balance.',
        );

      case 'EXCEEDS_BALANCE':
        throw new BadRequestException(
          'The transfer amount exceeds the outstanding commitment balance.',
        );

      case 'CREATED':
        return {
          success: true,
          message: 'Transfer details submitted. Awaiting administrator verification.',
          reference: result.payment.reference,
          status: result.payment.status,
        };
    }
  } catch (error) {
    if (isPrismaTransactionConflict(error)) {
      throw new ConflictException(
        'Another payment is being processed. Please try again.',
      );
    }

    throw error;
  }
}

async listBankTransfers(input: {
  page: number;
  limit: number;
  status?: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  search?: string;
}) {
  return this.repository.listBankTransfers(input);
}

async verifyBankTransfer(paymentId: string, actorId: string) {
  const result = await this.repository.verifyBankTransfer(
    paymentId,
    actorId,
  );

  switch (result.kind) {
    case 'NOT_FOUND':
      throw new NotFoundException('Bank transfer not found.');

    case 'INVALID_PROVIDER':
      throw new BadRequestException(
        'This payment is not a bank transfer.',
      );

    case 'INVALID_STATUS':
      throw new ConflictException(
        'Only pending bank transfers can be verified.',
      );

    case 'INVALID_COMMITMENT':
    case 'INVALID_ENQUIRY':
    case 'EXCEEDS_COMMITMENT':
      throw new ConflictException(
        'The payment could not be safely verified.',
      );

    case 'ALREADY_PROCESSED':
      throw new ConflictException('This payment has already been processed.');

    case 'VERIFIED':
      return {
        success: true,
        message: 'Bank transfer successfully verified.',
        payment: result.payment,
      };
  }
}

async rejectBankTransfer(
  paymentId: string,
  actorId: string,
  reason: string,
) {
  const normalizedReason = reason?.trim();

  if (!normalizedReason) {
    throw new BadRequestException(
      'A rejection reason is required.',
    );
  }

  if (normalizedReason.length > 500) {
    throw new BadRequestException(
      'The rejection reason cannot exceed 500 characters.',
    );
  }

  const result = await this.repository.rejectBankTransfer(
    paymentId,
    actorId,
    normalizedReason,
  );

  // Keep your existing switch statement below.

}

}
