import { Injectable } from '@nestjs/common';
import { Prisma, RegistrationStatus } from '../prisma/prisma-exports';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrentPublishedEvent() {
    return this.prisma.event.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { eventDate: 'asc' },
      select: { id: true },
    });
  }

  create(data: Prisma.RegistrationUncheckedCreateInput) {
    return this.prisma.registration.create({
      data,
      select: { reference: true, status: true, createdAt: true },
    });
  }

  async findAdminRecords(input: { eventId: string; search: string; page: number; pageSize: number; checkInOnly: boolean }) {
    const where: Prisma.RegistrationWhereInput = { eventId: input.eventId };
    if (input.search) {
      const query = input.search;
      const searchable: Prisma.RegistrationWhereInput[] = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { reference: { contains: query, mode: 'insensitive' } },
      ];
      if (!input.checkInOnly) searchable.push({ email: { contains: query, mode: 'insensitive' } });
      where.OR = searchable;
    }

    const skip = (input.page - 1) * input.pageSize;
    const [items, total] = await this.prisma.$transaction([
      input.checkInOnly
        ? this.prisma.registration.findMany({
            where, orderBy: { createdAt: 'desc' }, take: input.pageSize, skip,
            select: { id: true, reference: true, firstName: true, lastName: true, status: true, createdAt: true },
          })
        : this.prisma.registration.findMany({
            where, orderBy: { createdAt: 'desc' }, take: input.pageSize, skip,
            select: { id: true, reference: true, firstName: true, lastName: true, email: true, phone: true, occupation: true, status: true, createdAt: true },
          }),
      this.prisma.registration.count({ where }),
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
  }

  findByIdForEvent(id: string, eventId: string) {
    return this.prisma.registration.findFirst({ where: { id, eventId } });
  }

  updateStatus(id: string, status: RegistrationStatus) {
    return this.prisma.registration.update({
      where: { id },
      data: { status, checkedInAt: status === 'CHECKED_IN' ? new Date() : null },
      select: { id: true, reference: true, status: true },
    });
  }

  createAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({ data });
  }
}
