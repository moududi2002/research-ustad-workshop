
// backend/src/course/course.module.ts

import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { PaymentReceiptsModule } from '../payment-receipts/payment-receipts.module';

import { CourseController } from './course.controller';

import { CourseService } from './course.service';

import { CourseAdminGateway } from './course-admin.gateway';

// New independent Batch-01 module.
import { Batch01Module } from './batch-01/batch-01.module';

@Module({
  imports: [
    AuthModule,
    PaymentReceiptsModule,

    // Research Foundation Course - Batch 01.
    Batch01Module,
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
