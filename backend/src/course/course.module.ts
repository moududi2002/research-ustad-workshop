// backend/src/course/course.module.ts

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseAdminGateway } from './course-admin.gateway';

@Module({
  imports: [AuthModule],
  controllers: [CourseController],
  providers: [
    CourseService,
    CourseAdminGateway,
  ],
  exports: [CourseService],
})
export class CourseModule {}
