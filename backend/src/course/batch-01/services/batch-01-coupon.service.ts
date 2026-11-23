
// backend/src/course/batch-01/services/batch-01-coupon.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';

import {
  Collection,
  ObjectId,
} from 'mongodb';

import { createHash } from 'crypto';

import {
  Batch01DatabaseService,
} from '../database/batch-01-database.service';

import {
  BATCH_01_COURSE_ID,
} from '../config/batch-01.defaults';

import {
  Batch01SettingsService,
} from './batch-01-settings.service';

type CouponType =
  | 'final_price'
  | 'percentage'
  | 'fixed';

interface Batch01Coupon {
  _id: ObjectId;
  courseId: string;
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  allowedEmail: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CouponRegistration {
  _id: ObjectId;
  registrationId?: string;
  courseId: string;
  accessHash: string;
  emailNormalized: string;
  status: string;
  amount: number;
  originalAmount: number;
  pricingType: 'early_bird' | 'regular';
  couponCode?: string;
  discountAmount?: number;
  updatedAt: Date;
}

@Injectable()
export class Batch01CouponService
  implements OnModuleInit
{
  
  private coupons!: 
    Collection<Batch01Coupon>;

   private registrations!: 
    Collection<CouponRegistration>;

  

  constructor(
    private readonly settingsService: Batch01SettingsService,
    private readonly databaseService: Batch01DatabaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.databaseService.ready(); 
    const database = this.databaseService.getDb();

    this.coupons =
        database.collection<Batch01Coupon>(
        'batch_01_coupons',
        );

    this.registrations =
        database.collection<CouponRegistration>(
        'batch_01_registrations',
        );

    await this.coupons.createIndex(
        {
        courseId: 1,
        code: 1,
        },
        {
        unique: true,
        },
    );

    await this.coupons.createIndex({
        courseId: 1,
        active: 1,
        expiresAt: 1,
    });

    console.log(
        '[Batch-01] Coupon collection initialized',
    );
    }



  private hash(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex');
  }

  private normalizeCode(value: unknown): string {
    const code = String(value || '')
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
      throw new BadRequestException(
        'Coupon code must contain 4–32 letters, numbers, hyphens or underscores',
      );
    }

    return code;
  }

  private async authorizedRegistration(
    accessToken?: string,
  ) {
    if (
      !accessToken ||
      !/^[a-f0-9]{64}$/i.test(accessToken)
    ) {
      throw new UnauthorizedException(
        'Registration session is invalid',
      );
    }

    const registration =
      await this.registrations.findOne({
        courseId: BATCH_01_COURSE_ID,
        accessHash: this.hash(accessToken),
      });

    if (!registration) {
      throw new NotFoundException(
        'Batch-01 registration not found',
      );
    }

    return registration;
  }

  private async getActiveCoupon(
    code: string,
    email: string,
  ) {
    const coupon = await this.coupons.findOne({
      courseId: BATCH_01_COURSE_ID,
      code,
    });

    if (
      !coupon ||
      !coupon.active ||
      (
        coupon.expiresAt &&
        coupon.expiresAt.getTime() <= Date.now()
      )
    ) {
      throw new BadRequestException(
        'Coupon is invalid, inactive or expired',
      );
    }

    if (
      coupon.allowedEmail &&
      coupon.allowedEmail !== email.toLowerCase()
    ) {
      throw new BadRequestException(
        'This coupon is not available for your email',
      );
    }

    return coupon;
  }

  private calculatePrice(
    coupon: Batch01Coupon,
    basePrice: number,
  ) {
    let finalPrice: number;

    if (coupon.type === 'percentage') {
      finalPrice = Math.round(
        basePrice * (100 - coupon.value) / 100,
      );
    } else if (coupon.type === 'fixed') {
      finalPrice = basePrice - coupon.value;
    } else {
      finalPrice = coupon.value;
    }

    if (
      !Number.isInteger(finalPrice) ||
      finalPrice < 1 ||
      finalPrice > basePrice
    ) {
      throw new BadRequestException(
        'Coupon cannot produce a valid price for the current course fee',
      );
    }

    return {
      basePrice,
      finalPrice,
      discountAmount: basePrice - finalPrice,
    };
  }

  // Admin: create a Batch-01 coupon.
  async createCoupon(input: {
    code: string;
    type: CouponType;
    value: number;
    allowedEmail?: string;
    expiresAt?: string;
  }) {
    const code = this.normalizeCode(input.code);

    const settings =
      await this.settingsService.getSettings();

    const value = Number(input.value);

    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > settings.regularFee
    ) {
      throw new BadRequestException(
        'Invalid coupon value',
      );
    }

    if (
      !['percentage', 'fixed', 'final_price']
        .includes(input.type)
    ) {
      throw new BadRequestException(
        'Invalid coupon type',
      );
    }

    if (
      input.type === 'percentage' &&
      value > 99
    ) {
      throw new BadRequestException(
        'Percentage must be between 1 and 99',
      );
    }

    const allowedEmail = String(
      input.allowedEmail || '',
    ).trim().toLowerCase();

    if (
      allowedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        allowedEmail,
      )
    ) {
      throw new BadRequestException(
        'Invalid allowed email',
      );
    }

    let expiresAt: Date | null = null;

    if (input.expiresAt) {
      expiresAt = new Date(input.expiresAt);

      if (
        Number.isNaN(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now()
      ) {
        throw new BadRequestException(
          'Coupon expiry must be a future date',
        );
      }
    }

    const coupon: Batch01Coupon = {
      _id: new ObjectId(),
      courseId: BATCH_01_COURSE_ID,
      code,
      type: input.type,
      value,
      active: true,
      allowedEmail: allowedEmail || null,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await this.coupons.insertOne(coupon);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'This Batch-01 coupon already exists',
        );
      }

      throw error;
    }

    return {
      success: true,
      ...coupon,
    };
  }

  // Admin: list Batch-01 coupons.
  async listCoupons() {
    const coupons = await this.coupons
      .find({
        courseId: BATCH_01_COURSE_ID,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    return coupons.map((coupon) => ({
      ...coupon,
      expired:
        !!coupon.expiresAt &&
        coupon.expiresAt.getTime() <= Date.now(),
    }));
  }

  // Admin: activate or deactivate a coupon.
  async setCouponStatus(
    codeInput: string,
    active: boolean,
  ) {
    const code = this.normalizeCode(codeInput);

    const result = await this.coupons.updateOne(
      {
        courseId: BATCH_01_COURSE_ID,
        code,
      },
      {
        $set: {
          active,
          updatedAt: new Date(),
        },
      },
    );

    if (!result.matchedCount) {
      throw new NotFoundException(
        'Coupon not found',
      );
    }

    return {
      success: true,
      code,
      active,
    };
  }

  // Participant: apply coupon to a draft registration.
  async applyCoupon(
    accessToken: string,
    codeInput: string,
  ) {
    const registration =
      await this.authorizedRegistration(accessToken);

    if (registration.status !== 'draft') {
      throw new ConflictException(
        'Coupon changes are only allowed before payment starts',
      );
    }

    const code = this.normalizeCode(codeInput);

    const settings =
      await this.settingsService.getSettings();

    const availability =
      this.settingsService.getRegistrationAvailability(
        settings,
      );

    if (!availability.isOpen) {
      throw new ConflictException(
        'Registration is closed. New coupon changes are not allowed.',
      );
    }

    // Always resolve the current backend price.
    const currentPricing =
      this.settingsService.getCurrentPrice(
        settings,
        new Date(),
      );

    const coupon = await this.getActiveCoupon(
      code,
      registration.emailNormalized,
    );

    const calculated = this.calculatePrice(
      coupon,
      currentPricing.basePrice,
    );

    const updated =
      await this.registrations.findOneAndUpdate(
        {
          _id: registration._id,
          courseId: BATCH_01_COURSE_ID,
          status: 'draft',
        },
        {
          $set: {
            amount: calculated.finalPrice,
            originalAmount: currentPricing.originalPrice,
            pricingType: currentPricing.pricingType,
            pricingSnapshotAt: new Date(),
            couponCode: code,
            discountAmount:
              calculated.discountAmount,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
        },
      );

    if (!updated) {
      throw new ConflictException(
        'Registration has changed. Please refresh and try again.',
      );
    }

    return {
      success: true,
      registrationId: updated.registrationId,
      couponCode: code,
      pricing: {
        currency: settings.currency,
        basePrice: calculated.basePrice,
        discountAmount:
          calculated.discountAmount,
        finalPrice: calculated.finalPrice,
        pricingType: currentPricing.pricingType,
      },
      message: 'Coupon applied successfully',
    };
  }

  // Participant: remove coupon and recalculate current base price.
  async removeCoupon(accessToken: string) {
    const registration =
      await this.authorizedRegistration(accessToken);

    if (registration.status !== 'draft') {
      throw new ConflictException(
        'Coupon cannot be removed after payment starts',
      );
    }

    const settings =
      await this.settingsService.getSettings();

    const availability =
      this.settingsService.getRegistrationAvailability(
        settings,
      );

    if (!availability.isOpen) {
      throw new ConflictException(
        'Registration is closed',
      );
    }

    const pricing =
      this.settingsService.getCurrentPrice(
        settings,
        new Date(),
      );

    const updated =
      await this.registrations.findOneAndUpdate(
        {
          _id: registration._id,
          courseId: BATCH_01_COURSE_ID,
          status: 'draft',
        },
        {
          $set: {
            amount: pricing.basePrice,
            originalAmount: pricing.originalPrice,
            pricingType: pricing.pricingType,
            pricingSnapshotAt: new Date(),
            discountAmount: 0,
            updatedAt: new Date(),
          },
          $unset: {
            couponCode: '',
          },
        },
        {
          returnDocument: 'after',
        },
      );

    if (!updated) {
      throw new ConflictException(
        'Unable to remove coupon',
      );
    }

    return {
      success: true,
      registrationId: updated.registrationId,
      pricing: {
        currency: settings.currency,
        basePrice: pricing.basePrice,
        discountAmount: 0,
        finalPrice: pricing.basePrice,
        pricingType: pricing.pricingType,
      },
      message: 'Coupon removed successfully',
    };
  }
}
