
// backend/src/course/batch-01/controllers/batch-01-registration.controller.ts

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import {
  Batch01RegistrationDto,
} from '../dto/batch-01-registration.dto';

import {
  Batch01RegistrationService,
} from '../services/batch-01-registration.service';

@Controller('course/batch-01')
export class Batch01RegistrationController {
  constructor(
    private readonly registrationService:
      Batch01RegistrationService,
  ) {}

  // Create a new Batch-01 registration.
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(
      @Body() dto: Batch01RegistrationDto,
      @Req() req: Request,
    ) {
      return this.registrationService.register(dto, {
        userAgent: String(
          req.headers['user-agent'] || '',
        ).slice(0, 512),

        network: String(
          req.headers['x-real-ip'] || '',
        ).slice(0, 64),
      });
    }

  // Get current registration and payment status.
  @Get('status')
  async status(
    @Headers('x-course-access')
    accessToken: string,
  ) {
    return this.registrationService.getStatus(
      accessToken,
    );
  }

  @Post('resume/request')
    @HttpCode(HttpStatus.OK)
    async requestResume(
      @Body('email') email: string,
    ) {
      return this.registrationService.requestResume(email);
    }

    /**
     * Verify resume OTP and restore registration access.
     */
    @Post('resume/verify')
    @HttpCode(HttpStatus.OK)
    async verifyResume(
      @Body() body: {
        email: string;
        code: string;
      },
    ) {
      return this.registrationService.verifyResume(
        body?.email,
        body?.code,
      );
    }

}
