// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsModule } from './registrations/registrations.module';
import { AdminModule } from './admin/admin.module';
import { Registration } from './registrations/registration.entity';

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
        entities: [Registration],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: false,
      }),
    }),
    RegistrationsModule,
    AdminModule,
  ],
})
export class AppModule {}