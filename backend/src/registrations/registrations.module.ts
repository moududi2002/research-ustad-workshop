//backend/src/registrations/registrations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { Registration } from './registration.entity';
import { RegistrationGateway } from './registration.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  controllers: [RegistrationsController],
  providers: [
    RegistrationsService,
    RegistrationGateway,
  ],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}