
// backend/src/course/batch-01/controllers/batch-01-registration.controller.ts
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { Batch01RegistrationDto } from '../dto/batch-01-registration.dto';
import { Batch01RegistrationService } from '../services/batch-01-registration.service';

const COOKIE_NAME = 'ru_batch01_access';

@Controller('course/batch-01')
export class Batch01RegistrationController {
  constructor(
    private readonly registrationService: Batch01RegistrationService,
  ) {}

  private checkOrigin(req: Request) {
    const origin = req.headers.origin;

    if (
      origin &&
      origin !== 'https://workshop.researchustad.org' &&
      origin !== 'http://localhost:3000'
    ) {
      throw new ForbiddenException('Invalid request origin');
    }
  }

  private saveSession(res: Response, accessToken: string) {
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/course/batch-01',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private resolveToken(
    req: Request,
    headerToken?: string,
  ): string | undefined {
    if (headerToken?.trim()) {
      return headerToken.trim();
    }

    const cookieToken = req.cookies?.[COOKIE_NAME];

    return typeof cookieToken === 'string'
      ? cookieToken
      : undefined;
  }

  // New registration
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: Batch01RegistrationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(req);

    const result = await this.registrationService.register(dto, {
      userAgent: String(
        req.headers['user-agent'] || '',
      ).slice(0, 512),

      network: String(
        req.headers['x-real-ip'] || '',
      ).slice(0, 64),
    });

    // Backend creates the access token.
    // Store it in a Batch-01-only HttpOnly cookie.
    this.saveSession(res, result.accessToken);

    // Do not expose the token in the JSON response.
    const { accessToken, ...safeResult } = result;

    return safeResult;
  }

  // Existing registration status
  @Get('status')
  async status(
    @Req() req: Request,
    @Headers('x-course-access') headerToken?: string,
  ) {
    return this.registrationService.getStatus(
      this.resolveToken(req, headerToken),
    );
  }

  // Request registration resume OTP
  @Post('resume/request')
  @HttpCode(HttpStatus.OK)
  async requestResume(
    @Body('email') email: string,
    @Req() req: Request,
  ) {
    this.checkOrigin(req);

    return this.registrationService.requestResume(email);
  }

  // Verify OTP and restore session
  @Post('resume/verify')
  @HttpCode(HttpStatus.OK)
  async verifyResume(
    @Body() body: {
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

    // Replace old session with the new token.
    this.saveSession(res, result.accessToken);

    const { accessToken, ...safeResult } = result;

    return safeResult;
  }
}