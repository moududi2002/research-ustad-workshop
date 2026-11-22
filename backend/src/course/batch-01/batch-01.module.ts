// backend/src/course/batch-01/batch-01.module.ts

import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';

import {
  Batch01DatabaseService,
} from './database/batch-01-database.service';

import {
  Batch01SettingsController,
} from './controllers/batch-01-settings.controller';

import {
  Batch01RegistrationController,
} from './controllers/batch-01-registration.controller';

import {
  Batch01CouponController,
} from './controllers/batch-01-coupon.controller';

import {
  Batch01PaymentController,
} from './controllers/batch-01-payment.controller';

import {
  Batch01SettingsService,
} from './services/batch-01-settings.service';

import {
  Batch01RegistrationService,
} from './services/batch-01-registration.service';

import {
  Batch01CouponService,
} from './services/batch-01-coupon.service';

import {
  Batch01PaymentService,
} from './services/batch-01-payment.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    Batch01SettingsController,
    Batch01RegistrationController,
    Batch01CouponController,
    Batch01PaymentController,
  ],

  providers: [
    Batch01DatabaseService,
    Batch01SettingsService,
    Batch01RegistrationService,
    Batch01CouponService,
    Batch01PaymentService,
  ],

  exports: [
    Batch01DatabaseService,
    Batch01SettingsService,
    Batch01RegistrationService,
    Batch01CouponService,
    Batch01PaymentService,
  ],
})
export class Batch01Module {}