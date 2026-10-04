// path: backend/src/email/dto/send-email.dto.ts

import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayNotEmpty,
} from 'class-validator';

export class SendEmailDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  recipientIds: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  bodyHtml: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bcc?: string[];
}

export class PreviewEmailDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  recipientIds?: string[];

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  bodyHtml?: string;
}