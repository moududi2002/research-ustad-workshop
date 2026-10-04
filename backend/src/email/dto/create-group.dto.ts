// path: backend/src/email/dto/create-group.dto.ts

import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddMembersDto {
  @IsArray()
  @IsString({ each: true })
  memberIds: string[];
}