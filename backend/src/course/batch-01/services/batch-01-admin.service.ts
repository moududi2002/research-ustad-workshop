
// backend/src/course/batch-01/services/batch-01-admin.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Collection, ObjectId } from 'mongodb';

import { Batch01DatabaseService } from '../database/batch-01-database.service';
import { BATCH_01_COURSE_ID } from '../config/batch-01.defaults';

import { Batch01NotificationService } from './batch-01-notification.service';
import { Batch01ConfirmationService } from './batch-01-confirmation.service';

@Injectable()
export class Batch01AdminService {
  constructor(
    private readonly databaseService: Batch01DatabaseService,
    private readonly notificationService: Batch01NotificationService,
    private readonly confirmationService: Batch01ConfirmationService,
  ) {}

  private get registrations(): Collection<any> {
    return this.databaseService
      .getDb()
      .collection('batch_01_registrations');
  }

  private validateId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participant ID');
    }

    return new ObjectId(id);
  }

  private async findParticipantById(id: string) {
    const participant = await this.registrations.findOne(
      {
        _id: this.validateId(id),
        courseId: BATCH_01_COURSE_ID,
      },
      {
        projection: {
          accessHash: 0,
          resumeOtpHash: 0,
        },
      },
    );

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return participant;
  }

  async getParticipants(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const filter: Record<string, any> = {
      courseId: BATCH_01_COURSE_ID,
    };

    if (query.status && query.status !== 'all') {
      const allowedStatuses = [
        'draft',
        'initiating',
        'pending',
        'paid',
        'confirmed',
      ];

      if (!allowedStatuses.includes(query.status)) {
        throw new BadRequestException('Invalid registration status');
      }

      filter.status = query.status;
    }

    const search = String(query.search || '').trim();

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      filter.$or = [
        { fullName: regex },
        { email: regex },
        { whatsapp: regex },
        { registrationId: regex },
        { transactionId: regex },
        { invoiceNumber: regex },
        { universityName: regex },
      ];
    }

    const [total, records] = await Promise.all([
      this.registrations.countDocuments(filter),

      this.registrations
        .find(filter, {
          projection: {
            accessHash: 0,
            resumeOtpHash: 0,
          },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    return {
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getParticipant(id: string) {
    const participant = await this.findParticipantById(id);

    return {
      success: true,
      data: participant,
    };
  }

  async getStats() {
    const courseFilter = {
      courseId: BATCH_01_COURSE_ID,
    };

    const [
      total,
      draft,
      pending,
      paid,
      confirmed,
      revenue,
    ] = await Promise.all([
      this.registrations.countDocuments(courseFilter),

      this.registrations.countDocuments({
        ...courseFilter,
        status: 'draft',
      }),

      this.registrations.countDocuments({
        ...courseFilter,
        status: { $in: ['pending', 'initiating'] },
      }),

      this.registrations.countDocuments({
        ...courseFilter,
        status: 'paid',
      }),

      this.registrations.countDocuments({
        ...courseFilter,
        status: 'confirmed',
      }),

      this.registrations
        .aggregate([
          {
            $match: {
              ...courseFilter,
              status: { $in: ['paid', 'confirmed'] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ])
        .toArray(),
    ]);

    return {
      success: true,
      total,
      draft,
      pending,
      paid,
      confirmed,
      revenue: revenue[0]?.total || 0,
    };
  }

  async getDashboard() {
    return this.getStats();
  }

  async confirmEnrollment(id: string, adminId: string) {
    this.validateId(id);

    return this.confirmationService.confirmById(
      id,
      adminId,
    );
  }

  /**
   * The existing Batch01NotificationService sends the
   * enrollment confirmation email with PDF attachment.
   * It does not have a separate payment-only email method.
   */
  async resendEnrollmentEmail(id: string) {
    const participant = await this.findParticipantById(id);

    if (participant.status !== 'confirmed') {
      throw new ConflictException(
        'Enrollment email is available only for confirmed participants',
      );
    }

    return this.notificationService.resendById(
      participant.registrationId,
      'email',
    );
  }

  async resendSms(id: string) {
    const participant = await this.findParticipantById(id);

    if (participant.status !== 'confirmed') {
      throw new ConflictException(
        'SMS is available only for confirmed participants',
      );
    }

    return this.notificationService.resendById(
      participant.registrationId,
      'sms',
    );
  }
}
