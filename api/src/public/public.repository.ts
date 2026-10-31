import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedEvent() {
    return this.prisma.event.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        theme: true,
        description: true,
        eventDate: true,
        startTime: true,
        venue: true,
        venueStatus: true,
        targetAttendance: true,
        registrationMode: true,
        status: true,
      },
    });
  }

  findPublishedSpeakers(eventId: string) {
    return this.prisma.speaker.findMany({
      where: { eventId, isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { fullName: 'asc' }],
      select: { id: true, fullName: true, role: true, biography: true, imageUrl: true },
    });
  }

  findPublishedSessions(eventId: string) {
    return this.prisma.session.findMany({
      where: { eventId, isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
      select: { id: true, title: true, description: true, startsAt: true, endsAt: true, sessionType: true, location: true },
    });
  }
}
