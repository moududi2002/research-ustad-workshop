
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { Batch01RegistrationDto } from '../dto/batch-01-registration.dto';

import { Batch01RegistrationService } from '../services/batch-01-registration.service';

const BATCH01_COOKIE = 'ru_batch01_access';

@Controller('course/batch-01')
export class Batch01RegistrationController {
  constructor(
    private readonly registrationService:
      Batch01RegistrationService,
  ) {}

  private checkOrigin(req: Request): void {
    const origin = req.headers.origin;

    if (
      origin &&
      origin !== 'https://workshop.researchustad.org' &&
      origin !== 'http://localhost:3000'
    ) {
      throw new ForbiddenException('Invalid request origin');
    }
  }

  private saveSession(
    res: Response,
    accessToken: string,
  ): void {
    res.cookie(BATCH01_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/course/batch-01',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: Batch01RegistrationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(req);

    const result = await this.registrationService.register(
      dto,
      {
        userAgent: String(
          req.headers['user-agent'] || '',
        ).slice(0, 512),

        network: String(
          req.headers['x-real-ip'] || '',
        ).slice(0, 64),
      },
    );

    // Persist session in browser cookie.
    this.saveSession(res, result.accessToken);

    // Never return the secret token in browser JSON.
    const { accessToken, ...safeResult } = result;

    return safeResult;
  }

  @Get('status')
  async status(
    @Headers('x-course-access') accessToken: string,
  ) {
    return this.registrationService.getStatus(accessToken);
  }

  @Post('resume/request')
  @HttpCode(HttpStatus.OK)
  async requestResume(
    @Body('email') email: string,
    @Req() req: Request,
  ) {
    this.checkOrigin(req);

    return this.registrationService.requestResume(email);
  }

  @Post('resume/verify')
  @HttpCode(HttpStatus.OK)
  async verifyResume(
    @Body()
    body: {
      email: string;
      code: string;
    },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(req);

    const result =
      await this.registrationService.verifyResume(
        body?.email,
        body?.code,
      );

    // Replace the previous session after OTP verification.
    this.saveSession(res, result.accessToken);

    const { accessToken, ...safeResult } = result;

    return safeResult;
  }
}
