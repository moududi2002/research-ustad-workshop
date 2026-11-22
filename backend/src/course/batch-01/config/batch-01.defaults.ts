
// backend/src/course/batch-01/config/batch-01.defaults.ts

export const BATCH_01_COURSE_ID =
  'research-foundation-2026-batch-01';

export const BATCH_01_COURSE_SLUG =
  'research-foundation-course-2026';

export const BATCH_01_DEFAULTS = {
  courseId: BATCH_01_COURSE_ID,

  courseName: 'Research Foundation Course-2026',

  batchName: 'Batch-01',

  registrationEnabled: true,

  earlyBirdFee: 499,

  regularFee: 999,

  currency: 'BDT',

  // DEMO DATE: Replace with your actual Early Bird deadline.
  // Bangladesh timezone: UTC+06:00.
  earlyBirdEndsAt: new Date(
    '2027-01-15T23:59:59+06:00',
  ),

  // DEMO DATE: Course start date is also the registration closing date.
  registrationClosesAt: new Date(
    '2027-01-31T23:59:59+06:00',
  ),

  // DEMO DATE: Replace with the actual course starting date.
  courseStartAt: new Date(
    '2027-01-31T23:59:59+06:00',
  ),

  timezone: 'Asia/Dhaka',

  createdAt: new Date(),

  updatedAt: new Date(),
};
