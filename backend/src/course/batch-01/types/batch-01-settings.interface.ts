
// backend/src/course/batch-01/types/batch-01-settings.interface.ts

import { ObjectId } from 'mongodb';

export interface Batch01Settings {
  _id?: ObjectId;

  courseId: string;

  courseName: string;

  batchName: string;

  registrationEnabled: boolean;

  earlyBirdFee: number;

  regularFee: number;

  currency: string;

  earlyBirdEndsAt: Date;

  registrationClosesAt: Date;

  courseStartAt: Date;

  timezone: string;

  createdAt: Date;

  updatedAt: Date;
}
