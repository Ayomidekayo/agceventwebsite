import { Injectable } from '@nestjs/common';
import { Prisma, SponsorshipCommitmentStatus, SponsorshipStatus } from '../prisma/prisma-exports';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SponsorshipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrentPublishedEvent() {
    return this.prisma.event.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { eventDate: 'asc' }, select: { id: true } });
  }

  createEnquiry(data: Prisma.SponsorshipEnquiryUncheckedCreateInput) {
    return this.prisma.sponsorshipEnquiry.create({ data, select: { reference: true, status: true, createdAt: true } });
  }

  async findAdminRecords(input: { eventId: string; search: string; page: number; pageSize: number }) {
    const where: Prisma.SponsorshipEnquiryWhereInput = { eventId: input.eventId };
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { organisation: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { reference: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    const skip = (input.page - 1) * input.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.sponsorshipEnquiry.findMany({
        where, orderBy: { createdAt: 'desc' }, take: input.pageSize, skip,
        select: { id: true, reference: true, name: true, organisation: true, email: true, supportType: true, supportLevel: true, indicativeAmount: true, status: true, createdAt: true },
      }),
      this.prisma.sponsorshipEnquiry.count({ where }),
    ]);
    return { items, total, page: input.page, pageSize: input.pageSize };
  }

  findEnquiryByIdForEvent(id: string, eventId: string) {
    return this.prisma.sponsorshipEnquiry.findFirst({ where: { id, eventId } });
  }

  updateEnquiryStatus(id: string, status: SponsorshipStatus, assignedToId: string) {
    return this.prisma.sponsorshipEnquiry.update({
      where: { id },
      data: { status, assignedToId },
      select: { id: true, reference: true, status: true },
    });
  }

  createAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({ data });
  }

  createCommitment(data: Prisma.SponsorshipCommitmentUncheckedCreateInput) {
    return this.prisma.sponsorshipCommitment.create({ data });
  }

  findCommitments(eventId: string) {
    return this.prisma.sponsorshipCommitment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { receipts: { select: { amount: true, receivedAt: true, reference: true } } },
    });
  }

  addReceipt(input: {
    commitmentId: string;
    eventId: string;
    amount: string;
    currency?: string;
    reference?: string;
    notes?: string;
    verifiedById: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const commitment = await tx.sponsorshipCommitment.findFirst({
        where: { id: input.commitmentId, eventId: input.eventId },
      });
      if (!commitment) return { kind: 'NOT_FOUND' as const };
      if (commitment.status === 'CANCELLED' || commitment.status === 'PROPOSED') {
        return { kind: 'INVALID_STATUS' as const };
      }

      // Capture the nullable Prisma Decimal before validation so TypeScript and the transaction
      // both use the same validated monetary ceiling.
      const commitmentAmount = commitment.amount;
      if (commitmentAmount === null) return { kind: 'NO_AMOUNT' as const };

      const currency = input.currency ?? commitment.currency;
      if (currency !== commitment.currency) return { kind: 'CURRENCY_MISMATCH' as const };

      const previousTotal = await tx.sponsorshipReceipt.aggregate({
        where: { commitmentId: commitment.id, currency },
        _sum: { amount: true },
      });
      const nextTotal = new Prisma.Decimal(previousTotal._sum.amount ?? 0).plus(new Prisma.Decimal(input.amount));
      if (nextTotal.greaterThan(commitmentAmount)) return { kind: 'EXCEEDS_COMMITMENT' as const };

      const receipt = await tx.sponsorshipReceipt.create({
        data: {
          commitmentId: commitment.id,
          amount: new Prisma.Decimal(input.amount),
          currency,
          reference: input.reference || null,
          notes: input.notes || null,
          verifiedById: input.verifiedById,
        },
      });

      const nextStatus: SponsorshipCommitmentStatus = nextTotal.greaterThanOrEqualTo(commitmentAmount)
        ? 'RECEIVED'
        : 'PARTIALLY_RECEIVED';

      await tx.sponsorshipCommitment.update({ where: { id: commitment.id }, data: { status: nextStatus } });
      await tx.auditLog.create({
        data: {
          actorId: input.verifiedById,
          action: 'SPONSORSHIP_RECEIPT_RECORDED',
          entityType: 'SponsorshipReceipt',
          entityId: receipt.id,
          metadata: { commitmentId: commitment.id, amount: input.amount, currency },
        },
      });

      return { kind: 'CREATED' as const, receipt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
