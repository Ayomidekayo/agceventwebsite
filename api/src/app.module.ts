import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { SponsorshipsModule } from './sponsorships/sponsorships.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    PrismaModule,
    CommonModule,
    AuthModule,
    PublicModule,
    RegistrationsModule,
    SponsorshipsModule,
    VolunteersModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
