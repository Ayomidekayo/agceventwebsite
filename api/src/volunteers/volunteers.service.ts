import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VolunteerStatus } from '../prisma/prisma-exports';
import { isPrismaUniqueConstraintError } from '../common/utils/prisma-error.util';
import { createReference } from '../common/utils/reference.util';
import { getPagination } from '../common/utils/pagination.util';
import { VolunteersRepository } from './volunteers.repository';
import { CreateVolunteerDto } from './volunteers.dto';

@Injectable()
export class VolunteersService {
  constructor(private readonly repository: VolunteersRepository) {}

  async create(dto: CreateVolunteerDto) {
    if (dto.consentToPrivacy !== true) throw new BadRequestException('Consent is required to submit this application.');
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new BadRequestException('Volunteer applications are not currently open.');

    try {
      const application = await this.repository.create({
        eventId: event.id,
        reference: createReference('AGNV'),
        fullName: dto.fullName,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone,
        location: dto.location || null,
        occupation: dto.occupation || null,
        department: dto.department,
        experience: dto.experience || null,
        availability: dto.availability || null,
        motivation: dto.motivation,
        consentAt: new Date(),
        status: 'PENDING',
      });
      return { success: true, ...application };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('A volunteer application already exists for this email address for this event.');
      }
      throw error;
    }
  }

  async listForAdmin(search: string, page: string, limit: string) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const pagination = getPagination(page, limit);
    return this.repository.findAdminRecords({ eventId: event.id, search: search.trim(), page: pagination.page, pageSize: pagination.pageSize });
  }

  async updateStatus(id: string, status: VolunteerStatus, actorId: string) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const existing = await this.repository.findByIdForEvent(id, event.id);
    if (!existing) throw new NotFoundException('Volunteer application not found for the active event.');
    const updated = await this.repository.updateStatus(id, status, actorId);
    await this.repository.createAudit({
      actorId,
      action: 'VOLUNTEER_STATUS_UPDATED',
      entityType: 'VolunteerApplication',
      entityId: id,
      metadata: { from: existing.status, to: status },
    });
    return updated;
  }
}
