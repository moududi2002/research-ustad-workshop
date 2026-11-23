// backend/src/course/batch-01/controllers/batch-01-payment.controller.ts

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { Batch01PaymentService } from '../services/batch-01-payment.service';
import { Batch01ConfirmationService } from '../services/batch-01-confirmation.service';
import { verifySharedIpn } from '../../shared-ipn-auth';

const COOKIE_NAME = 'ru_batch01_access';

@Controller('course/batch-01')
export class Batch01PaymentController {
  constructor(
    private readonly paymentService: Batch01PaymentService,
    private readonly confirmationService: Batch01ConfirmationService,
  ) {}

  private resolveToken(
    req: Request,
    headerToken?: string,
  ): string | undefined {
    if (headerToken?.trim()) {
      return headerToken.trim();
    }

    // Protect cookie-authenticated requests from
    // unexpected browser origins.
    const origin = req.headers.origin;

    if (
      origin &&
      origin !== 'https://workshop.researchustad.org' &&
      origin !== 'http://localhost:3000'
    ) {
      throw new ForbiddenException('Invalid request origin');
    }

    const cookieToken = req.cookies?.[COOKIE_NAME];

    return typeof cookieToken === 'string'
      ? cookieToken
      : undefined;
  }

  // Start PayStation payment
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  async initiate(
    @Req() req: Request,
    @Headers('x-course-access') headerToken: string,
    @Body() body: {
      termsAccepted: boolean;
      refundPolicyAccepted: boolean;
    },
  ) {
    return this.paymentService.initiate(
      this.resolveToken(req, headerToken),
      body?.termsAccepted,
      body?.refundPolicyAccepted,
    );
  }

  // Verify payment
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Req() req: Request,
    @Headers('x-course-access') headerToken: string,
  ) {
    return this.paymentService.verify(
      this.resolveToken(req, headerToken),
    );
  }

  // Participant confirms after successful payment
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Req() req: Request,
    @Headers('x-course-access') headerToken: string,
    @Body() body: {
      termsAccepted: boolean;
    },
  ) {
    return this.confirmationService.confirmByAccessToken(
      this.resolveToken(req, headerToken),
      body?.termsAccepted,
    );
  }

  // Download participant receipt
  @Get('receipt')
  async downloadReceipt(
    @Req() req: Request,
    @Headers('x-course-access') headerToken: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.confirmationService.generateParticipantReceipt(
        this.resolveToken(req, headerToken),
      );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }

  // Internal PayStation IPN — unchanged
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

  // PayStation browser callback — unchanged
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