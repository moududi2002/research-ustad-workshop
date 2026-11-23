// backend/src/course/batch-01/services/batch-01-confirmation.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { Collection, ObjectId } from 'mongodb';
import { createHash } from 'crypto';

import { Batch01DatabaseService } from '../database/batch-01-database.service';
import { Batch01NotificationService } from './batch-01-notification.service';
import { PaymentReceiptsService } from '../../../payment-receipts/payment-receipts.service';
import { BATCH_01_COURSE_ID } from '../config/batch-01.defaults';

interface Batch01Record {
  _id: ObjectId;
  registrationId: string;
  courseId: string;
  accessHash: string;
  fullName: string;
  email: string;
  whatsapp: string;
  status: 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
  amount: number;
  originalAmount: number;
  pricingType: string;
  invoiceNumber?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
  notifications: {
    email: 'pending' | 'sending' | 'sent' | 'failed';
    sms: 'pending' | 'sending' | 'sent' | 'failed';
  };
}

@Injectable()
export class Batch01ConfirmationService {
  private get registrations(): Collection<Batch01Record> {
    return this.databaseService
      .getDb()
      .collection<Batch01Record>('batch_01_registrations');
  }

  private get counters(): Collection<any> {
    return this.databaseService
      .getDb()
      .collection('batch_01_registration_counters');
  }

  constructor(
    private readonly databaseService: Batch01DatabaseService,
    private readonly notificationService: Batch01NotificationService,
    private readonly receiptService: PaymentReceiptsService,
  ) {}

  private hash(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex');
  }

  private async findAuthorized(
    accessToken?: string,
  ): Promise<Batch01Record> {
    if (
      !accessToken ||
      !/^[a-f0-9]{64}$/i.test(accessToken)
    ) {
      throw new UnauthorizedException(
        'Batch-01 registration session is missing or invalid',
      );
    }

    const registration = await this.registrations.findOne({
      courseId: BATCH_01_COURSE_ID,
      accessHash: this.hash(accessToken),
    });

    if (!registration) {
      throw new NotFoundException(
        'Batch-01 registration not found',
      );
    }

    return registration;
  }

  private async confirmRecord(
    registration: Batch01Record,
    confirmedBy: string,
  ) {
    if (registration.status !== 'paid' &&
        registration.status !== 'confirmed') {
      throw new ConflictException(
        'Payment must be verified before registration confirmation',
      );
    }

        if (registration.status === 'paid') {
      const session =
        this.databaseService.getClient().startSession();

      try {
        await session.withTransaction(
          async () => {
            // Always read the latest record inside the transaction.
            const current = await this.registrations.findOne(
              {
                _id: registration._id,
                courseId: BATCH_01_COURSE_ID,
              },
              { session },
            );

            if (!current) {
              throw new NotFoundException(
                'Registration not found',
              );
            }

            // Idempotent: never allocate another serial.
            if (current.status === 'confirmed') {
              return;
            }

            if (current.status !== 'paid') {
              throw new ConflictException(
                'Payment must be verified before registration confirmation',
              );
            }

            // Serial counter saved in MongoDB:
            // RU-RFC01-0001, RU-RFC01-0002, ...
            // If anything below fails, the increment rolls back,
            // so no serial number is ever skipped.
            const counter = await this.counters.findOneAndUpdate(
              { _id: 'RU-RFC01' },
              { $inc: { seq: 1 } },
              {
                upsert: true,
                returnDocument: 'after',
                session,
              },
            );

            if (!counter) {
              throw new ServiceUnavailableException(
                'Unable to generate official registration ID',
              );
            }

            const serial = String(counter.seq).padStart(4, '0');
            const officialId = `RU-RFC01-${serial}`;
            const now = new Date();

            const result = await this.registrations.updateOne(
              {
                _id: current._id,
                courseId: BATCH_01_COURSE_ID,
                status: 'paid',
              },
              {
                $set: {
                  registrationId: officialId,
                  status: 'confirmed',
                  confirmedAt: now,
                  confirmedBy,
                  updatedAt: now,
                },
              },
              { session },
            );

            if (result.modifiedCount !== 1) {
              throw new ConflictException(
                'Registration confirmation failed. Refresh and try again.',
              );
            }
          },
          {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary',
          },
        );
      } finally {
        await session.endSession();
      }
    }

    const confirmed = await this.registrations.findOne({
      _id: registration._id,
      courseId: BATCH_01_COURSE_ID,
      status: 'confirmed',
    });

    if (!confirmed) {
      throw new ServiceUnavailableException(
        'Unable to retrieve confirmed registration',
      );
    }

    // Email and SMS are dispatched only after confirmation.
    // Failed notifications can be retried without changing payment status.
    await this.notificationService.dispatchAll(confirmed);

    return this.safeRecord(
      await this.registrations.findOne({
        _id: registration._id,
      }),
    );
  }

  private safeRecord(record: any) {
    if (!record) {
      throw new NotFoundException('Registration not found');
    }

    const groupUrl = String(
      process.env.BATCH_01_WHATSAPP_GROUP_URL || '',
    ).trim();

    let whatsappGroupUrl: string | null = null;

    try {
      const url = new URL(groupUrl);

      if (
        url.protocol === 'https:' &&
        url.hostname === 'chat.whatsapp.com'
      ) {
        whatsappGroupUrl = url.toString();
      }
    } catch {
      whatsappGroupUrl = null;
    }

    return {
      registrationId: record.registrationId,
      courseId: record.courseId,
      fullName: record.fullName,
      email: record.email,
      whatsapp: record.whatsapp,
      status: record.status,
      amount: record.amount,
      originalAmount: record.originalAmount,
      pricingType: record.pricingType,
      invoiceNumber: record.invoiceNumber || null,
      transactionId: record.transactionId || null,
      paymentMethod: record.paymentMethod || null,
      paidAt: record.paidAt || null,
      confirmedAt: record.confirmedAt || null,
      notifications: record.notifications,
      whatsappGroupUrl,
    };
  }

  // Participant confirms their own verified payment.
  async confirmByAccessToken(
    accessToken: string | undefined,
    termsAccepted: boolean,
  ) {
    if (termsAccepted !== true) {
      throw new BadRequestException(
        'You must accept the Terms and Conditions before confirming enrollment',
      );
    }

    const registration =
      await this.findAuthorized(accessToken);

    return this.confirmRecord(
      registration,
      'participant',
    );
  }

  // Admin confirmation is also available for paid registrations.
  async confirmById(
    id: string,
    adminId: string,
  ) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Invalid participant ID',
      );
    }

    const registration = await this.registrations.findOne({
      _id: new ObjectId(id),
      courseId: BATCH_01_COURSE_ID,
    });

    if (!registration) {
      throw new NotFoundException(
        'Participant not found',
      );
    }

    return this.confirmRecord(
      registration,
      adminId,
    );
  }

  async generateParticipantReceipt(
    accessToken?: string,
  ) {
    const registration =
      await this.findAuthorized(accessToken);

    if (registration.status !== 'confirmed') {
      throw new ConflictException(
        'Payment receipt is available after enrollment confirmation',
      );
    }

    const buffer = await this.receiptService.generatePdf({
      ...registration,
      courseName: 'Research Foundation Course-2026',
      batchName: 'Batch-01',
    } as any);

    return {
      buffer,
      filename: `Research-Ustad-Receipt-${registration.registrationId}.pdf`,
    };
  }
}