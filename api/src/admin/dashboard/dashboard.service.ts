import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole } from '../../prisma/prisma-exports';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getSummary(role: AdminRole) {
    const event = await this.repository.findCurrentPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available for this workspace.');
    const summary = await this.repository.getSummary(event.id, role);
    return {
      event,
      ...summary,
    };
  }
}
