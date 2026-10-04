// path: backend/src/email/email.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailService } from './email.service';
import { SendEmailDto, PreviewEmailDto } from './dto/send-email.dto';
import { FilterParticipantsDto } from './dto/filter-participants.dto';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddMembersDto,
} from './dto/create-group.dto';

@Controller('admin/emails')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // ---------- Participants ----------

  @Get('participants')
  async filterParticipants(@Query() dto: FilterParticipantsDto) {
    return this.emailService.filterParticipants(dto);
  }

  @Get('filter-options')
  async getFilterOptions() {
    return this.emailService.getFilterOptions();
  }

  // ---------- Preview ----------

  @Post('preview')
  async preview(@Body() dto: PreviewEmailDto) {
    return this.emailService.previewEmail(dto);
  }

  // ---------- Send ----------

  @Post('send')
  async send(
    @Body() dto: SendEmailDto,
    @Req() req: Request
  ) {
    const admin = (req as any).user;
    return this.emailService.sendEmail(dto, admin.id, admin.email);
  }

  @Get('campaigns/:id/progress')
  async getProgress(@Param('id') id: string) {
    return this.emailService.getCampaignProgress(id);
  }

  @Get('campaigns')
  async history() {
    return this.emailService.getCampaignHistory();
  }

  // ---------- Groups ----------

  @Get('groups')
  async listGroups() {
    return this.emailService.listGroups();
  }

  @Get('groups/:id')
  async getGroup(@Param('id') id: string) {
    return this.emailService.getGroup(id);
  }

  @Post('groups')
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: Request) {
    const admin = (req as any).user;
    return this.emailService.createGroup(dto, admin.id);
  }

  @Put('groups/:id')
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.emailService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  async deleteGroup(@Param('id') id: string) {
    return this.emailService.deleteGroup(id);
  }

  @Post('groups/:id/members')
  async addMembers(@Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.emailService.addMembers(id, dto);
  }

  @Delete('groups/:id/members/:registrationId')
  async removeMember(
    @Param('id') id: string,
    @Param('registrationId') registrationId: string
  ) {
    return this.emailService.removeMember(id, registrationId);
  }
}