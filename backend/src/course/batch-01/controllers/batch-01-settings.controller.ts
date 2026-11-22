
// backend/src/course/batch-01/controllers/batch-01-settings.controller.ts

import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

import {
  Batch01SettingsService,
} from '../services/batch-01-settings.service';

@Controller('course/batch-01')
export class Batch01SettingsController {
  constructor(
    private readonly settingsService:
      Batch01SettingsService,
  ) {}

  // Public course settings and current pricing.
  @Get('settings')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  // Admin-only course settings management.
  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @Body()
    body: {
      registrationEnabled?: boolean;
      earlyBirdFee?: number;
      regularFee?: number;
      earlyBirdEndsAt?: string;
      registrationClosesAt?: string;
      courseStartAt?: string;
    },

    @Headers('origin') origin?: string,
  ) {
    // Protect browser requests from unexpected origins.
    if (
      origin &&
      origin !==
        'https://workshop.researchustad.org'
    ) {
      throw new ForbiddenException(
        'Invalid request origin',
      );
    }

    return this.settingsService.updateSettings(
      body,
    );
  }
}
