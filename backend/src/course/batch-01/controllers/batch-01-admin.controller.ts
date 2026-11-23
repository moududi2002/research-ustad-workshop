// backend/src/course/batch-01/controllers/batch-01-admin.controller.ts

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Batch01AdminService } from '../services/batch-01-admin.service';

@Controller('course/batch-01/admin')
@UseGuards(JwtAuthGuard)
export class Batch01AdminController {
  constructor(
    private readonly adminService: Batch01AdminService,
  ) {}

  @Get('participants')
  async participants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getParticipants({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
    });
  }

  // Keep "stats" above ":id" so it is not treated as an ID.
  @Get('participants/stats')
  async stats() {
    return this.adminService.getStats();
  }

  @Get('participants/:id')
  async participant(@Param('id') id: string) {
    return this.adminService.getParticipant(id);
  }

  @Post('participants/:id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.adminService.confirmEnrollment(
      id,
      String(req.user?.id || ''),
    );
  }

  @Post('participants/:id/resend-payment-email')
  @HttpCode(HttpStatus.OK)
  async resendPaymentEmail(@Param('id') id: string) {
    return this.adminService.resendPaymentEmail(id);
  }

  @Post('participants/:id/resend-enrollment-email')
  @HttpCode(HttpStatus.OK)
  async resendEnrollmentEmail(@Param('id') id: string) {
    return this.adminService.resendEnrollmentEmail(id);
  }

  @Post('participants/:id/resend-sms')
  @HttpCode(HttpStatus.OK)
  async resendSms(@Param('id') id: string) {
    return this.adminService.resendSms(id);
  }
}