
// backend/src/course/batch-01/controllers/batch-01-coupon.controller.ts

import {
 Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';


import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

import {
  Batch01CouponService,
} from '../services/batch-01-coupon.service';

import {
  Batch01CreateCouponDto,
  Batch01ApplyCouponDto,
} from '../dto/batch-01-coupon.dto';

@Controller('course/batch-01')
export class Batch01CouponController {
  constructor(
    private readonly couponService:
      Batch01CouponService,
  ) {}

  // Participant: apply coupon.
  @Post('coupon/apply')
  @HttpCode(HttpStatus.OK)
  async applyCoupon(
    @Headers('x-course-access') token: string,
    @Body() body: Batch01ApplyCouponDto,
  ) {
    return this.couponService.applyCoupon(
      token,
      body.code,
    );
  }

  // Participant: remove coupon.
  @Post('coupon/remove')
  @HttpCode(HttpStatus.OK)
  async removeCoupon(
    @Headers('x-course-access') token: string,
  ) {
    return this.couponService.removeCoupon(token);
  }

  // Admin: create coupon.
  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(
    @Body() body: Batch01CreateCouponDto,
    @Headers('origin') origin?: string,
  ) {
    this.validateOrigin(origin);

    return this.couponService.createCoupon(body);
  }

  // Admin: list coupons.
  @Get('admin/coupons/list')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async listCoupons(
    @Headers('origin') origin?: string,
  ) {
    this.validateOrigin(origin);

    return this.couponService.listCoupons();
  }

  // Admin: activate/deactivate coupon.
  @Patch('admin/coupons/:code')
  @UseGuards(JwtAuthGuard)
  async setCouponStatus(
    @Param('code') code: string,
    @Body() body: { active: boolean },
    @Headers('origin') origin?: string,
  ) {
    this.validateOrigin(origin);

    if (typeof body?.active !== 'boolean') {
      throw new BadRequestException(
        'active must be a boolean value',
        );
    }

    return this.couponService.setCouponStatus(
      code,
      body.active,
    );
  }

  private validateOrigin(origin?: string) {
    // Allow non-browser clients without Origin.
    // Browser requests must originate from the official workshop site.
    if (
      origin &&
      origin !==
        'https://workshop.researchustad.org'
    ) {
      throw new ForbiddenException(
        'Invalid request origin',
        );
    }
  }
}
