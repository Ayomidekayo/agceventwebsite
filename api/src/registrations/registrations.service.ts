import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RegistrationStatus, AdminRole } from '../prisma/prisma-exports';
import { isPrismaUniqueConstraintError } from '../common/utils/prisma-error.util';
import { createReference } from '../common/utils/reference.util';
import { getPagination } from '../common/utils/pagination.util';
import { RegistrationsRepository } from './registrations.repository';
import { CreateRegistrationDto } from './registrations.dto';

@Injectable()
export class RegistrationsService {
  constructor(private readonly repository: RegistrationsRepository) {}

  async create(dto: CreateRegistrationDto) {
    if (dto.consentToPrivacy !== true) {
      throw new BadRequestException('Consent is required to submit this registration.');
    }
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new BadRequestException('Registration is not currently open.');

    try {
      const registration = await this.repository.create({
        eventId: event.id,
        reference: createReference('AGN27'),
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone,
        affiliation: dto.affiliation || null,
        occupation: dto.occupation || null,
        interest: dto.interest || null,
        source: dto.source || null,
        consentAt: new Date(),
        status: 'PENDING',
      });
      return { success: true, ...registration };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('A registration already exists for this email address for this event.');
      }
      throw error;
    }
  }

  async listForAdmin(search: string, page: string, limit: string, role: AdminRole) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const pagination = getPagination(page, limit);
    return this.repository.findAdminRecords({
      eventId: event.id,
      search: search.trim(),
      page: pagination.page,
      pageSize: pagination.pageSize,
      checkInOnly: role === 'CHECK_IN_OFFICER',
    });
  }

  async updateStatus(id: string, status: RegistrationStatus, role: AdminRole, actorId: string) {
    if (role === 'CHECK_IN_OFFICER' && status !== 'CHECKED_IN') {
      throw new BadRequestException('Check-in officers can only mark an attendee as checked in.');
    }
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const existing = await this.repository.findByIdForEvent(id, event.id);
    if (!existing) throw new NotFoundException('Registration not found for the active event.');

    const updated = await this.repository.updateStatus(id, status);
    await this.repository.createAudit({
      actorId,
      action: 'REGISTRATION_STATUS_UPDATED',
      entityType: 'Registration',
      entityId: id,
      metadata: { from: existing.status, to: status },
    });
    return updated;
  }
}
