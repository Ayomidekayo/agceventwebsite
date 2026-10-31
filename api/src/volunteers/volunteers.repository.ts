import { Injectable } from '@nestjs/common';
import { Prisma, VolunteerStatus } from '../prisma/prisma-exports';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VolunteersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrentPublishedEvent() {
    return this.prisma.event.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { eventDate: 'asc' }, select: { id: true } });
  }

  create(data: Prisma.VolunteerApplicationUncheckedCreateInput) {
    return this.prisma.volunteerApplication.create({ data, select: { reference: true, status: true, createdAt: true } });
  }

  async findAdminRecords(input: { eventId: string; search: string; page: number; pageSize: number }) {
    const where: Prisma.VolunteerApplicationWhereInput = { eventId: input.eventId };
    if (input.search) {
      where.OR = [
        { fullName: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { reference: { contains: input.search, mode: 'insensitive' } },
        { department: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    const skip = (input.page - 1) * input.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.volunteerApplication.findMany({
        where, orderBy: { createdAt: 'desc' }, take: input.pageSize, skip,
        select: { id: true, reference: true, fullName: true, email: true, phone: true, department: true, status: true, createdAt: true },
      }),
      this.prisma.volunteerApplication.count({ where }),
    ]);
    return { items, total, page: input.page, pageSize: input.pageSize };
  }

  findByIdForEvent(id: string, eventId: string) {
    return this.prisma.volunteerApplication.findFirst({ where: { id, eventId } });
  }

  updateStatus(id: string, status: VolunteerStatus, reviewerId: string) {
    return this.prisma.volunteerApplication.update({
      where: { id },
      data: { status, reviewerId, reviewedAt: new Date() },
      select: { id: true, reference: true, status: true },
    });
  }

  createAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({ data });
  }
}
