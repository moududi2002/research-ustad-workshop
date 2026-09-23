// path: backend/src/admin/admin.controller.ts

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard) // 🔒 Protect ALL admin routes with JWT
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly registrationsService: RegistrationsService
  ) {}

  @Get('stats')
  async getStats() {
    return this.registrationsService.getStats();
  }

  @Get('export')
  async export(
    @Query('format') format: 'csv' | 'excel',
    @Res() res: Response
  ) {
    if (format === 'excel') {
      const buffer = await this.adminService.exportExcel();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=registrations.xlsx'
      );
      return res.send(buffer);
    }

    const csv = await this.adminService.exportCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=registrations.csv'
    );
    return res.send(csv);
  }

  @Post('send-bulk-email')
  async sendBulkEmail(
    @Body() body: { subject: string; htmlBody: string }
  ) {
    return this.adminService.sendBulkEmail(body.subject, body.htmlBody);
  }

  @Post('send-reminder')
  async sendReminder() {
    return this.adminService.sendWorkshopReminder();
  }

  @Post('send-certificate-notification')
  async sendCertificateNotification() {
    return this.adminService.sendCertificateNotification();
  }
}