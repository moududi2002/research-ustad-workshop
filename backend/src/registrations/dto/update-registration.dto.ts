//backend/src/registrations/dto/update-registration.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistrationDto } from './create-registration.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateRegistrationDto extends PartialType(CreateRegistrationDto) {
  @IsString()
  @IsOptional()
  attendanceStatus?: string;

  @IsBoolean()
  @IsOptional()
  certificateIssued?: boolean;

  @IsBoolean()
  @IsOptional()
  feedbackSubmitted?: boolean;
}