import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import type { RequestHandler } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!databaseUrl) throw new Error('DATABASE_URL is required. Configure PostgreSQL in api/.env.');
  if (!sessionSecret || sessionSecret.length < 32 || sessionSecret.includes('replace-this')) {
    throw new Error('SESSION_SECRET must be a unique random value of at least 32 characters.');
  }

  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  if (isProduction) app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const PgStore = connectPgSimple(session);
  app.use(session({
    name: 'agn.sid',
    secret: sessionSecret,
    store: new PgStore({
      conString: databaseUrl,
      createTableIfMissing: true,
      pruneSessionInterval: 15 * 60,
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: Number.parseInt(process.env.SESSION_MAX_AGE_MS ?? '28800000', 10),
    },
  }) as RequestHandler);

  // Require a valid session-backed CSRF token for all state-changing requests.
  app.use((request: Request, response: Response, next: NextFunction) => {
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase());
    if (safeMethod) return next();
    const expected = request.session?.csrfToken;
    const supplied = request.header('x-csrf-token');
    if (!expected || !supplied) {
      return response.status(403).json({ statusCode: 403, message: 'CSRF token missing or expired.' });
    }
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return response.status(403).json({ statusCode: 403, message: 'CSRF token missing or expired.' });
    }
    return next();
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }));
  app.enableShutdownHooks();

  const port = Number.parseInt(process.env.PORT ?? '5000', 10);
  await app.listen(port);
  console.log(`AGN API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
