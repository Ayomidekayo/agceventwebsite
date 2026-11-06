import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from '../interfaces/paystack.interface';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);

  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly config: ConfigService) {}

  private get secretKey(): string {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');

    if (!key || !/^sk_(test|live)_/.test(key)) {
      throw new InternalServerErrorException(
        'Paystack server configuration is invalid.',
      );
    }

    return key;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(input: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
  }): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: input.email,
          amount: input.amount,
          currency: 'NGN',
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: input.metadata,
        },
        {
          headers: this.headers,
          timeout: 15000,
        },
      );

      const result = response.data;

      if (
        !result.status ||
        !result.data?.authorization_url ||
        result.data.reference !== input.reference
      ) {
        throw new Error('Invalid Paystack initialization response.');
      }

      return result;
    } catch (error) {
      this.logger.error(
        'Paystack transaction initialization failed.',
        error instanceof Error ? error.message : undefined,
      );

      throw new ServiceUnavailableException(
        'Unable to initialize payment. Please try again.',
      );
    }
  }

  async verifyTransaction(
    reference: string,
  ): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get<PaystackVerifyResponse>(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: this.headers,
          timeout: 15000,
        },
      );

      const result = response.data;

      if (!result.status || !result.data) {
        throw new Error('Invalid Paystack verification response.');
      }

      return result;
    } catch (error) {
      this.logger.error(
        'Paystack transaction verification failed.',
        error instanceof Error ? error.message : undefined,
      );

      throw new ServiceUnavailableException(
        'Unable to verify payment at this time.',
      );
    }
  }
}