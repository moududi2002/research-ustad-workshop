
// backend/src/course/batch-01/services/batch-01-registration.service.ts

import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  Collection,
  ObjectId,
} from 'mongodb';

import {
  Batch01DatabaseService,
} from '../database/batch-01-database.service';

import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';

import * as nodemailer from 'nodemailer';

import {
  BATCH_01_COURSE_ID,
} from '../config/batch-01.defaults';

import {
  Batch01RegistrationDto,
} from '../dto/batch-01-registration.dto';

import {
  Batch01SettingsService,
} from './batch-01-settings.service';

type Batch01RegistrationStatus =
  | 'draft'
  | 'initiating'
  | 'pending'
  | 'paid'
  | 'confirmed';

interface Batch01RegistrationRecord {
  _id: ObjectId;

  registrationId: string;

  courseId: string;

  accessHash: string;

  fullName: string;

  email: string;

  emailNormalized: string;

  whatsapp: string;

  academicStatus: string;

  universityName: string;

  department: string;

  researchLevel: string;

  higherStudyInterest: string;

  preferredCountry: string;

  registrationSource: string;

  consent: boolean;

  status: Batch01RegistrationStatus;

  amount: number;

  originalAmount: number;

  pricingType: 'early_bird' | 'regular';

  pricingSnapshotAt: Date;

  environment: 'sandbox' | 'live';

  invoiceNumber?: string;

  paymentUrl?: string;

  transactionId?: string;

  paymentMethod?: string;

  paidAt?: Date;

  confirmedAt?: Date;

  couponCode?: string;

  discountAmount?: number;

  prePaymentTermsAccepted?: boolean;

  refundPolicyAccepted?: boolean;

 notifications: {
  email: 'pending' | 'sending' | 'sent' | 'failed';
  sms: 'pending' | 'sending' | 'sent' | 'failed';

  resumeOtpHash?: string;

  resumeOtpExpiresAt?: Date;

  resumeOtpRequestedAt?: Date;

  resumeOtpAttempts?: number;
};

  createdAt: Date;

  updatedAt: Date;
}

@Injectable()
export class Batch01RegistrationService
  implements OnModuleInit
{


 private registrations!: Collection<Batch01RegistrationRecord>;

  constructor(
    private readonly settingsService: Batch01SettingsService,
    private readonly databaseService: Batch01DatabaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    const database = this.databaseService.getDb();

    this.registrations =
      database.collection<Batch01RegistrationRecord>(
        'batch_01_registrations',
      );

    // One email can register only once in Batch-01.
    await this.registrations.createIndex(
      {
        emailNormalized: 1,
      },
      {
        unique: true,
      },
    );

    // Temporary registration IDs must be unique.
    await this.registrations.createIndex(
      {
        registrationId: 1,
      },
      {
        unique: true,
      },
    );

    // Useful for Admin participant filtering.
    await this.registrations.createIndex({
      status: 1,
      createdAt: -1,
    });

    // Unique payment invoice lookup.
    await this.registrations.createIndex(
      {
        invoiceNumber: 1,
      },
      {
        unique: true,
        sparse: true,
      },
    );

    await this.registrations.createIndex(
      {
        transactionId: 1,
      },
      {
        unique: true,
        sparse: true,
      },
    );

    console.log(
      '[Batch-01] Registration collection initialized',
    );
  }





  // SHA-256 hash for registration access tokens.
  private hash(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex');
  }

  // Generate a unique temporary registration ID.
  private async generateRegistrationId(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const registrationId =
        `RFB01-${randomBytes(4)
          .toString('hex')
          .toUpperCase()}`;

      const existing =
        await this.registrations.findOne({
          registrationId,
        });

      if (!existing) {
        return registrationId;
      }
    }

    throw new ServiceUnavailableException(
      'Unable to generate registration ID',
    );
  }

  // Check registration availability before creating a record.
  private async ensureRegistrationOpen() {
    const settings =
      await this.settingsService.getSettings();

    const availability =
      this.settingsService.getRegistrationAvailability(
        settings,
      );

    if (!availability.isOpen) {
      throw new GoneException({
        success: false,
        code: 'REGISTRATION_CLOSED',
        message:
          'We are no longer taking registration. Please try for Batch-02.',
        closedReason: availability.closedReason,
        courseId: BATCH_01_COURSE_ID,
      });
    }

    return settings;
  }

  // Create a new Batch-01 registration.
  async register(
    dto: Batch01RegistrationDto,
  ) {
    if (dto.consent !== true) {
      throw new BadRequestException(
        'Consent is required to register',
      );
    }

    // Verify current registration status.
    const settings =
      await this.ensureRegistrationOpen();

    const email =
      dto.email.trim().toLowerCase();

    // Prevent duplicate registrations.
    const existing =
      await this.registrations.findOne({
        emailNormalized: email,
      });

    if (existing) {
      throw new ConflictException({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message:
          'This email is already registered for Batch-01.',
      });
    }

    // Generate a secure browser access token.
    const accessToken =
      randomBytes(32).toString('hex');

    const registrationId =
      await this.generateRegistrationId();

    const now = new Date();

    // Resolve the actual fee from backend settings.
    const pricing =
      this.settingsService.getCurrentPrice(
        settings,
        now,
      );

    const record: Batch01RegistrationRecord = {
      _id: new ObjectId(),

      registrationId,

      courseId: BATCH_01_COURSE_ID,

      accessHash: this.hash(accessToken),

      fullName: dto.fullName.trim(),

      email,

      emailNormalized: email,

      whatsapp: dto.whatsapp.trim(),

      academicStatus: dto.academicStatus,

      universityName:
        dto.universityName.trim(),

      department: dto.department?.trim() || '',

      researchLevel: dto.researchLevel,

      higherStudyInterest:
        dto.higherStudyInterest,

      preferredCountry:
        dto.preferredCountry?.trim() || '',

      registrationSource:
        dto.registrationSource.trim(),

      consent: true,

      status: 'draft',

      amount: pricing.basePrice,

      originalAmount: settings.regularFee,

      pricingType: pricing.pricingType,

      pricingSnapshotAt: now,

      environment:
        process.env.COURSE_PAYSTATION_ENV === 'live'
          ? 'live'
          : 'sandbox',

      discountAmount: 0,

      notifications: {
        email: 'pending',
        sms: 'pending',
      },

      createdAt: now,

      updatedAt: now,
    };

    try {
      await this.registrations.insertOne(record);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException({
          success: false,
          code: 'EMAIL_ALREADY_REGISTERED',
          message:
            'This email is already registered for Batch-01.',
        });
      }

      throw error;
    }

    return {
      success: true,

      registrationId,

      accessToken,

      courseId: BATCH_01_COURSE_ID,

      courseName: settings.courseName,

      batchName: settings.batchName,

      status: 'draft',

      pricing: {
        currency: settings.currency,
        amount: pricing.basePrice,
        originalAmount: settings.regularFee,
        pricingType: pricing.pricingType,
      },

      message:
        'Registration created successfully. Continue to checkout.',
    };
  }

  // Find a registration using its secure access token.
  private async authorized(
    accessToken?: string,
  ): Promise<Batch01RegistrationRecord> {
    if (
      !accessToken ||
      !/^[a-f0-9]{64}$/i.test(accessToken)
    ) {
      throw new UnauthorizedException(
        'Registration access token is missing or invalid',
      );
    }

    const registration =
      await this.registrations.findOne({
        accessHash: this.hash(accessToken),
      });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found',
      );
    }

    return registration;
  }

  // Return safe registration status without exposing accessHash.
  
  async getStatus(accessToken?: string) {
    const registration = await this.authorized(accessToken);

    const rawGroupUrl = String(
      process.env.BATCH_01_WHATSAPP_GROUP_URL || '',
    ).trim();

    let whatsappGroupUrl: string | null = null;

    try {
      const url = new URL(rawGroupUrl);

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
      registrationId: registration.registrationId,

      courseId: registration.courseId,

      fullName: registration.fullName,

      email: registration.email,

      whatsapp: registration.whatsapp,

      status: registration.status,

      amount: registration.amount,

      originalAmount: registration.originalAmount,

      pricingType: registration.pricingType,

      couponCode: registration.couponCode || null,

      discountAmount: registration.discountAmount || 0,

      invoiceNumber: registration.invoiceNumber || null,

      paymentUrl:
        registration.status === 'pending'
          ? registration.paymentUrl || null
          : null,

      transactionId: registration.transactionId || null,

      paymentMethod: registration.paymentMethod || null,

      paidAt: registration.paidAt || null,

      confirmedAt: registration.confirmedAt || null,

      notifications: registration.notifications,

      whatsappGroupUrl,
    };
    private normalizeResumeEmail(input: unknown): string {
    const email = String(input || '')
      .trim()
      .toLowerCase();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new BadRequestException(
        'Please enter a valid email address',
      );
    }

    return email;
  }

  /**
   * Generate secure OTP hash.
   */
  private makeResumeOtpHash(
    email: string,
    otp: string,
  ): string {
    const secret = process.env.COURSE_OTP_SECRET;

    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException(
        'Course OTP secret is not configured',
      );
    }

    return createHmac('sha256', secret)
      .update(`${email}:${otp}`)
      .digest('hex');
  }

  /**
   * Request resume registration OTP.
   */
  async requestResume(emailInput: unknown) {
    const email = this.normalizeResumeEmail(emailInput);

    // Same response whether email exists or not.
    const publicResponse = {
      success: true,
      message:
        'If a registration exists for this email, a verification code has been sent.',
    };

    const registration = await this.registrations.findOne({
      courseId: BATCH_01_COURSE_ID,
      emailNormalized: email,
    });

    if (!registration) {
      return publicResponse;
    }

    const now = new Date();

    const otp = String(
      randomInt(0, 1000000),
    ).padStart(6, '0');

    const otpHash = this.makeResumeOtpHash(
      email,
      otp,
    );

    // Enforce 60-second cooldown atomically.
    const claimed = await this.registrations.updateOne(
      {
        _id: registration._id,

        $or: [
          {
            resumeOtpRequestedAt: {
              $exists: false,
            },
          },
          {
            resumeOtpRequestedAt: {
              $lt: new Date(now.getTime() - 60_000),
            },
          },
        ],
      },
      {
        $set: {
          resumeOtpHash: otpHash,

          resumeOtpRequestedAt: now,

          resumeOtpExpiresAt: new Date(
            now.getTime() + 10 * 60_000,
          ),

          resumeOtpAttempts: 0,

          updatedAt: now,
        },
      },
    );

    if (claimed.modifiedCount !== 1) {
      return publicResponse;
    }

    try {
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const port = Number(
        process.env.SMTP_PORT || 587,
      );

      if (!host || !user || !pass) {
        throw new Error(
          'SMTP configuration is missing',
        );
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"Research Ustad" <${user}>`,

        to: email,

        subject:
          'Resume Your Research Foundation Course Registration',

        text:
          `Your verification code is: ${otp}\n\n` +
          'This code expires in 10 minutes.\n' +
          'If you did not request this code, ignore this email.',

        html: `
          <div style="max-width:560px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#17213b">
            <h2 style="color:#3A5A78">Research Ustad</h2>

            <h3>Resume Your Registration</h3>

            <p>
              We received a request to resume your
              Research Foundation Course-2026, Batch-01 registration.
            </p>

            <p>Your verification code is:</p>

            <div style="padding:20px;background:#F5F8FB;border-radius:12px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#3A5A78">
              ${otp}
            </div>

            <p>
              This code expires in <strong>10 minutes</strong>.
            </p>

            <p>
              If you did not request this code, you can ignore this email.
            </p>

            <p>Research Ustad Team</p>
          </div>
        `,
      });

      return publicResponse;
    } catch (error) {
      console.error(
        '[Batch-01 Resume OTP]',
        error instanceof Error
          ? error.message
          : 'Email delivery failed',
      );

      // Clear the failed OTP so a new request can be made.
      await this.registrations.updateOne(
        {
          _id: registration._id,
          resumeOtpHash: otpHash,
        },
        {
          $unset: {
            resumeOtpHash: '',
            resumeOtpRequestedAt: '',
            resumeOtpExpiresAt: '',
            resumeOtpAttempts: '',
          },
        },
      );

      throw new ServiceUnavailableException(
        'Verification email service is temporarily unavailable',
      );
    }
  }

  /**
   * Verify resume OTP and issue a new access token.
   */
  async verifyResume(
    emailInput: unknown,
    codeInput: unknown,
  ) {
    const email = this.normalizeResumeEmail(emailInput);

    const code = String(codeInput || '').trim();

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException(
        'Enter the six-digit verification code',
      );
    }

    const now = new Date();

    // Increment attempts atomically.
    const attempted = await this.registrations.findOneAndUpdate(
      {
        courseId: BATCH_01_COURSE_ID,

        emailNormalized: email,

        resumeOtpHash: {
          $exists: true,
        },

        resumeOtpExpiresAt: {
          $gt: now,
        },

        resumeOtpAttempts: {
          $lt: 5,
        },
      },
      {
        $inc: {
          resumeOtpAttempts: 1,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (
      !attempted ||
      !attempted.resumeOtpHash
    ) {
      throw new BadRequestException(
        'Invalid or expired verification code. Request a new code.',
      );
    }

    const suppliedHash = this.makeResumeOtpHash(
      email,
      code,
    );

    const expectedBuffer = Buffer.from(
      attempted.resumeOtpHash,
      'hex',
    );

    const suppliedBuffer = Buffer.from(
      suppliedHash,
      'hex',
    );

    const isValid =
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(
        expectedBuffer,
        suppliedBuffer,
      );

    if (!isValid) {
      throw new BadRequestException(
        'Incorrect verification code',
      );
    }

    // Generate a new registration access token.
    const accessToken = randomBytes(32).toString('hex');

    const updated = await this.registrations.findOneAndUpdate(
      {
        _id: attempted._id,

        resumeOtpHash: suppliedHash,

        resumeOtpExpiresAt: {
          $gt: new Date(),
        },

        resumeOtpAttempts: {
          $lte: 5,
        },
      },
      {
        $set: {
          accessHash: this.hash(accessToken),
          updatedAt: new Date(),
        },

        $unset: {
          resumeOtpHash: '',
          resumeOtpExpiresAt: '',
          resumeOtpRequestedAt: '',
          resumeOtpAttempts: '',
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (!updated) {
      throw new BadRequestException(
        'This verification code was already used or has expired',
      );
    }

    return {
      success: true,

      accessToken,

      registrationId: updated.registrationId,

      status: updated.status,

      message:
        'Registration access restored successfully',
    };
  }
  }
}
