import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentReceiptsModule } from '../payment-receipts/payment-receipts.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseAdminGateway } from './course-admin.gateway';

@Module({
  imports: [
    AuthModule,
    PaymentReceiptsModule,
  ],
  controllers: [
    CourseController,
  ],
  providers: [
    CourseService,
    CourseAdminGateway,
  ],
  exports: [
    CourseService,
  ],
})
export class CourseModule {}