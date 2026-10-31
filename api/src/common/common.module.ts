import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [SessionAuthGuard, RolesGuard],
  exports: [SessionAuthGuard, RolesGuard],
})
export class CommonModule {}
