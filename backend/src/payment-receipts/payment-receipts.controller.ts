import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentReceiptsService } from './payment-receipts.service';

@Controller('admin/payment-receipts')
@UseGuards(JwtAuthGuard)
export class PaymentReceiptsController {
  constructor(
    private readonly paymentReceiptsService: PaymentReceiptsService,
  ) {}

  @Get(':registrationId/pdf')
  async downloadReceipt(
    @Param('registrationId') registrationId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.paymentReceiptsService.generateByRegistrationId(
        registrationId,
      );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }
}