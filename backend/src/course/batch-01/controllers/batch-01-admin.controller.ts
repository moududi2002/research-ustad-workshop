
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

import { Batch01NotificationService } from '../services/batch-01-notification.service';
import { Batch01ConfirmationService } from '../services/batch-01-confirmation.service';

interface ParticipantQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface Batch01Participant {
  _id: ObjectId;
  courseId: string;
  registrationId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  universityName?: string;
  status: 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
  amount: number;
  originalAmount?: number;
  pricingType?: string;
  invoiceNumber?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  confirmedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  accessHash?: string;
  notifications?: {
    email?: string;
    sms?: string;
    emailAt?: Date;
    smsAt?: Date;
    emailError?: string;
    smsError?: string;
  };
}

@Injectable()
export class Batch01AdminService {
  constructor(
    private readonly databaseService: Batch01DatabaseService,
    private readonly notificationService: Batch01NotificationService,
    private readonly confirmationService: Batch01ConfirmationService,
  ) {}

  /**
   * Batch-01 registration collection.
   */
  private get registrations(): Collection<Batch01Participant> {
    return this.databaseService
      .getDb()
      .collection<Batch01Participant>('batch_01_registrations');
  }

  /**
   * Validate MongoDB participant ID.
   */
  private validateParticipantId(id: string): ObjectId {
    if (!id || !ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participant ID');
    }

    return new ObjectId(id);
  }

  /**
   * Find one participant by MongoDB ID.
   */
  private async findParticipantById(
    id: string,
  ): Promise<Batch01Participant> {
    const objectId = this.validateParticipantId(id);

    const participant = await this.registrations.findOne({
      _id: objectId,
      courseId: BATCH_01_COURSE_ID,
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return participant;
  }

  /**
   * Return participant without private access credentials.
   */
  private sanitizeParticipant(
    participant: Batch01Participant,
  ) {
    const {
      accessHash,
      ...safeParticipant
    } = participant;

    return safeParticipant;
  }

  /**
   * Get participants with pagination, filtering and search.
   */
  async getParticipants(query: ParticipantQuery) {
    const page = Math.max(
      1,
      Math.floor(Number(query.page) || 1),
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Math.floor(Number(query.limit) || 20),
      ),
    );

    const filter: Record<string, any> = {
      courseId: BATCH_01_COURSE_ID,
    };

    /**
     * Status filter.
     */
    if (query.status && query.status !== 'all') {
      const allowedStatuses = [
        'draft',
        'initiating',
        'pending',
        'paid',
        'confirmed',
      ];

      if (!allowedStatuses.includes(query.status)) {
        throw new BadRequestException(
          'Invalid registration status',
        );
      }

      filter.status = query.status;
    }

    /**
     * Search filter.
     */
    const search = String(query.search || '').trim();

    if (search) {
      if (search.length > 150) {
        throw new BadRequestException(
          'Search query is too long',
        );
      }

      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      const regex = new RegExp(escapedSearch, 'i');

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

    const skip = (page - 1) * limit;

    const [total, participants] = await Promise.all([
      this.registrations.countDocuments(filter),

      this.registrations
        .find(filter, {
          projection: {
            accessHash: 0,
          },
        })
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return {
      success: true,
      data: participants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get participant details.
   */
  async getParticipant(id: string) {
    const participant = await this.findParticipantById(id);

    return {
      success: true,
      data: this.sanitizeParticipant(participant),
    };
  }

  /**
   * Get Batch-01 dashboard statistics.
   */
  async getStats() {
    const courseFilter = {
      courseId: BATCH_01_COURSE_ID,
    };

    const [
      total,
      draft,
      initiating,
      pending,
      paid,
      confirmed,
      revenueResult,
    ] = await Promise.all([
      this.registrations.countDocuments(courseFilter),

      this.registrations.countDocuments({
        ...courseFilter,
        status: 'draft',
      }),

      this.registrations.countDocuments({
        ...courseFilter,
        status: 'initiating',
      }),

      this.registrations.countDocuments({
        ...courseFilter,
        status: 'pending',
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
              status: {
                $in: ['paid', 'confirmed'],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: '$amount',
              },
            },
          },
        ])
        .toArray(),
    ]);

    const revenue = Number(
      revenueResult[0]?.totalRevenue || 0,
    );

    return {
      success: true,
      data: {
        total,
        draft,
        initiating,
        pending,
        paid,
        confirmed,
        revenue,
      },

      // Keep top-level properties for existing dashboard compatibility.
      total,
      draft,
      initiating,
      pending,
      paid,
      confirmed,
      revenue,
    };
  }

  /**
   * Dashboard alias.
   */
  async getDashboard() {
    return this.getStats();
  }

  /**
   * Manually confirm a paid participant.
   *
   * Uses the same confirmation workflow as participant confirmation.
   * Official registration ID generation and notifications are handled
   * by Batch01ConfirmationService.
   */
  async confirmEnrollment(
    id: string,
    adminId: string,
  ) {
    this.validateParticipantId(id);

    const participant = await this.findParticipantById(id);

    if (
      participant.status !== 'paid' &&
      participant.status !== 'confirmed'
    ) {
      throw new ConflictException(
        'Only paid participants can be confirmed',
      );
    }

    const confirmedBy = String(adminId || '').trim();

    if (!confirmedBy) {
      throw new BadRequestException(
        'Admin identity is required',
      );
    }

    return this.confirmationService.confirmById(
      id,
      confirmedBy,
    );
  }

  /**
   * Resend payment receipt email.
   *
   * Payment receipt is generated as a PDF attachment.
   */
  async resendPaymentEmail(id: string) {
    const participant = await this.findParticipantById(id);

    if (!participant.email) {
      throw new ConflictException(
        'Participant email address is missing',
      );
    }

    if (
      participant.status !== 'paid' &&
      participant.status !== 'confirmed'
    ) {
      throw new ConflictException(
        'Payment receipt is available only for paid participants',
      );
    }

    await this.notificationService.sendPaymentReceipt(
      participant as any,
      true,
    );

    return {
      success: true,
      message: 'Payment receipt email sent successfully',
    };
  }

  /**
   * Resend enrollment confirmation email.
   *
   * This email includes the payment receipt PDF.
   */
  async resendEnrollmentEmail(id: string) {
    const participant = await this.findParticipantById(id);

    if (participant.status !== 'confirmed') {
      throw new ConflictException(
        'Enrollment email is available only for confirmed participants',
      );
    }

    if (!participant.email) {
      throw new ConflictException(
        'Participant email address is missing',
      );
    }

    await this.notificationService.sendEnrollmentConfirmation(
      participant as any,
      true,
    );

    return {
      success: true,
      message: 'Enrollment confirmation email sent successfully',
    };
  }

  /**
   * Resend confirmation SMS.
   */
  async resendSms(id: string) {
    const participant = await this.findParticipantById(id);

    if (participant.status !== 'confirmed') {
      throw new ConflictException(
        'SMS is available only for confirmed participants',
      );
    }

    if (!participant.whatsapp) {
      throw new ConflictException(
        'Participant mobile number is missing',
      );
    }

    await this.notificationService.resendById(
      participant.registrationId,
      'sms',
    );

    return {
      success: true,
      message: 'Confirmation SMS resend requested',
    };
  }
}
