//backend/src/registrations/registrations.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';

@Controller('registrations')
export class RegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRegistrationDto) {
    const registration = await this.registrationsService.create(dto);

    return {
      id: registration.id,
      registrationId: registration.registrationId,
      fullName: registration.fullName,
      email: registration.email,
      workshopDate: '26 September 2026',
      createdAt: registration.createdAt,
    };
  }

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
      workshopDate: '26 September 2026',
      createdAt: reg.createdAt,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationDto
  ) {
    return this.registrationsService.update(id, dto);
  }
}