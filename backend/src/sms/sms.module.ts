import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from '../registrations/registration.entity';
import { SmsLog } from './sms-log.entity';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, SmsLog])],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}