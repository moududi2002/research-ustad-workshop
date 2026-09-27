//backend/src/registrations/registrations.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers 
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('registrations')
export class RegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService
  ) {}

  // Public — anyone can register
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateRegistrationDto,
    @Headers('user-agent') userAgent: string,
  ) {

    const registration = await this.registrationsService.create(
  dto,
  userAgent,
);

    return {
      id: registration.id,
      registrationId: registration.registrationId,
      fullName: registration.fullName,
      email: registration.email,
      workshopDate: '17 October 2026',
      createdAt: registration.createdAt,
    };
  }

  // Public — participant can look up their own registration by ID
  @Get(':registrationId')
  async findOne(@Param('registrationId') registrationId: string) {
    const reg = await this.registrationsService.findByRegistrationId(
      registrationId
    );

    return {
      id: reg.id,
      registrationId: reg.registrationId,
      fullName: reg.fullName,
      email: reg.email,
      workshopDate: '17 October 2026',
      createdAt: reg.createdAt,
    };
  }

  // 🔒 Admin only — list all registrations
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.registrationsService.findAll();
  }

  // 🔒 Admin only — update a registration
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationDto
  ) {
    return this.registrationsService.update(id, dto);
  }

  // 🔒 Admin only — delete a registration
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.registrationsService.remove(id);
  }
}