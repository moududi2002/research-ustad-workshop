// backend/src/course/batch-01/controllers/batch-01-admin.controller.ts

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Batch01AdminService } from '../services/batch-01-admin.service';

@Controller('course/batch-01/admin')
@UseGuards(JwtAuthGuard)
export class Batch01AdminController {
  constructor(
    private readonly adminService: Batch01AdminService,
  ) {}

  @Get('participants')
  getParticipants(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getParticipants({
      search,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('participants/stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('participants/:id')
  getParticipant(@Param('id') id: string) {
    return this.adminService.getParticipant(id);
  }

  @Post('participants/:id/confirm')
  confirmEnrollment(
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const admin = (request as any).user;

    return this.adminService.confirmEnrollment(
      id,
      String(admin?.id || admin?.sub || 'admin'),
    );
  }

  @Post('participants/:id/resend-payment-email')
  resendPaymentEmail(@Param('id') id: string) {
    return this.adminService.resendPaymentEmail(id);
  }

  @Post('participants/:id/resend-enrollment-email')
  resendEnrollmentEmail(@Param('id') id: string) {
    return this.adminService.resendEnrollmentEmail(id);
  }
}