import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { Registration } from '../registrations/registration.entity';
import { Certificate } from './certificate.entity';
import { CertificateEmailLog } from './certificate-email-log.entity';
import { AttendanceSourceService } from './attendance-source.service';
import { CertificatesService } from './certificates.service';
import { CertificatePdfService } from './certificate-pdf.service';
import { CertificateDispatchService } from './certificate-dispatch.service';
import { CertificatesAdminController, CertificatesPublicController } from './certificates.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Registration, Certificate, CertificateEmailLog]),
  ],
  providers: [
    AttendanceSourceService,
    CertificatesService,
    CertificatePdfService,
    CertificateDispatchService,
  ],
  controllers: [CertificatesAdminController, CertificatesPublicController],
})
export class CertificatesModule {}
