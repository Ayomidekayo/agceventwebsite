import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicRepository } from './public.repository';
import { PublicService } from './public.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService, PublicRepository],
  exports: [PublicService],
})
export class PublicModule {}
