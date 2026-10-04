// path: backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsModule } from './registrations/registrations.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { Registration } from './registrations/registration.entity';
import { Admin } from './auth/admin.entity';
import { EmailCampaign } from './email/email-campaign.entity';
import { EmailGroup } from './email/email-group.entity';
import { EmailGroupMember } from './email/email-group-member.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'research_ustad_workshop'),
        entities: [
          Registration,
          Admin,
          EmailCampaign,
          EmailGroup,
          EmailGroupMember,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: false,
      }),
    }),
    AuthModule,
    RegistrationsModule,
    AdminModule,
    EmailModule,
  ],
})
export class AppModule {}