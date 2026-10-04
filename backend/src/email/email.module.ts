// path: backend/src/email/email.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailCampaign } from './email-campaign.entity';
import { EmailGroup } from './email-group.entity';
import { EmailGroupMember } from './email-group-member.entity';
import { Registration } from '../registrations/registration.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([
      EmailCampaign,
      EmailGroup,
      EmailGroupMember,
      Registration,
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}