
// backend/src/course/batch-01/services/batch-01-settings.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';

import {
  Collection,
} from 'mongodb';

import {
  BATCH_01_COURSE_ID,
  BATCH_01_DEFAULTS,
} from '../config/batch-01.defaults';

import {
  Batch01Settings,
} from '../types/batch-01-settings.interface';

import {
  Batch01DatabaseService,
} from '../database/batch-01-database.service';

@Injectable()
export class Batch01SettingsService
  implements OnModuleInit
{

    private settingsCollection!: Collection<Batch01Settings>;


    constructor(
    private readonly databaseService: Batch01DatabaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.databaseService.ready(); 
    const database = this.databaseService.getDb();

  this.settingsCollection =
    database.collection<Batch01Settings>(
      'course_settings',
    );

  await this.settingsCollection.createIndex(
    { courseId: 1 },
    { unique: true },
  );

  // Create default settings only once.
  // Existing Admin settings must never be overwritten on restart.
  await this.settingsCollection.updateOne(
    {
      courseId: BATCH_01_COURSE_ID,
    },
    {
      $setOnInsert: BATCH_01_DEFAULTS,
    },
    {
      upsert: true,
    },
  );

  console.log(
    '[Batch-01] Course settings initialized',
  );
    }

  // Get the stored settings document.
  async getSettings(): Promise<Batch01Settings> {
    const settings =
      await this.settingsCollection.findOne({
        courseId: BATCH_01_COURSE_ID,
      });

    if (!settings) {
      throw new NotFoundException(
        'Batch-01 settings not found',
      );
    }

    return settings;
  }

  // Calculate the current course price.
  getCurrentPrice(
    settings: Batch01Settings,
    now: Date = new Date(),
  ): {
    basePrice: number;
    originalPrice: number;
    pricingType: 'early_bird' | 'regular';
  } {
    const isEarlyBird =
      now.getTime() <=
      new Date(settings.earlyBirdEndsAt).getTime();

    if (isEarlyBird) {
      return {
        basePrice: settings.earlyBirdFee,
        originalPrice: settings.regularFee,
        pricingType: 'early_bird',
      };
    }

    return {
      basePrice: settings.regularFee,
      originalPrice: settings.regularFee,
      pricingType: 'regular',
    };
  }

  // Check whether new registrations are currently allowed.
  getRegistrationAvailability(
    settings: Batch01Settings,
    now: Date = new Date(),
  ) {
    const expired =
      now.getTime() >
      new Date(settings.registrationClosesAt).getTime();

    const manuallyDisabled =
      settings.registrationEnabled === false;

    const isOpen =
      !manuallyDisabled && !expired;

    let closedReason: string | null = null;

    if (manuallyDisabled) {
      closedReason = 'manually_disabled';
    } else if (expired) {
      closedReason = 'expired';
    }

    return {
      isOpen,
      closedReason,
      registrationEnabled:
        settings.registrationEnabled,
      expired,
    };
  }

  // Public API response.
  async getPublicSettings() {
    const settings = await this.getSettings();

    const now = new Date();

    const pricing = this.getCurrentPrice(
      settings,
      now,
    );

    const availability =
      this.getRegistrationAvailability(
        settings,
        now,
      );

    return {
      courseId: settings.courseId,
      courseName: settings.courseName,
      batchName: settings.batchName,

      timezone: settings.timezone,

      pricing: {
        currency: settings.currency,
        earlyBirdFee: settings.earlyBirdFee,
        regularFee: settings.regularFee,
        currentFee: pricing.basePrice,
        originalPrice: pricing.originalPrice,
        pricingType: pricing.pricingType,
      },

      dates: {
        earlyBirdEndsAt:
          settings.earlyBirdEndsAt,

        registrationClosesAt:
          settings.registrationClosesAt,

        courseStartAt:
          settings.courseStartAt,
      },

      registration: availability,
    };
  }

  // Admin API: update course settings.
  async updateSettings(input: {
    registrationEnabled?: boolean;
    earlyBirdFee?: number;
    regularFee?: number;
    earlyBirdEndsAt?: string;
    registrationClosesAt?: string;
    courseStartAt?: string;
  }) {
    const current = await this.getSettings();

    const updates: Partial<Batch01Settings> = {};

    if (input.registrationEnabled !== undefined) {
      if (
        typeof input.registrationEnabled !==
        'boolean'
      ) {
        throw new BadRequestException(
          'registrationEnabled must be boolean',
        );
      }

      updates.registrationEnabled =
        input.registrationEnabled;
    }

    if (input.earlyBirdFee !== undefined) {
      const fee = Number(input.earlyBirdFee);

      if (
        !Number.isInteger(fee) ||
        fee < 1
      ) {
        throw new BadRequestException(
          'Invalid Early Bird fee',
        );
      }

      updates.earlyBirdFee = fee;
    }

    if (input.regularFee !== undefined) {
      const fee = Number(input.regularFee);

      if (
        !Number.isInteger(fee) ||
        fee < 1
      ) {
        throw new BadRequestException(
          'Invalid Regular fee',
        );
      }

      updates.regularFee = fee;
    }

    if (input.earlyBirdEndsAt !== undefined) {
      const date = new Date(
        input.earlyBirdEndsAt,
      );

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(
          'Invalid Early Bird deadline',
        );
      }

      updates.earlyBirdEndsAt = date;
    }

    if (
      input.registrationClosesAt !== undefined
    ) {
      const date = new Date(
        input.registrationClosesAt,
      );

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(
          'Invalid registration closing date',
        );
      }

      updates.registrationClosesAt = date;
    }

    if (input.courseStartAt !== undefined) {
      const date = new Date(
        input.courseStartAt,
      );

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(
          'Invalid course start date',
        );
      }

      updates.courseStartAt = date;

      // The course start date is also the registration closing date.
      // Both values are updated together by default.
      if (
        input.registrationClosesAt === undefined
      ) {
        updates.registrationClosesAt = date;
      }
    }

    const nextEarlyBird =
      updates.earlyBirdEndsAt ||
      current.earlyBirdEndsAt;

    const nextClosing =
      updates.registrationClosesAt ||
      current.registrationClosesAt;

    if (
      nextEarlyBird.getTime() >
      nextClosing.getTime()
    ) {
      throw new BadRequestException(
        'Early Bird deadline cannot be after registration closing date',
      );
    }

    const nextRegular =
      updates.regularFee ??
      current.regularFee;

    const nextEarly =
      updates.earlyBirdFee ??
      current.earlyBirdFee;

    if (nextEarly > nextRegular) {
      throw new BadRequestException(
        'Early Bird fee cannot exceed Regular fee',
      );
    }

    updates.updatedAt = new Date();

    await this.settingsCollection.updateOne(
      {
        courseId: BATCH_01_COURSE_ID,
      },
      {
        $set: updates,
      },
    );

    return this.getPublicSettings();
  }
}
