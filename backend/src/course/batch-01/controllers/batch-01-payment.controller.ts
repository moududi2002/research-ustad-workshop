// backend/src/course/batch-01/controllers/batch-01-payment.controller.ts

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import {
  Request,
  Response,
} from 'express';

import {
  Batch01PaymentService,
} from '../services/batch-01-payment.service';

import {
  verifySharedIpn,
} from '../../shared-ipn-auth';

@Controller('course/batch-01')
export class Batch01PaymentController {
  constructor(
    private readonly paymentService: Batch01PaymentService,
  ) {}

  // Participant: initiate payment.
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  async initiate(
    @Headers('x-course-access') token: string,
    @Body()
    body: {
      termsAccepted: boolean;
      refundPolicyAccepted: boolean;
    },
  ) {
    return this.paymentService.initiate(
      token,
      body?.termsAccepted,
      body?.refundPolicyAccepted,
    );
  }

  // Participant: verify payment from their registration session.
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Headers('x-course-access') token: string,
  ) {
    return this.paymentService.verify(token);
  }

  // Internal IPN receiver.
  // Main Backend forwards PayStation IPN with HMAC headers.
  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async ipn(
    @Body() body: any,
    @Headers('x-ru-ipn-timestamp') timestamp: string,
    @Headers('x-ru-ipn-signature') signature: string,
  ) {
    verifySharedIpn(body, timestamp, signature);

    return this.paymentService.handleIpn(body);
  }

  // Browser callback from PayStation.
  @Get('callback')
  async callbackGet(
    @Req() req: Request,
    @Res() res: Response,
    @Query('invoice_number') invoiceNumber?: string,
    @Query('invoiceNumber') invoiceNumberAlt?: string,
  ) {
    const invoice = String(
      invoiceNumber ||
      invoiceNumberAlt ||
      req.query.invoice_number ||
      req.query.invoiceNumber ||
      '',
    );

    const redirectUrl =
      await this.paymentService.callback(invoice);

    return res.redirect(303, redirectUrl);
  }

  // Some gateway configurations may return callback by POST.
  @Post('callback')
  async callbackPost(
    @Body() body: any,
    @Res() res: Response,
  ) {
    const invoice = String(
      body?.invoice_number ||
      body?.invoiceNumber ||
      '',
    );

    const redirectUrl =
      await this.paymentService.callback(invoice);

    return res.redirect(303, redirectUrl);
  }
}