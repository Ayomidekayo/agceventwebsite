import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicRepository } from './public.repository';

@Injectable()
export class PublicService {
  constructor(private readonly repository: PublicRepository) {}

  async getEvent() {
    const event = await this.repository.findPublishedEvent();
    if (!event) throw new NotFoundException('No published event is available.');
    const [speakers, sessions] = await Promise.all([
      this.repository.findPublishedSpeakers(event.id),
      this.repository.findPublishedSessions(event.id),
    ]);
    return { ...event, speakers, sessions };
  }
}
