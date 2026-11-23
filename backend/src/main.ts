//backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api');

  // Security headers
  app.use(helmet());

  // Cookie parser (needed for HttpOnly JWT cookie)
  app.use(cookieParser());


  // Batch-01 cookie authentication.
  // Keep existing controller routes and header authentication.
  // Do not apply this middleware to Course-01 or PayStation IPN.

  const batch01ProtectedRoutes = new Set([
    'GET /status',
    'POST /coupon/apply',
    'POST /coupon/remove',
    'POST /initiate',
    'POST /verify',
    'POST /confirm',
    'GET /receipt',
  ]);

  app.use(
    '/api/course/batch-01',
    (req: Request, res: Response, next: NextFunction) => {
      const routeKey = `${req.method} ${req.path}`;

      if (!batch01ProtectedRoutes.has(routeKey)) {
        return next();
      }

      // Keep supporting existing header-based authentication.
      const suppliedHeader = req.headers['x-course-access'];

      if (
        typeof suppliedHeader === 'string' &&
        suppliedHeader.trim()
      ) {
        return next();
      }

      const cookieToken =
        req.cookies?.['ru_batch01_access'];

      if (
        typeof cookieToken !== 'string' ||
        !/^[a-f0-9]{64}$/i.test(cookieToken)
      ) {
        // Let the existing service return its normal 401.
        return next();
      }

      // Cookie-backed POST requests must originate
      // from the trusted workshop frontend.
      if (req.method === 'POST') {
        const origin = req.headers.origin;

        if (
          origin !== 'https://workshop.researchustad.org' &&
          origin !== 'http://localhost:3000'
        ) {
          return res.status(403).json({
            message: 'Invalid request origin',
          });
        }
      }

      // Existing Batch-01 controllers already read this header.
      req.headers['x-course-access'] = cookieToken;

      return next();
    },
  );


  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://workshop.researchustad.org',
    ],
    credentials: true, // Required to send/receive HttpOnly cookies
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Trust proxy in production for Secure cookies behind reverse proxy
  if (isProduction) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Backend failed to start:', error);
  process.exit(1);
});