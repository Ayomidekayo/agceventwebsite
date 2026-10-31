import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SponsorshipCommitmentStatus, SponsorshipStatus } from '../prisma/prisma-exports';
import { isPrismaTransactionConflict } from '../common/utils/prisma-error.util';
import { createReference } from '../common/utils/reference.util';
import { getPagination } from '../common/utils/pagination.util';
import { SponsorshipsRepository } from './sponsorships.repository';
import { CreateSponsorshipEnquiryDto } from './sponsorships.dto';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class SponsorshipsService {
  constructor(private readonly repository: SponsorshipsRepository) {}

  async createEnquiry(dto: CreateSponsorshipEnquiryDto) {
    if (dto.consentToPrivacy !== true) throw new BadRequestException('Consent is required to submit this enquiry.');
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new BadRequestException('Sponsorship enquiries are not currently open.');

    const enquiry = await this.repository.createEnquiry({
      eventId: event.id,
      reference: createReference('AGNS'),
      sponsorType: dto.sponsorType,
      name: dto.name,
      organisation: dto.organisation || null,
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone,
      supportLevel: dto.supportLevel || null,
      supportType: dto.supportType,
      indicativeAmount: dto.amount || null,
      message: dto.message,
      consentAt: new Date(),
      status: 'NEW',
    });
    return { success: true, ...enquiry };
  }

  async listForAdmin(search: string, page: string, limit: string) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const pagination = getPagination(page, limit);
    return this.repository.findAdminRecords({ eventId: event.id, search: search.trim(), page: pagination.page, pageSize: pagination.pageSize });
  }

  async updateEnquiryStatus(id: string, status: SponsorshipStatus, actorId: string) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const existing = await this.repository.findEnquiryByIdForEvent(id, event.id);
    if (!existing) throw new NotFoundException('Sponsorship enquiry not found for the active event.');
    const updated = await this.repository.updateEnquiryStatus(id, status, actorId);
    await this.repository.createAudit({
      actorId,
      action: 'SPONSORSHIP_STATUS_UPDATED',
      entityType: 'SponsorshipEnquiry',
      entityId: id,
      metadata: { from: existing.status, to: status },
    });
    return updated;
  }

  async createCommitment(dto: CreateCommitmentDto, actorId: string) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    if (dto.supportType.toLowerCase().includes('financial') && !dto.amount) {
      throw new BadRequestException('An amount is required for a financial commitment.');
    }
    if (dto.enquiryId) {
      const enquiry = await this.repository.findEnquiryByIdForEvent(dto.enquiryId, event.id);
      if (!enquiry) throw new NotFoundException('Sponsorship enquiry not found for the active event.');
    }
    const status: SponsorshipCommitmentStatus = dto.status ?? 'PROPOSED';
    if (status === 'RECEIVED' || status === 'PARTIALLY_RECEIVED') {
      throw new BadRequestException('Record money received through a verified receipt, not as an initial commitment status.');
    }

    const commitment = await this.repository.createCommitment({
      eventId: event.id,
      enquiryId: dto.enquiryId || null,
      sponsorName: dto.sponsorName.trim(),
      supportType: dto.supportType.trim(),
      amount: dto.amount ? new Prisma.Decimal(dto.amount) : null,
      currency: dto.currency ?? 'NGN',
      status,
      notes: dto.notes || null,
    });
    await this.repository.createAudit({
      actorId,
      action: 'SPONSORSHIP_COMMITMENT_CREATED',
      entityType: 'SponsorshipCommitment',
      entityId: commitment.id,
      metadata: { status: commitment.status, supportType: commitment.supportType },
    });
    return { ...commitment, amount: commitment.amount?.toString() ?? null };
  }

  async addReceipt(id: string, dto: CreateReceiptDto, actorId: string) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    try {
      const result = await this.repository.addReceipt({
        commitmentId: id,
        eventId: event.id,
        amount: dto.amount,
        currency: dto.currency,
        reference: dto.reference,
        notes: dto.notes,
        verifiedById: actorId,
      });

      switch (result.kind) {
        case 'NOT_FOUND': throw new NotFoundException('Sponsorship commitment not found for the active event.');
        case 'INVALID_STATUS': throw new BadRequestException('Only a pledged or confirmed commitment can receive a payment record.');
        case 'NO_AMOUNT': throw new BadRequestException('A verified financial receipt requires a monetary commitment with an amount.');
        case 'CURRENCY_MISMATCH': throw new BadRequestException('Receipt currency must match the commitment currency. Record any currency conversion separately.');
        case 'EXCEEDS_COMMITMENT': throw new BadRequestException('This receipt would exceed the agreed commitment amount. Check the amount or record the excess separately.');
        case 'CREATED': return { ...result.receipt, amount: result.receipt.amount.toString() };
        default: throw new Error('Unexpected sponsorship receipt result.');
      }
    } catch (error) {
      if (isPrismaTransactionConflict(error)) {
        throw new ConflictException('Another receipt was recorded at the same time. Refresh the commitment and try again.');
      }
      throw error;
    }
  }

  async listCommitments() {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const items = await this.repository.findCommitments(event.id);
    return {
      items: items.map((item) => ({
        ...item,
        amount: item.amount?.toString() ?? null,
        receipts: item.receipts.map((receipt) => ({ ...receipt, amount: receipt.amount.toString() })),
      })),
      total: items.length,
    };
  }
}
