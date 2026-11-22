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
  Res,
} from '@nestjs/common';

import { Response } from 'express';

import { Batch01PaymentService } from '../services/batch-01-payment.service';
import { Batch01ConfirmationService } from '../services/batch-01-confirmation.service';
import { verifySharedIpn } from '../../shared-ipn-auth';

@Controller('course/batch-01')
export class Batch01PaymentController {
  constructor(
    private readonly paymentService: Batch01PaymentService,
    private readonly confirmationService: Batch01ConfirmationService,
  ) {}

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

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Headers('x-course-access') token: string,
  ) {
    return this.paymentService.verify(token);
  }

  // Participant confirms after PayStation payment verification.
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Headers('x-course-access') token: string,
    @Body() body: {
      termsAccepted: boolean;
    },
  ) {
    return this.confirmationService.confirmByAccessToken(
      token,
      body?.termsAccepted,
    );
  }

  // Participant downloads their own confirmed payment receipt.
  @Get('receipt')
  async downloadReceipt(
    @Headers('x-course-access') token: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.confirmationService.generateParticipantReceipt(
        token,
      );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }

  // Internal IPN receiver.
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

  // PayStation browser callback.
  @Get('callback')
  async callbackGet(
    @Res() res: Response,
    @Query('invoice_number') invoiceNumber?: string,
    @Query('invoiceNumber') invoiceNumberAlt?: string,
  ) {
    const invoice = String(
      invoiceNumber || invoiceNumberAlt || '',
    );

    const redirectUrl =
      await this.paymentService.callback(invoice);

    return res.redirect(303, redirectUrl);
  }

  @Post('callback')
  async callbackPost(
    @Body() body: any,
    @Res() res: Response,
  ) {
    const invoice = String(
      body?.invoice_number || body?.invoiceNumber || '',
    );

    const redirectUrl =
      await this.paymentService.callback(invoice);

    return res.redirect(303, redirectUrl);
  }
}