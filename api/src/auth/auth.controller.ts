import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import type { AuthenticatedRequest } from '../common/types';
import { AuthService } from './auth.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import  { LoginDto } from './dto/login.dto';

function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => error ? reject(error) : resolve());
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf')
  csrf(@Req() request: Request) {
    request.session.csrfToken ??= randomBytes(32).toString('hex');
    return { csrfToken: request.session.csrfToken };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: LoginDto, @Req() request: Request) {
    const user = await this.authService.validateCredentials(body);

    await regenerateSession(request);
    request.session.userId = user.id;
    request.session.csrfToken = randomBytes(32).toString('hex');
    await saveSession(request);
    await this.authService.recordSuccessfulLogin(
      user.id,
      request.ip,
      request.headers['user-agent'],
    );

    return { user, csrfToken: request.session.csrfToken };
  }

  @Post('accept-invitation')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async acceptInvitation(@Body() body: AcceptInvitationDto, @Req() request: Request) {
    const user = await this.authService.acceptInvitation(body);

    await regenerateSession(request);
    request.session.userId = user.id;
    request.session.csrfToken = randomBytes(32).toString('hex');
    await saveSession(request);

    return { user, csrfToken: request.session.csrfToken };
  }

  @Post('logout')
  async logout(@Req() request: Request) {
    if (request.session) {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((error) => error ? reject(error) : resolve());
      });
    }
    return { success: true };
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    if (!request.adminUser) throw new UnauthorizedException('Please sign in to continue.');
    const { id, email, name, role } = request.adminUser;
    return { id, email, name, role };
  }
}
