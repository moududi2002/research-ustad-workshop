import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEmail,
  IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';

export class IssueCertificatesDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ArrayUnique()
  @IsString({ each: true })
  registrationIds: string[];
}

export class CustomCertificateDto {
  @IsString() @MinLength(2) @MaxLength(150)
  fullName: string;
  @IsEmail() @MaxLength(255)
  email: string;
  @IsOptional() @IsString() @MaxLength(30)
  whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(150)
  department?: string;
  @IsOptional() @IsString() @MaxLength(255)
  universityName?: string;
}
