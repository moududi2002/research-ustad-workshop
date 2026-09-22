//backend/src/registrations/dto/create-registration.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
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
  preferredCountry?: string;

  @IsString()
  @IsNotEmpty()
  registrationSource: string;

  @IsBoolean()
  @IsNotEmpty()
  consent: boolean;
}