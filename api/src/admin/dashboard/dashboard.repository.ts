import { Injectable } from '@nestjs/common';
import { AdminRole } from '../../prisma/prisma-exports';
import { PrismaService } from '../../prisma/prisma.service';

const registrationRoles: AdminRole[] = ['SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_MANAGER', 'CHECK_IN_OFFICER'];
const sponsorshipRoles: AdminRole[] = ['SUPER_ADMIN', 'EVENT_ADMIN', 'SPONSORSHIP_MANAGER'];
const volunteerRoles: AdminRole[] = ['SUPER_ADMIN', 'EVENT_ADMIN', 'VOLUNTEER_MANAGER'];

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrentPublishedEvent() {
    return this.prisma.event.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { eventDate: 'asc' },
      select: { id: true, slug: true, title: true, eventDate: true, venue: true, status: true },
    });
  }

  async getSummary(eventId: string, role: AdminRole) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [registrations, recentRegistrations, volunteers, pendingVolunteers, acceptedVolunteers, sponsorshipEnquiries, confirmedSponsorships, receiptAggregate] = await Promise.all([
      this.prisma.registration.count({ where: { eventId } }),
      this.prisma.registration.count({ where: { eventId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.volunteerApplication.count({ where: { eventId } }),
      this.prisma.volunteerApplication.count({ where: { eventId, status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      this.prisma.volunteerApplication.count({ where: { eventId, status: 'ACCEPTED' } }),
      this.prisma.sponsorshipEnquiry.count({ where: { eventId } }),
      this.prisma.sponsorshipCommitment.count({ where: { eventId, status: { in: ['PLEDGED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED'] } } }),
      this.prisma.sponsorshipReceipt.aggregate({ where: { currency: 'NGN', commitment: { is: { eventId } } }, _sum: { amount: true } }),
    ]);

    let recentActivity: { id: string; label: string; type: string; createdAt: Date; status: string }[] = [];
    if (role !== 'REPORT_VIEWER' && role !== 'CONTENT_MANAGER') {
      const canSeeAll = role === 'SUPER_ADMIN' || role === 'EVENT_ADMIN';
      const [recentRegs, recentVolunteers, recentSponsors] = await Promise.all([
        canSeeAll || registrationRoles.includes(role)
          ? this.prisma.registration.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, firstName: true, lastName: true, createdAt: true, status: true } })
          : Promise.resolve([]),
        canSeeAll || volunteerRoles.includes(role)
          ? this.prisma.volunteerApplication.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, fullName: true, createdAt: true, status: true } })
          : Promise.resolve([]),
        canSeeAll || sponsorshipRoles.includes(role)
          ? this.prisma.sponsorshipEnquiry.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, name: true, organisation: true, createdAt: true, status: true } })
          : Promise.resolve([]),
      ]);
      recentActivity = [
        ...recentRegs.map((item) => ({ id: item.id, label: `${item.firstName} ${item.lastName} registered`, type: 'Registration', createdAt: item.createdAt, status: item.status })),
        ...recentVolunteers.map((item) => ({ id: item.id, label: `${item.fullName} applied to volunteer`, type: 'Volunteer', createdAt: item.createdAt, status: item.status })),
        ...recentSponsors.map((item) => ({ id: item.id, label: `${item.organisation || item.name} sent a sponsorship enquiry`, type: 'Sponsorship', createdAt: item.createdAt, status: item.status })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 7);
    }

    return {
      registrations: { total: registrations, recent: recentRegistrations },
      volunteers: { total: volunteers, pending: pendingVolunteers, accepted: acceptedVolunteers },
      sponsorship: {
        enquiries: sponsorshipEnquiries,
        confirmed: confirmedSponsorships,
        receivedAmount: ['SUPER_ADMIN', 'EVENT_ADMIN', 'SPONSORSHIP_MANAGER', 'REPORT_VIEWER'].includes(role)
          ? Number(receiptAggregate._sum.amount ?? 0)
          : null,
      },
      recentActivity,
      generatedAt: now.toISOString(),
    };
  }
}
