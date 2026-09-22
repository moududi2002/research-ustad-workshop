//backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api');

  // Security headers
  app.use(helmet());

  // Cookie parser (needed for HttpOnly JWT cookie)
  app.use(cookieParser());

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

bootstrap();