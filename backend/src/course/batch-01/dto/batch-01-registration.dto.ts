
// backend/src/course/batch-01/dto/batch-01-registration.dto.ts

import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class Batch01RegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(20)
  whatsapp: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'Undergraduate Student',
    "Master's Student",
    'Recent Graduate',
    'Researcher',
    'Higher Study Applicant',
    'Other',
  ])
  academicStatus: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  universityName: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  department?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'Complete Beginner',
    'Beginner',
    'Developing',
    'Intermediate',
    'Experienced',
  ])
  researchLevel: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Yes', 'No'])
  higherStudyInterest: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  preferredCountry?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  registrationSource: string;

  @IsBoolean()
  @IsNotEmpty()
  consent: boolean;
}
