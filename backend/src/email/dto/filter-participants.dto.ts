// path: backend/src/email/dto/filter-participants.dto.ts

import { IsOptional, IsString, IsIn } from 'class-validator';

export class FilterParticipantsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  academicStatus?: string;

  @IsOptional()
  @IsString()
  researchLevel?: string;

  @IsOptional()
  @IsIn(['Yes', 'No'])
  higherStudyInterest?: string;

  @IsOptional()
  @IsString()
  registrationSource?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}