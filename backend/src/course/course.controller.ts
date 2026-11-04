// backend/src/course/course.controller.ts

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  Req,
  Patch,
  Param,
  UseGuards,
  ForbiddenException,
  } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { CourseService } from './course.service';
import { CourseRegistrationDto } from './dto/course-registration.dto';

import { verifySharedIpn } from './shared-ipn-auth';

@Controller('course')
export class CourseController {
  constructor(private readonly course: CourseService) {}

  @Post('register')
  async register(@Body() dto: CourseRegistrationDto) {
    return this.course.register(dto);
  }

  @Get('status')
  async status(@Headers('x-course-access') token: string) {
    return this.course.status(token);
  }

  @Post('initiate')
  async initiate(@Headers('x-course-access') token: string) {
    return this.course.initiate(token);
  }

  @Post('verify')
  async verify(@Headers('x-course-access') token: string) {
    return this.course.verify(token);
  }

  @Post('confirm')
  async confirm(
    @Headers('x-course-access') token: string,
    @Body() data: { termsAccepted: boolean },
  ) {
    return this.course.confirm(token, data?.termsAccepted);
  }

 // PayStation Merchant IPN


  /**
   * Internal Course IPN Receiver
   *
   * The public PayStation IPN is first handled
   * by the Main Express Backend.
   *
   * Only HMAC-authenticated internal forwarding
   * can reach the Course payment handler.
   */

  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async ipn(
    @Body() body: any,

    @Headers('x-ru-ipn-timestamp')
    timestamp: string,

    @Headers('x-ru-ipn-signature')
    signature: string,
  ) {
    // Step 1: Verify Main Backend authentication.
    verifySharedIpn(body, timestamp, signature);

    // Step 2: Existing CourseService checks invoice ownership
    // and verifies the transaction with PayStation itself.
    return this.course.handleIpn(body);
  }

  // Browser return from PayStation; never assume payment succeeded.
  @Get('callback')
  async callbackGet(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const invoice = String(
      req.query.invoice_number || req.query.invoiceNumber || '',
    );

    const url = await this.course.callback(invoice);
    return res.redirect(303, url);
  }

  @Post('callback')
  async callbackPost(
    @Body() body: any,
    @Res() res: Response,
  ) {
    const invoice = String(
      body?.invoice_number || body?.invoiceNumber || '',
    );

    const url = await this.course.callback(invoice);
    return res.redirect(303, url);
  }

 @Post('resume/request')
 @HttpCode(HttpStatus.OK)
    async requestResume(
    @Body('email') email: string,
    ) {
    return this.course.requestResume(email);
    }

    @Post('resume/verify')
    @HttpCode(HttpStatus.OK)
    async verifyResume(
    @Body() body: { email: string; code: string },
    ) {
    return this.course.verifyResume(
        body?.email,
        body?.code,
    );
  }

  

  @Post('coupon/apply')
  @HttpCode(HttpStatus.OK)
  async applyCoupon(
    @Headers('x-course-access') token: string,
    @Body('code') code: string,
  ) {
    return this.course.applyCoupon(token, code);
  }

  @Post('coupon/remove')
  @HttpCode(HttpStatus.OK)
  async removeCoupon(
    @Headers('x-course-access') token: string,
  ) {
    return this.course.removeCoupon(token);
  }

  // Existing Workshop Admin JWT authentication required.
  @Get('admin/coupons')
  @UseGuards(JwtAuthGuard)
  async listCoupons() {
    return this.course.listCoupons();
  }

  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCoupon(
    @Body() body: {
      code: string;
      type: 'final_price' | 'percentage' | 'fixed';
      value: number;
      allowedEmail?: string;
      expiresAt?: string;
    },
    @Headers('origin') origin?: string,
  ) {
    if (
      origin &&
      origin !== 'https://workshop.researchustad.org'
    ) {
      throw new ForbiddenException('Invalid request origin');
    }

    return this.course.createCoupon(body);
  }

  @Patch('admin/coupons/:code')
  @UseGuards(JwtAuthGuard)
  async deactivateCoupon(
    @Param('code') code: string,
    @Headers('origin') origin?: string,
  ) {
    if (
      origin &&
      origin !== 'https://workshop.researchustad.org'
    ) {
      throw new ForbiddenException('Invalid request origin');
    }

    return this.course.deactivateCoupon(code);
  }

}