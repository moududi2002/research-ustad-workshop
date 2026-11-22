
// backend/src/course/batch-01/dto/batch-01-coupon.dto.ts

import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class Batch01CreateCouponDto {
  @IsString()
  @MaxLength(32)
  code: string;

  @IsIn([
    'final_price',
    'percentage',
    'fixed',
  ])
  type: 'final_price' | 'percentage' | 'fixed';

  @IsInt()
  @Min(1)
  @Max(999)
  value: number;

  @IsOptional()
  @IsEmail()
  allowedEmail?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class Batch01ApplyCouponDto {
  @IsString()
  @MaxLength(32)
  code: string;
}
