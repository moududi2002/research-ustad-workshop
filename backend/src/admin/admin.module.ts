//backend/src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Registration } from '../registrations/registration.entity';
import { RegistrationsModule } from '../registrations/registrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration]),
    RegistrationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}