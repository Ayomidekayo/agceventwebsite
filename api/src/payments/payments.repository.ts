import { Injectable } from '@nestjs/common';
import {
Prisma,
SponsorshipCommitmentStatus,
} from '../prisma/prisma-exports';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsRepository {
constructor(private readonly prisma: PrismaService) {}

async createPendingPayment(input: {
purpose: 'DIRECT_SPONSORSHIP' | 'SPONSORSHIP_COMMITMENT';
enquiryId?: string;
commitmentId?: string;
amount: string;
reference: string;
payerName: string;
payerEmail: string;
payerPhone?: string;
}) {
return this.prisma.$transaction(
async (tx) => {
const amount = new Prisma.Decimal(input.amount);


    if (!amount.greaterThan(0)) {
      return { kind: 'INVALID_AMOUNT' as const };
    }

    if (input.purpose === 'DIRECT_SPONSORSHIP') {
      if (!input.enquiryId) {
        return { kind: 'NOT_FOUND' as const };
      }

      const enquiry = await tx.sponsorshipEnquiry.findFirst({
        where: {
          id: input.enquiryId,
          event: {
            status: 'PUBLISHED',
          },
        },
      });

      if (!enquiry) {
        return { kind: 'NOT_FOUND' as const };
      }

      const payment = await tx.payment.create({
        data: {
          eventId: enquiry.eventId,
          enquiryId: enquiry.id,
          commitmentId: null,
          purpose: 'DIRECT_SPONSORSHIP',
          provider: 'PAYSTACK',
          status: 'PENDING',
          reference: input.reference,
          amount,
          currency: 'NGN',
          payerName: input.payerName.trim(),
          payerEmail: input.payerEmail.trim().toLowerCase(),
          payerPhone: input.payerPhone || null,
        },
      });

      return {
        kind: 'CREATED' as const,
        payment,
      };
    }

    if (!input.commitmentId) {
      return { kind: 'NOT_FOUND' as const };
    }

    const commitment = await tx.sponsorshipCommitment.findFirst({
      where: {
        id: input.commitmentId,
        event: {
          status: 'PUBLISHED',
        },
      },
    });

    if (!commitment) {
      return { kind: 'NOT_FOUND' as const };
    }

    if (
  commitment.status === 'PROPOSED' ||
  commitment.status === 'CANCELLED' ||
  commitment.amount === null ||
  !commitment.amount.greaterThan(0)
) {
  return { kind: 'INVALID_COMMITMENT' as const };
}

    if (commitment.currency !== 'NGN') {
      return { kind: 'UNSUPPORTED_CURRENCY' as const };
    }

    const received = await tx.sponsorshipReceipt.aggregate({
      where: {
        commitmentId: commitment.id,
        currency: commitment.currency,
      },
      _sum: {
        amount: true,
      },
    });

    const pending = await tx.payment.aggregate({
      where: {
        commitmentId: commitment.id,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
      _sum: {
        amount: true,
      },
    });

    const receivedAmount = new Prisma.Decimal(
      received._sum.amount ?? 0,
    );

    const pendingAmount = new Prisma.Decimal(
      pending._sum.amount ?? 0,
    );

    const outstanding = commitment.amount
      .minus(receivedAmount)
      .minus(pendingAmount);

    if (!outstanding.greaterThan(0)) {
      return { kind: 'NO_OUTSTANDING_BALANCE' as const };
    }

    if (amount.greaterThan(outstanding)) {
      return { kind: 'EXCEEDS_BALANCE' as const };
    }

    const payment = await tx.payment.create({
      data: {
        eventId: commitment.eventId,
        commitmentId: commitment.id,
        enquiryId: commitment.enquiryId,
        purpose: 'SPONSORSHIP_COMMITMENT',
        provider: 'PAYSTACK',
        status: 'PENDING',
        reference: input.reference,
        amount,
        currency: commitment.currency,
        payerName: input.payerName.trim(),
        payerEmail: input.payerEmail.trim().toLowerCase(),
        payerPhone: input.payerPhone || null,
      },
    });

    return {
      kind: 'CREATED' as const,
      payment,
    };
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
);


}

async updateAuthorization(input: {
reference: string;
authorizationUrl: string;
providerReference: string;
}) {
return this.prisma.payment.update({
where: {
reference: input.reference,
},
data: {
authorizationUrl: input.authorizationUrl,
providerReference: input.providerReference,
},
});
}

findByReference(reference: string) {
return this.prisma.payment.findUnique({
where: { reference },
});
}

async markInitializationFailed(reference: string) {
return this.prisma.payment.updateMany({
where: {
reference,
status: 'PENDING',
},
data: {
status: 'FAILED',
failureReason: 'Paystack initialization failed.',
},
});
}

async settleVerifiedPayment(input: {
reference: string;
providerReference: string;
amount: string;
currency: string;
providerResponse: Prisma.InputJsonValue;
}) {
return this.prisma.$transaction(
async (tx) => {
const payment = await tx.payment.findUnique({
where: {
reference: input.reference,
},
});


    if (!payment) {
      return { kind: 'NOT_FOUND' as const };
    }

    if (payment.status === 'SUCCESSFUL') {
      return { kind: 'ALREADY_PROCESSED' as const };
    }

    if (
      payment.status !== 'PENDING' &&
      payment.status !== 'PROCESSING'
    ) {
      return { kind: 'INVALID_STATUS' as const };
    }

    if (
      !payment.amount.equals(new Prisma.Decimal(input.amount)) ||
      payment.currency !== input.currency ||
      payment.provider !== 'PAYSTACK'
    ) {
      return { kind: 'PAYMENT_MISMATCH' as const };
    }

    if (payment.purpose === 'SPONSORSHIP_COMMITMENT') {
      if (!payment.commitmentId) {
        return { kind: 'INVALID_COMMITMENT' as const };
      }

      const commitment = await tx.sponsorshipCommitment.findUnique({
        where: { id: payment.commitmentId },
      });

      if (!commitment || !commitment.amount) {
        return { kind: 'INVALID_COMMITMENT' as const };
      }

      if (commitment.currency !== payment.currency) {
        return { kind: 'CURRENCY_MISMATCH' as const };
      }

      const existingReceipt = await tx.sponsorshipReceipt.findUnique({
        where: { paymentId: payment.id },
      });

      if (existingReceipt) {
        return { kind: 'ALREADY_PROCESSED' as const };
      }

      const receipts = await tx.sponsorshipReceipt.aggregate({
        where: {
          commitmentId: commitment.id,
          currency: commitment.currency,
        },
        _sum: {
          amount: true,
        },
      });

      const totalReceived = new Prisma.Decimal(
        receipts._sum.amount ?? 0,
      ).plus(payment.amount);

      if (totalReceived.greaterThan(commitment.amount)) {
        return { kind: 'EXCEEDS_COMMITMENT' as const };
      }

      const nextStatus: SponsorshipCommitmentStatus =
        totalReceived.greaterThanOrEqualTo(commitment.amount)
          ? 'RECEIVED'
          : 'PARTIALLY_RECEIVED';

      await tx.sponsorshipReceipt.create({
        data: {
          commitmentId: commitment.id,
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          reference: payment.reference,
          verifiedById: null,
          notes: 'Automatically verified through Paystack.',
        },
      });

      await tx.sponsorshipCommitment.update({
        where: { id: commitment.id },
        data: { status: nextStatus },
      });
    }

 if (payment.purpose === 'DIRECT_SPONSORSHIP') {
  if (!payment.enquiryId) {
    return { kind: 'INVALID_ENQUIRY' as const };
  }

  const enquiry = await tx.sponsorshipEnquiry.findFirst({
    where: {
      id: payment.enquiryId,
      eventId: payment.eventId,
    },
  });

  if (!enquiry) {
    return { kind: 'INVALID_ENQUIRY' as const };
  }

  const existingReceipt = await tx.sponsorshipReceipt.findUnique({
    where: {
      paymentId: payment.id,
    },
  });

  if (existingReceipt) {
    return { kind: 'ALREADY_PROCESSED' as const };
  }

  await tx.sponsorshipReceipt.create({
    data: {
      paymentId: payment.id,
      commitmentId: null,
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.reference,
      verifiedById: null,
      notes:
        'Automatically verified direct sponsorship payment through Paystack.',
    },
  });
}
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESSFUL',
        providerReference: input.providerReference,
        paidAt: new Date(),
        providerResponse: input.providerResponse,
        failureReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'PAYSTACK_PAYMENT_VERIFIED',
        entityType: 'Payment',
        entityId: payment.id,
        metadata: {
          reference: payment.reference,
          enquiryId: payment.enquiryId,
          commitmentId: payment.commitmentId,
          purpose: payment.purpose,
          amount: payment.amount.toString(),
          currency: payment.currency,
        },
      },
    });

    return {
      kind: 'CREATED' as const,
      payment: updatedPayment,
    };
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
);


}


async createBankTransferPayment(input: {
  enquiryId: string;
  commitmentId?: string;
  amount: string;
  reference: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  transferSenderName: string;
  transferReference: string;
  transferDate: string;
  proofUrl?: string;
}) {
  return this.prisma.$transaction(
    async (tx) => {
      const amount = new Prisma.Decimal(input.amount);

      if (!amount.greaterThan(0)) {
        return { kind: 'INVALID_AMOUNT' as const };
      }

      if (input.commitmentId) {
        const commitment = await tx.sponsorshipCommitment.findFirst({
          where: {
            id: input.commitmentId,
            enquiryId: input.enquiryId,
            event: { status: 'PUBLISHED' },
          },
        });

       if (
  !commitment ||
  commitment.amount === null ||
  !commitment.amount.greaterThan(0)
) {
  return { kind: 'INVALID_COMMITMENT' as const };
}

        if (
          commitment.status === 'PROPOSED' ||
          commitment.status === 'CANCELLED'
        ) {
          return { kind: 'INVALID_COMMITMENT' as const };
        }

        if (commitment.currency !== 'NGN') {
          return { kind: 'UNSUPPORTED_CURRENCY' as const };
        }

        const received = await tx.sponsorshipReceipt.aggregate({
          where: {
            commitmentId: commitment.id,
            currency: 'NGN',
          },
          _sum: { amount: true },
        });

        const pending = await tx.payment.aggregate({
          where: {
            commitmentId: commitment.id,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
          _sum: { amount: true },
        });

        const outstanding = commitment.amount
          .minus(received._sum.amount ?? 0)
          .minus(pending._sum.amount ?? 0);

        if (!outstanding.greaterThan(0)) {
          return { kind: 'NO_OUTSTANDING_BALANCE' as const };
        }

        if (amount.greaterThan(outstanding)) {
          return { kind: 'EXCEEDS_BALANCE' as const };
        }
      }

      const enquiry = await tx.sponsorshipEnquiry.findFirst({
        where: {
          id: input.enquiryId,
          event: { status: 'PUBLISHED' },
        },
      });

      if (!enquiry) {
        return { kind: 'NOT_FOUND' as const };
      }

      const payment = await tx.payment.create({
        data: {
          eventId: enquiry.eventId,
          enquiryId: enquiry.id,
          commitmentId: input.commitmentId ?? null,
          purpose: input.commitmentId
            ? 'SPONSORSHIP_COMMITMENT'
            : 'DIRECT_SPONSORSHIP',
          provider: 'BANK_TRANSFER',
          status: 'PENDING',
          reference: input.reference,
          amount,
          currency: 'NGN',
          payerName: input.payerName.trim(),
          payerEmail: input.payerEmail.trim().toLowerCase(),
          payerPhone: input.payerPhone || null,
          metadata: {
            transferSenderName: input.transferSenderName.trim(),
            transferReference: input.transferReference.trim(),
            transferDate: input.transferDate,
            proofUrl: input.proofUrl ?? null,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      return {
        kind: 'CREATED' as const,
        payment,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
async listBankTransfers(input: {
  page: number;
  limit: number;
  status?: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  search?: string;
}) {
  const where: Prisma.PaymentWhereInput = {
    provider: 'BANK_TRANSFER',
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { reference: { contains: input.search, mode: 'insensitive' } },
            { payerName: { contains: input.search, mode: 'insensitive' } },
            { payerEmail: { contains: input.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await this.prisma.$transaction([
    this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
        purpose: true,
        payerName: true,
        payerEmail: true,
        payerPhone: true,
        enquiryId: true,
        commitmentId: true,
        metadata: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    this.prisma.payment.count({ where }),
  ]);

  return {
    items,
    total,
    page: input.page,
    limit: input.limit,
    pageCount: Math.ceil(total / input.limit),
  };
}
async rejectBankTransfer(
  paymentId: string,
  actorId: string,
  reason: string,
) {
  return this.prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return { kind: 'NOT_FOUND' as const };
    }

    if (payment.provider !== 'BANK_TRANSFER') {
      return { kind: 'INVALID_PROVIDER' as const };
    }

    if (payment.status !== 'PENDING') {
      return { kind: 'INVALID_STATUS' as const };
    }

    const oldMetadata =
      payment.metadata &&
      typeof payment.metadata === 'object' &&
      !Array.isArray(payment.metadata)
        ? payment.metadata
        : {};

    const updatedMetadata = {
      ...oldMetadata,
      rejectionReason: reason.trim(),
      rejectedAt: new Date().toISOString(),
      rejectedBy: actorId,
    };

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: reason.trim(),
        metadata: updatedMetadata as Prisma.InputJsonValue,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: 'BANK_TRANSFER_REJECTED',
        entityType: 'Payment',
        entityId: payment.id,
        metadata: {
          reference: payment.reference,
          reason: reason.trim(),
        },
      },
    });

    return {
      kind: 'REJECTED' as const,
      payment: updated,
    };
  });
}

async verifyBankTransfer(paymentId: string, actorId: string) {
  return this.prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return { kind: 'NOT_FOUND' as const };
      }

      if (payment.provider !== 'BANK_TRANSFER') {
        return { kind: 'INVALID_PROVIDER' as const };
      }

      if (payment.status === 'SUCCESSFUL') {
        return { kind: 'ALREADY_PROCESSED' as const };
      }

      if (payment.status !== 'PENDING') {
        return { kind: 'INVALID_STATUS' as const };
      }

      if (payment.purpose === 'SPONSORSHIP_COMMITMENT') {
        if (!payment.commitmentId) {
          return { kind: 'INVALID_COMMITMENT' as const };
        }

        const commitment = await tx.sponsorshipCommitment.findUnique({
          where: { id: payment.commitmentId },
        });

        if (!commitment?.amount || commitment.currency !== payment.currency) {
          return { kind: 'INVALID_COMMITMENT' as const };
        }

        const existingReceipt = await tx.sponsorshipReceipt.findUnique({
          where: { paymentId: payment.id },
        });

        if (existingReceipt) {
          return { kind: 'ALREADY_PROCESSED' as const };
        }

        const receipts = await tx.sponsorshipReceipt.aggregate({
          where: {
            commitmentId: commitment.id,
            currency: commitment.currency,
          },
          _sum: { amount: true },
        });

        const totalReceived = new Prisma.Decimal(
          receipts._sum.amount ?? 0,
        ).plus(payment.amount);

        if (totalReceived.greaterThan(commitment.amount)) {
          return { kind: 'EXCEEDS_COMMITMENT' as const };
        }

        const nextStatus: SponsorshipCommitmentStatus =
          totalReceived.greaterThanOrEqualTo(commitment.amount)
            ? 'RECEIVED'
            : 'PARTIALLY_RECEIVED';

        await tx.sponsorshipReceipt.create({
          data: {
            commitmentId: commitment.id,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            reference: payment.reference,
            verifiedById: actorId,
            notes: 'Manually verified bank transfer.',
          },
        });

        await tx.sponsorshipCommitment.update({
          where: { id: commitment.id },
          data: { status: nextStatus },
        });
      }

    if (payment.purpose === 'DIRECT_SPONSORSHIP') {
  if (!payment.enquiryId) {
    return { kind: 'INVALID_ENQUIRY' as const };
  }

  const enquiry = await tx.sponsorshipEnquiry.findFirst({
    where: {
      id: payment.enquiryId,
      eventId: payment.eventId,
    },
  });

  if (!enquiry) {
    return { kind: 'INVALID_ENQUIRY' as const };
  }

  const existingReceipt = await tx.sponsorshipReceipt.findUnique({
    where: {
      paymentId: payment.id,
    },
  });

  if (existingReceipt) {
    return { kind: 'ALREADY_PROCESSED' as const };
  }

  await tx.sponsorshipReceipt.create({
    data: {
      paymentId: payment.id,
      commitmentId: null,
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.reference,
      verifiedById: actorId,
      notes: 'Manually verified direct sponsorship bank transfer.',
    },
  });
}

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESSFUL',
          paidAt: new Date(),
          failureReason: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'BANK_TRANSFER_VERIFIED',
          entityType: 'Payment',
          entityId: payment.id,
          metadata: {
            reference: payment.reference,
            amount: payment.amount.toString(),
            currency: payment.currency,
            enquiryId: payment.enquiryId,
            commitmentId: payment.commitmentId,
          },
        },
      });

      return {
        kind: 'VERIFIED' as const,
        payment: updated,
      };
    },
    {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 15000,
  timeout: 30000,
}
  );
}

}
