import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SmsService } from './sms.service';

@Controller('admin/sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('participants')
  getParticipants() {
    return this.smsService.getParticipants();
  }

  @Post('send')
  send(@Body() body: {
    mode: 'all' | 'selected' | 'manual';
    registrationIds?: string[];
    phoneNumbers?: string[];
    message: string;
  }) {
    return this.smsService.send(body);
  }

  @Get('history')
  getHistory() {
  return this.smsService.getHistory(500);
  }

  @Get(':id/dlr')
  refreshDeliveryStatus(@Param('id') id: string) {
  return this.smsService.refreshDeliveryStatus(id);
  }
}
