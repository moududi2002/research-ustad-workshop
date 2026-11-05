// backend/src/course/course.service.ts

import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { MongoClient, Collection, ObjectId } from 'mongodb';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';
import * as nodemailer from 'nodemailer';
import { CourseRegistrationDto } from './dto/course-registration.dto';

import { CourseAdminGateway } from './course-admin.gateway';

const COURSE_ID = 'research-article-writing-01';
const COURSE_SLUG =
  'research-article-writing-academic-publishing-guidelines';

const COURSE_FEE = 3000;
const ORIGINAL_FEE = 5000;

type CourseStatus =
  | 'draft'
  | 'initiating'
  | 'pending'
  | 'paid'
  | 'confirmed';

type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed';

interface RegistrationCounter {
  _id: string;
  seq: number;
}

interface CourseRecord {
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
  status: CourseStatus;
  amount: number;
  originalAmount: number;
  environment: 'sandbox' | 'live';
  invoiceNumber?: string;
  paymentUrl?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  termsAcceptedAt?: Date;

  prePaymentTermsAccepted?: boolean;
  refundPolicyAccepted?: boolean;
  prePaymentAcceptedAt?: Date;
  prePaymentPolicyVersion?: string;

  confirmedAt?: Date;
  notifications: {
    email: DeliveryStatus;
    sms: DeliveryStatus;
  };
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  resumeOtpHash?: string;

  resumeOtpExpiresAt?: Date;
  resumeOtpRequestedAt?: Date;
  resumeOtpAttempts?: number;

  couponCode?: string;
  discountAmount?: number;

  deviceInfo?: {
    type: string;
    browser: string;
    os: string;
    network: string;
    userAgent: string;
  };

}

type CouponType = 'final_price' | 'percentage' | 'fixed';

interface CourseCoupon {
  _id: ObjectId;
  courseId: string;
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  allowedEmail: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class CourseService implements OnModuleInit, OnModuleDestroy {
  constructor(
  private readonly courseRealtime: CourseAdminGateway,
  ) {}
  private mongo: MongoClient;
  private records: Collection<CourseRecord>;
  private coupons: Collection<CourseCoupon>;
  private counters: Collection<RegistrationCounter>;

  private environment(): 'sandbox' | 'live' {
    return process.env.COURSE_PAYSTATION_ENV === 'live'
      ? 'live'
      : 'sandbox';
  }

  private gatewayBase(): string {
    return this.environment() === 'live'
      ? 'https://api.paystation.com.bd'
      : 'https://sandbox.paystation.com.bd';
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private async generateTemporaryRegistrationId(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (let attempt = 0; attempt < 10; attempt++) {
      const temporaryId = Array.from(
        { length: 8 },
        () => alphabet[randomInt(alphabet.length)],
      ).join('');

      const existing = await this.records.findOne({
        registrationId: temporaryId,
      });

      if (!existing) {
        return temporaryId;
      }
    }

    throw new ServiceUnavailableException(
      'Unable to generate a temporary registration ID',
    );
  }


  private describeRegistrationDevice(input?: {
    userAgent?: string;
    network?: string;
  }): NonNullable<CourseRecord['deviceInfo']> {
    const ua = String(input?.userAgent || '').slice(0, 512);

    const rawNetwork = String(
      input?.network || '',
    ).trim().slice(0, 64);

    let network = 'Unavailable';

    // Mask IPv4 addresses before storing.
    const ipv4 = rawNetwork.split('.');

    if (
      ipv4.length === 4 &&
      ipv4.every(
        (part) =>
          /^\d{1,3}$/.test(part) &&
          Number(part) <= 255,
      )
    ) {
      network = `${ipv4.slice(0, 3).join('.')}.xxx`;
    } else if (
      rawNetwork.includes(':') &&
      /^[0-9a-f:.]+$/i.test(rawNetwork)
    ) {
      // Mask IPv6 network address.
      network = `${rawNetwork.split(':').slice(0, 3).join(':')}:…`;
    }

    // Browser detection.
    const browser =
      /Edg\//.test(ua)
        ? 'Microsoft Edge'
        : /OPR\//.test(ua)
        ? 'Opera'
        : /SamsungBrowser\//.test(ua)
        ? 'Samsung Internet'
        : /CriOS\//.test(ua)
        ? 'Chrome iOS'
        : /FxiOS\//.test(ua)
        ? 'Firefox iOS'
        : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
        ? 'Safari'
        : 'Unknown';

    // Operating system detection.
    const os =
      /Windows NT/.test(ua)
        ? 'Windows'
        : /iPad|iPhone|iPod/.test(ua)
        ? 'iOS / iPadOS'
        : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(ua)
        ? 'macOS'
        : /Linux/.test(ua)
        ? 'Linux'
        : 'Unknown';

    // Device category.
    const type =
      /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)
        ? 'Tablet'
        : /Mobile|iPhone|iPod/i.test(ua)
        ? 'Mobile'
        : ua
        ? 'Desktop'
        : 'Unknown';

    return {
      type,
      browser,
      os,
      network,
      userAgent: ua || 'Unavailable',
    };
  }

  private paymentCredentials() {
    const id = process.env.COURSE_PAYSTATION_MERCHANT_ID;
    const password = process.env.COURSE_PAYSTATION_PASSWORD;

    if (!id || !password) {
      throw new ServiceUnavailableException(
        'PayStation merchant credentials are missing',
      );
    }

    return { id, password };
  }

  async onModuleInit() {
    const uri = process.env.COURSE_MONGODB_URI;

    if (!uri) {
      throw new Error('COURSE_MONGODB_URI is missing');
    }

    this.mongo = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    await this.mongo.connect();

    const database = this.mongo.db(
      process.env.COURSE_MONGODB_DATABASE ||
        'research_ustad_courses',
    );

    this.records = database.collection<CourseRecord>(
      'course_registrations',
    );

    this.counters = database.collection<RegistrationCounter>(
      'course_registration_counters',
    );

    this.coupons = database.collection<CourseCoupon>(
      'course_coupons',
    );

    await this.coupons.createIndex(
      { courseId: 1, code: 1 },
      { unique: true },
    );

    await this.records.createIndex(
      { registrationId: 1 },
      { unique: true },
    );

    await this.records.createIndex(
      { courseId: 1, emailNormalized: 1 },
      { unique: true },
    );

    await this.records.createIndex(
      { invoiceNumber: 1 },
      { unique: true, sparse: true },
    );

    await this.records.createIndex(
      { transactionId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          transactionId: { $type: 'string' },
        },
      },
    );

    await this.records.createIndex({
      courseId: 1,
      createdAt: -1,
    });

    console.log('Course MongoDB collection ready');
  }

  async onModuleDestroy() {
    if (this.mongo) await this.mongo.close();
  }

  private normalizeCouponCode(value: unknown): string {
    const code = String(value || '').trim().toUpperCase();

    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
      throw new BadRequestException(
        'Coupon must be 4–32 letters, numbers, hyphens or underscores',
      );
    }

    return code;
  }

  private calculateCouponPrice(coupon: CourseCoupon): number {
    if (coupon.type === 'final_price') {
      return coupon.value;
    }

    if (coupon.type === 'percentage') {
      return Math.max(
        1,
        Math.round(COURSE_FEE * (100 - coupon.value) / 100),
      );
    }

    return Math.max(1, COURSE_FEE - coupon.value);
  }

  private validateCouponForRegistration(
    coupon: CourseCoupon | null,
    email: string,
  ): asserts coupon is CourseCoupon {
    if (
      !coupon ||
      !coupon.active ||
      (coupon.expiresAt && coupon.expiresAt <= new Date())
    ) {
      throw new BadRequestException(
        'Coupon is invalid, inactive or expired',
      );
    }

    if (
      coupon.allowedEmail &&
      coupon.allowedEmail !== email.toLowerCase()
    ) {
      throw new BadRequestException(
        'This coupon is not available for this registration',
      );
    }
  }

  async createCoupon(input: {
    code?: string;
    type?: CouponType;
    value?: number;
    allowedEmail?: string;
    expiresAt?: string;
  }) {
    const code = this.normalizeCouponCode(input?.code);
    const type = input?.type;
    const value = Number(input?.value);

    if (
      !type ||
      !['final_price', 'percentage', 'fixed'].includes(type)
    ) {
      throw new BadRequestException('Invalid discount type');
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(
        'Discount value must be a positive whole number',
      );
    }

    if (type === 'percentage' && value > 99) {
      throw new BadRequestException(
        'Percentage must be between 1 and 99',
      );
    }

    if (type !== 'percentage' && value >= COURSE_FEE) {
      throw new BadRequestException(
        'Amount must be below the regular course fee',
      );
    }

    const allowedEmail = String(
      input?.allowedEmail || '',
    ).trim().toLowerCase();

    if (
      allowedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allowedEmail)
    ) {
      throw new BadRequestException('Invalid allowed email');
    }

    const expiresAt = input?.expiresAt
      ? new Date(input.expiresAt)
      : null;

    if (
      expiresAt &&
      (
        Number.isNaN(expiresAt.getTime()) ||
        expiresAt <= new Date()
      )
    ) {
      throw new BadRequestException(
        'Expiry date must be in the future',
      );
    }

    const coupon: CourseCoupon = {
      _id: new ObjectId(),
      courseId: COURSE_ID,
      code,
      type,
      value,
      active: true,
      allowedEmail: allowedEmail || null,
      expiresAt,
      createdAt: new Date(),
    };

    try {
      await this.coupons.insertOne(coupon);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'A coupon with this code already exists',
        );
      }

      throw error;
    }

    return {
      ...coupon,
      finalPrice: this.calculateCouponPrice(coupon),
    };
  }

  async listCoupons() {
    const coupons = await this.coupons
      .find({ courseId: COURSE_ID })
      .sort({ createdAt: -1 })
      .toArray();

    return coupons.map((coupon) => ({
      ...coupon,
      finalPrice: this.calculateCouponPrice(coupon),
    }));
  }

  async deactivateCoupon(codeInput: unknown) {
    const code = this.normalizeCouponCode(codeInput);

    const result = await this.coupons.updateOne(
      { courseId: COURSE_ID, code },
      { $set: { active: false } },
    );

    if (!result.matchedCount) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      success: true,
      code,
      active: false,
    };
  }

  async applyCoupon(
    accessToken: string | undefined,
    codeInput: unknown,
  ) {
    const registration = await this.authorized(accessToken);

    if (registration.status !== 'draft') {
      throw new ConflictException(
        'Coupon changes are only allowed before payment starts',
      );
    }

    const code = this.normalizeCouponCode(codeInput);

    const coupon = await this.coupons.findOne({
      courseId: COURSE_ID,
      code,
    });

    this.validateCouponForRegistration(
      coupon,
      registration.emailNormalized,
    );

    const finalPrice = this.calculateCouponPrice(coupon);

    const updated = await this.records.findOneAndUpdate(
      {
        _id: registration._id,
        status: 'draft',
      },
      {
        $set: {
          couponCode: code,
          amount: finalPrice,
          discountAmount: COURSE_FEE - finalPrice,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      throw new ConflictException(
        'Payment already started; coupon cannot be changed',
      );
    }

    this.courseRealtime.notifyChange();
    return this.safeRecord(updated);
  }

  async removeCoupon(accessToken?: string) {
    const registration = await this.authorized(accessToken);

    const updated = await this.records.findOneAndUpdate(
      {
        _id: registration._id,
        status: 'draft',
      },
      {
        $set: {
          amount: COURSE_FEE,
          discountAmount: 0,
          updatedAt: new Date(),
        },
        $unset: {
          couponCode: '',
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      throw new ConflictException(
        'Coupon cannot be removed after payment initiation',
      );
    }

    this.courseRealtime.notifyChange();
    return this.safeRecord(updated);
  }


  async register(
    dto: CourseRegistrationDto,
    device?: {
      userAgent?: string;
      network?: string;
    },
  ) {
    if (dto.consent !== true) {
      throw new BadRequestException(
        'Consent is required to create a registration',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const emailNormalized = email;

    const existing = await this.records.findOne({
      courseId: COURSE_ID,
      emailNormalized,
    });

    if (existing) {
      throw new ConflictException(
        'This email already has Batch 01 registration. Use your original browser session to resume.',
      );
    }

    const accessToken = randomBytes(32).toString('hex');

    // Temporary ID only.
    // Official registration serial will be assigned after verified payment.
    const registrationId =
    await this.generateTemporaryRegistrationId();

    const now = new Date();

    const record: CourseRecord = {
      _id: new ObjectId(),
      registrationId,
      courseId: COURSE_ID,
      accessHash: this.hash(accessToken),
      fullName: dto.fullName.trim(),
      email,
      emailNormalized,
      whatsapp: dto.whatsapp.trim(),
      academicStatus: dto.academicStatus,
      universityName: dto.universityName.trim(),
      department: dto.department || '',
      researchLevel: dto.researchLevel,
      higherStudyInterest: dto.higherStudyInterest,
      preferredCountry: dto.preferredCountry || '',
      registrationSource: dto.registrationSource,
      consent: true,
      status: 'draft',
      amount: COURSE_FEE,
      originalAmount: ORIGINAL_FEE,
      deviceInfo: this.describeRegistrationDevice(device),
      environment: this.environment(),
      notifications: {
        email: 'pending',
        sms: 'pending',
      },
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.records.insertOne(record);
      this.courseRealtime.notifyChange();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'This email already has a registration',
        );
      }

      throw error;
    }

    return {
      registrationId,
      accessToken,
      status: 'draft',
    };
  }

  async adminParticipants(params: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  }) {
    const page = Math.min(
      100000,
      Math.max(
        1,
        Number.parseInt(String(params.page || '1'), 10) || 1,
      ),
    );

    const limit = Math.min(
      20,
      Math.max(
        1,
        Number.parseInt(String(params.limit || '20'), 10) || 20,
      ),
    );

    const search = String(
      params.search || '',
    ).trim().slice(0, 80);

    const status = String(params.status || 'all');

    const validStatuses = [
      'all',
      'draft',
      'initiating',
      'pending',
      'paid',
      'confirmed',
    ];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        'Invalid participant status filter',
      );
    }

    const filter: any = {
      courseId: COURSE_ID,
    };

    if (status !== 'all') {
      filter.status = status;
    }

    // Escape regex characters to make search safe.
    if (search) {
      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      filter.$or = [
        {
          registrationId: {
            $regex: escaped,
            $options: 'i',
          },
        },
        {
          fullName: {
            $regex: escaped,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: escaped,
            $options: 'i',
          },
        },
        {
          whatsapp: {
            $regex: escaped,
            $options: 'i',
          },
        },
        {
          universityName: {
            $regex: escaped,
            $options: 'i',
          },
        },
        {
          invoiceNumber: {
            $regex: escaped,
            $options: 'i',
          },
        },
      ];
    }

    const [records, total, summary] =
      await Promise.all([
        this.records
          .find(filter, {
            projection: {
              _id: 1,
              registrationId: 1,
              fullName: 1,
              email: 1,
              whatsapp: 1,
              academicStatus: 1,
              universityName: 1,
              department: 1,
              researchLevel: 1,
              higherStudyInterest: 1,
              preferredCountry: 1,
              registrationSource: 1,
              status: 1,
              amount: 1,
              originalAmount: 1,
              couponCode: 1,
              discountAmount: 1,
              environment: 1,
              invoiceNumber: 1,
              transactionId: 1,
              paymentMethod: 1,
              paidAt: 1,
              confirmedAt: 1,
              createdAt: 1,
              updatedAt: 1,
              notifications: 1,
              deviceInfo: 1,
            },
          })
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),

        this.records.countDocuments(filter),

        this.records
          .aggregate([
            {
              $match: {
                courseId: COURSE_ID,
              },
            },
            {
              $group: {
                _id: null,

                total: {
                  $sum: 1,
                },

                awaitingPayment: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          '$status',
                          ['pending', 'initiating'],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                paid: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          '$status',
                          ['paid', 'confirmed'],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                confirmed: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ['$status', 'confirmed'],
                      },
                      1,
                      0,
                    ],
                  },
                },

                revenue: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          '$status',
                          ['paid', 'confirmed'],
                        ],
                      },
                      '$amount',
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .next(),
      ]);

    return {
      page,
      pageSize: limit,
      total,

      overview: summary || {
        total: 0,
        awaitingPayment: 0,
        paid: 0,
        confirmed: 0,
        revenue: 0,
      },

      rows: records.map((r) => ({
        id: r._id.toHexString(),
        registrationId: r.registrationId,
        fullName: r.fullName,
        email: r.email,
        whatsapp: r.whatsapp,
        academicStatus: r.academicStatus,
        universityName: r.universityName,
        department: r.department,
        researchLevel: r.researchLevel,
        higherStudyInterest: r.higherStudyInterest,
        preferredCountry: r.preferredCountry,
        registrationSource: r.registrationSource,
        status: r.status,
        amount: r.amount,
        originalAmount: r.originalAmount,
        couponCode: r.couponCode || null,
        discountAmount: r.discountAmount || 0,
        environment: r.environment,
        invoiceNumber: r.invoiceNumber || null,
        transactionId: r.transactionId || null,
        paymentMethod: r.paymentMethod || null,
        paidAt: r.paidAt || null,
        confirmedAt: r.confirmedAt || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        notifications: r.notifications,
        deviceInfo: r.deviceInfo || null,
      })),
    };
  }

  private async authorized(accessToken?: string) {
    if (
      !accessToken ||
      typeof accessToken !== 'string' ||
      !/^[a-f0-9]{64}$/.test(accessToken)
    ) {
      throw new UnauthorizedException('Course session required');
    }

    const registration = await this.records.findOne({
      courseId: COURSE_ID,
      accessHash: this.hash(accessToken),
    });

    if (!registration) {
      throw new UnauthorizedException('Invalid course session');
    }

    return registration;
  }

  private safeRecord(r: CourseRecord) {
    return {
      registrationId: r.registrationId,
        ...(r.status === 'draft'
      ? {
          fullName: r.fullName,
          email: r.email,
          whatsapp: r.whatsapp,
          academicStatus: r.academicStatus,
          universityName: r.universityName,
          department: r.department,
          researchLevel: r.researchLevel,
          higherStudyInterest: r.higherStudyInterest,
          preferredCountry: r.preferredCountry,
          registrationSource: r.registrationSource,
        }
      : {}),
      status: r.status,
      amount: r.amount,
      originalAmount: r.originalAmount,
      invoiceNumber: r.invoiceNumber || null,
      paymentUrl: r.status === 'pending'
        ? r.paymentUrl || null
        : null,
      transactionId: r.status === 'paid' ||
        r.status === 'confirmed'
        ? r.transactionId || null
        : null,
      paymentMethod: r.paymentMethod || null,
      paidAt: r.paidAt || null,
      confirmedAt: r.confirmedAt || null,
      notifications: r.notifications,
      whatsappGroupUrl: r.status === 'confirmed'
        ? this.getWhatsappGroupUrl()
        : null,

      baseAmount: COURSE_FEE,
      couponCode: r.couponCode || null,
      discountAmount: r.discountAmount || 0,
      
    };
  }

  private getWhatsappGroupUrl(): string | null {
    const url = process.env.COURSE_WHATSAPP_GROUP_URL || '';

    if (/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(url)) {
      return url;
    }

    return null;
  }


  async status(accessToken?: string) {
    let registration = await this.authorized(accessToken);

    if (
      (registration.status === 'pending' ||
        registration.status === 'initiating') &&
      registration.invoiceNumber
    ) {
      const lastAttempt = new Date(
        registration.lastVerifiedAt || 0,
      ).getTime();

      if (Date.now() - lastAttempt > 8000) {
        try {
          await this.verifyRegistration(registration);
          registration = await this.authorized(accessToken);
        } catch (error) {
          console.error('[Course Payment] Status check failed', {
            invoice: registration.invoiceNumber,
            message: error instanceof Error
              ? error.message
              : 'Unknown verification error',
          });
        }
      }
    }

    return this.safeRecord(registration);
  }

  private async gatewayRequest(
    endpoint: string,
    body: URLSearchParams,
    extraHeaders: Record<string, string> = {},
  ): Promise<any> {
    const response = await fetch(
      `${this.gatewayBase()}${endpoint}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          ...extraHeaders,
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
        redirect: 'manual',
      },
    );

    if (!response.ok) {
      throw new BadGatewayException(
        `PayStation HTTP ${response.status}`,
      );
    }

    return response.json();
  }

  private validCheckoutUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false;

    try {
      const u = new URL(value);
      const expected = new URL(this.gatewayBase());

      return (
        u.protocol === 'https:' &&
        u.hostname === expected.hostname &&
        u.pathname.startsWith('/checkout/')
      );
    } catch {
      return false;
    }
  }

  async initiate(
    accessToken?: string,
    termsAccepted?: boolean,
    refundPolicyAccepted?: boolean,
  ) {
    const registration = await this.authorized(accessToken);

    if (
      registration.status === 'paid' ||
      registration.status === 'confirmed'
    ) {
      throw new BadRequestException(
        'This registration has already been paid',
      );
    }


    if (termsAccepted !== true || refundPolicyAccepted !== true) {
      throw new BadRequestException(
        'You must accept the Terms & Conditions and Return & Refund Policy before payment.',
      );
    }

    const acceptedAt = new Date();

    const acceptanceSaved = await this.records.updateOne(
      {
        _id: registration._id,
        status: 'draft',
      },
      {
        $set: {
          prePaymentTermsAccepted: true,
          refundPolicyAccepted: true,
          prePaymentAcceptedAt: acceptedAt,
          prePaymentPolicyVersion: '2026-11-05',
          updatedAt: acceptedAt,
        },
      },
    );

    if (acceptanceSaved.modifiedCount !== 1) {
      throw new ConflictException(
        'Unable to save policy acceptance. Please refresh and try again.',
      );
    }

    if (
      registration.status === 'pending' &&
      registration.paymentUrl
    ) {
      return {
        invoiceNumber: registration.invoiceNumber,
        paymentUrl: registration.paymentUrl,
      };
    }

    if (registration.status !== 'draft') {
      throw new ConflictException(
        'Payment initiation is already in progress',
      );
    }

    if (registration.couponCode) {
      const coupon = await this.coupons.findOne({
        courseId: COURSE_ID,
        code: registration.couponCode,
      });

      this.validateCouponForRegistration(
        coupon,
        registration.emailNormalized,
      );

      if (
        this.calculateCouponPrice(coupon) !== registration.amount
      ) {
        throw new ConflictException(
          'Coupon price has changed. Remove and reapply the coupon.',
        );
      }
    }

    const invoiceNumber =
    `${Date.now()}${randomBytes(6).readUIntBE(0, 6) % 1000000}`
        .replace(/(\d{13})(\d{1,6})$/, (_, a, b) =>
        a + b.padStart(6, '0'),
    );


    const locked = await this.records.updateOne(
      {
        _id: registration._id,
        status: 'draft',
        amount: registration.amount,
      },
      {
        $set: {
          status: 'initiating',
          invoiceNumber,
          updatedAt: new Date(),
        },
      },
    );

    if (!locked.modifiedCount) {
      throw new ConflictException('Payment already started');
    }

    this.courseRealtime.notifyChange();

    try {
      const { id, password } = this.paymentCredentials();

      const publicBackend = (
        process.env.COURSE_BACKEND_PUBLIC_URL || ''
      ).replace(/\/$/, '');

      if (!publicBackend.startsWith('https://')) {
        throw new ServiceUnavailableException(
          'Valid public HTTPS backend URL is required',
        );
      }

      const body = new URLSearchParams({
        merchantId: id,
        password,
        invoice_number: invoiceNumber,
        currency: 'BDT',
        payment_amount: String(registration.amount),
        pay_with_charge: '1',
        reference: COURSE_ID,
        checkout_items: 'Batch 01 - Research Publishing Guidelines',
        cust_name: registration.fullName,
        cust_email: registration.email,
        cust_phone: registration.whatsapp,
        callback_url: `${publicBackend}/api/course/callback`,
      });

      const result = await this.gatewayRequest(
        '/initiate-payment',
        body,
      );



    if (
        String(result.status_code) !== '200' ||
        String(result.status).toLowerCase() !== 'success' ||
        String(result.invoice_number) !== invoiceNumber ||
        !this.validCheckoutUrl(result.payment_url)
    ) {
        // Explicit rejection: allow retry with a new invoice.
        // Unknown network outcomes are handled separately.
        const resetResult = await this.records.updateOne(
          {
            _id: registration._id,
            status: 'initiating',
          },
          {
            $set: {
              status: 'draft',
              updatedAt: new Date(),
            },
            $unset: {
              invoiceNumber: '',
            },
          },
        );

        if (resetResult.modifiedCount === 1) {
          this.courseRealtime.notifyChange();
        }
        

        throw new BadGatewayException(
            'PayStation rejected payment initiation. Please try again.',
        );
        }


        const pendingUpdate = await this.records.updateOne(
          {
            _id: registration._id,
            status: 'initiating',
          },
          {
            $set: {
              status: 'pending',
              paymentUrl: result.payment_url,
              updatedAt: new Date(),
            },
          },
        );

        if (pendingUpdate.modifiedCount === 1) {
          this.courseRealtime.notifyChange();
        }

      return {
        invoiceNumber,
        paymentUrl: result.payment_url,
      };
    
    } catch (error) {
      // Keep invoice for reconciliation if gateway
      // created payment but its response was interrupted.

      const recoveryResult = await this.records.updateOne(
        {
          _id: registration._id,
          status: 'initiating',
        },
        {
          $set: {
            status: 'pending',
            updatedAt: new Date(),
          },
        },
      );

      if (recoveryResult.modifiedCount === 1) {
        this.courseRealtime.notifyChange();
      }

      throw error;
    }

  }


  private async verifyRegistration(registration: CourseRecord) {
    if (
      registration.status === 'paid' ||
      registration.status === 'confirmed'
    ) {
      return;
    }

    if (!registration.invoiceNumber) {
      return;
    }

    if (registration.environment !== this.environment()) {
      throw new ServiceUnavailableException(
        'Payment environment mismatch. Check PayStation configuration.',
      );
    }

    await this.records.updateOne(
      { _id: registration._id },
      {
        $set: {
          lastVerifiedAt: new Date(),
        },
      },
    );

    const merchant = this.paymentCredentials();

    const result = await this.gatewayRequest(
      '/transaction-status',
      new URLSearchParams({
        invoice_number: registration.invoiceNumber,
      }),
      {
        merchantId: merchant.id,
      },
    );

    if (
      String(result.status_code) !== '200' ||
      String(result.status).trim().toLowerCase() !== 'success'
    ) {
      console.warn('[Course Payment] Gateway lookup not successful', {
        invoice: registration.invoiceNumber,
        statusCode: result.status_code,
        status: result.status,
        message: result.message,
      });

      return;
    }

    const data = result.data || {};

    const gatewayStatus = String(
      data.trx_status || '',
    ).trim().toLowerCase();

    if (!['success', 'successful'].includes(gatewayStatus)) {
      console.info('[Course Payment] Not paid yet', {
        invoice: registration.invoiceNumber,
        gatewayStatus,
      });

      return;
    }

    const expectedAmount = registration.amount;
    const receivedAmount = Number(data.payment_amount);

    const hasRequestedAmount =
      data.request_amount !== undefined &&
      data.request_amount !== null &&
      data.request_amount !== '';

    const requestedAmount = hasRequestedAmount
      ? Number(data.request_amount)
      : null;

    // The order amount must match if the gateway provides it.
    // Customer-paid gateway fees may increase the collected total.
    const amountValid =
      Number.isFinite(receivedAmount) &&
      receivedAmount >= expectedAmount &&
      (
        requestedAmount === null ||
        requestedAmount === expectedAmount
      );

    const invoiceValid =
      String(data.invoice_number) === registration.invoiceNumber;

    const transactionId = String(data.trx_id || '').trim();

    const transactionValid =
      transactionId.length > 0 &&
      transactionId !== '****';

    const referenceValid =
      !data.reference ||
      String(data.reference) === COURSE_ID;

    if (
      !invoiceValid ||
      !amountValid ||
      !transactionValid ||
      !referenceValid
    ) {
      console.error('[Course Payment] Verification mismatch', {
        invoice: registration.invoiceNumber,
        expectedAmount,
        receivedAmount,
        requestedAmount,
        invoiceValid,
        amountValid,
        transactionValid,
        referenceValid,
        gatewayStatus,
      });

      throw new BadGatewayException(
        'PayStation payment details do not match this registration',
      );
    }

    if (
      registration.transactionId &&
      registration.transactionId !== transactionId
    ) {
      throw new ConflictException(
        'Payment transaction ID mismatch',
      );
    }

    try {
      const updated = await this.records.updateOne(
        {
          _id: registration._id,
          invoiceNumber: registration.invoiceNumber,
          status: { $in: ['pending', 'initiating'] },
        },
        {
          $set: {
            status: 'paid',
            transactionId,
            paymentMethod: String(data.payment_method || ''),
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );


      if (updated.modifiedCount === 1) {
        this.courseRealtime.notifyChange();
        console.info('[Course Payment] Successfully verified', {
          invoice: registration.invoiceNumber,
          courseAmount: expectedAmount,
          gatewayAmount: receivedAmount,
        });
      }
    
    
  } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'This transaction is already associated with another registration',
        );
      }

      throw error;
    }
  }

  async verify(accessToken?: string) {
    const registration = await this.authorized(accessToken);

    await this.verifyRegistration(registration);

    const latest = await this.authorized(accessToken);
    return this.safeRecord(latest);
  }

  async handleIpn(payload: any) {
    const invoice = String(payload?.invoice_number || '');
    const trxId = String(payload?.trx_id || '');

    if (
      !/^[A-Za-z0-9_-]{10,100}$/.test(invoice) ||
      !trxId ||
      !['success', 'successful'].includes(
        String(payload?.trx_status || '').trim().toLowerCase()
      )
    ) {
      throw new BadRequestException('Invalid IPN');
    }

    const registration = await this.records.findOne({
      invoiceNumber: invoice,
      courseId: COURSE_ID,
      environment: this.environment(),
    });

    if (!registration) {
      throw new NotFoundException('Unknown invoice');
    }

    if (
        !Number.isFinite(Number(payload.trx_amount)) ||
        Number(payload.trx_amount) < registration.amount
        ) {
        throw new BadRequestException('IPN amount mismatch');
    }

    if (
      registration.status === 'paid' ||
      registration.status === 'confirmed'
    ) {
      if (registration.transactionId === trxId) {
        return { status: 'success' };
      }

      throw new ConflictException('Transaction mismatch');
    }

    await this.verifyRegistration(registration);

    const updated = await this.records.findOne({
      _id: registration._id,
    });

    if (
      !updated ||
      !['paid', 'confirmed'].includes(updated.status) ||
      updated.transactionId !== trxId
    ) {
      throw new ServiceUnavailableException(
        'IPN not independently verified yet',
      );
    }

    return { status: 'success' };
  }

  // backend/src/course/course.service.ts

  async callback(invoice?: string) {
    const frontend = (
      process.env.COURSE_FRONTEND_PUBLIC_URL ||
      'https://workshop.researchustad.org'
    ).replace(/\/$/, '');

    if (
      invoice &&
      /^[A-Za-z0-9_-]{10,100}$/.test(invoice)
    ) {
      const registration = await this.records.findOne({
        invoiceNumber: invoice,
        courseId: COURSE_ID,
        environment: this.environment(),
      });

      if (registration) {
        try {
          await this.verifyRegistration(registration);
        } catch (error) {
          console.error('[Course Payment] Callback verification failed', {
            invoice,
            message:
              error instanceof Error
                ? error.message
                : 'Unknown verification error',
          });
        }
      }
    }

    // Never trust the browser callback as proof of payment.
    // The next page checks the authenticated registration.
    return `${frontend}/${COURSE_SLUG}/payment-verifying`;
  }

  private normalizePhone(value: string) {
    const raw = value.replace(/\D/g, '');
    let number = raw;

    if (/^01[3-9]\d{8}$/.test(number)) {
      number = `88${number}`;
    } else if (/^1[3-9]\d{8}$/.test(number)) {
      number = `880${number}`;
    } else if (number.startsWith('00880')) {
      number = number.slice(2);
    }

    if (!/^8801[3-9]\d{8}$/.test(number)) {
      throw new BadRequestException(
        'A valid Bangladesh mobile number is required for SMS',
      );
    }

    return number;
  }

  private escapeHtml(value: unknown) {
    return String(value || '').replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char] || char,
    );
  }

  private async sendEmail(registration: CourseRecord) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration missing');
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user, pass },
    });

    const whatsapp = this.getWhatsappGroupUrl();

    const groupHtml = whatsapp
    ? `
      <div style="
        background:#ecfdf5;
        border:2px solid #6ee7b7;
        border-radius:14px;
        padding:28px 22px;
        margin:25px 0;
        text-align:center;
      ">

        <div style="
          font-size:38px;
          line-height:1;
          margin-bottom:14px;
        ">
          💬
        </div>

        <h3 style="
          margin:0;
          color:#064e3b;
          font-size:19px;
          font-weight:700;
          line-height:27px;
        ">
          Join Your Official Course WhatsApp Group
        </h3>

        <p style="
          margin:12px 0 22px;
          color:#065f46;
          font-size:14px;
          line-height:24px;
        ">
          Stay connected with course announcements,
          class updates and the learning community.
        </p>

        <a
          href="${this.escapeHtml(whatsapp)}"
          target="_blank"
          style="
            display:inline-block;
            background:#059669;
            color:#ffffff;
            padding:14px 26px;
            border-radius:9px;
            font-size:14px;
            font-weight:700;
            text-decoration:none;
          "
        >
          Join WhatsApp Group &nbsp; →
        </a>

      </div>
    `
    : `
      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:10px;
        padding:20px;
        margin:25px 0;
        text-align:center;
      ">
        <div style="font-size:32px;margin-bottom:10px;">💬</div>

        <h3 style="
          margin:0 0 8px;
          color:#334155;
          font-size:17px;
          font-weight:700;
        ">
          Course WhatsApp Group
        </h3>

        <p style="
          margin:0;
          color:#64748b;
          font-size:14px;
          line-height:23px;
        ">
          Group joining details will be shared separately.
          Please check your email for future updates.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Research Ustad" <${user}>`,
      to: registration.email,
      subject: 'Research Article Writing &  Publishing : Batch-01 Registration Confirmed — Research Ustad',
        html: `
          <div style="margin:0;padding:35px 12px;background-color:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#263247;">

            <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9f0;">

              <!-- Header -->
              <div style="background:#173b8f;padding:32px 30px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:25px;font-weight:700;letter-spacing:0.3px;">
                  Registration Confirmed!
                </h1>
                <p style="margin:10px 0 0;color:#dce7ff;font-size:14px;line-height:22px;">
                  Your payment has been successfully verified.
                </p>
              </div>

              <!-- Main Content -->
              <div style="padding:32px 30px;">

                <p style="margin:0 0 18px;font-size:16px;line-height:26px;">
                  Dear <strong>${this.escapeHtml(registration.fullName)}</strong>,
                </p>

                <p style="margin:0 0 22px;font-size:15px;line-height:25px;color:#4b5563;">
                  Congratulations! We are pleased to confirm that your payment has been verified and your registration for the following course is now officially confirmed.
                </p>

                <!-- Course Information -->
                <div style="background:#f5f7fc;border-left:4px solid #2546a8;padding:20px 20px;margin:0 0 24px;border-radius:5px;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                    COURSE ENROLLMENT
                  </p>
                  <h2 style="margin:0;color:#173b8f;font-size:19px;line-height:28px;font-weight:700;">
                    Research Article Writing &amp; Academic Publishing Guidelines
                  </h2>
                  <p style="margin:10px 0 0;color:#526078;font-size:13px;line-height:22px;">
                    Batch 01
                  </p>
                </div>

                <!-- Payment Details -->
                <h3 style="margin:0 0 14px;color:#17213b;font-size:17px;font-weight:700;">
                  Registration &amp; Payment Details
                </h3>

                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
                  <tr>
                    <td style="padding:13px 12px;background:#f8fafc;border-bottom:1px solid #e8edf3;color:#64748b;width:42%;">
                      Registration ID
                    </td>
                    <td style="padding:13px 12px;background:#f8fafc;border-bottom:1px solid #e8edf3;color:#17213b;font-weight:700;">
                      ${this.escapeHtml(registration.registrationId)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:13px 12px;border-bottom:1px solid #e8edf3;color:#64748b;">
                      Transaction ID
                    </td>
                    <td style="padding:13px 12px;border-bottom:1px solid #e8edf3;color:#17213b;font-weight:600;word-break:break-word;">
                      ${this.escapeHtml(registration.transactionId)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:13px 12px;background:#f8fafc;color:#64748b;">
                      Amount Paid
                    </td>
                    <td style="padding:13px 12px;background:#f8fafc;color:#15803d;font-size:17px;font-weight:700;">
                      BDT ${Number(registration.amount).toLocaleString('en-BD')}
                    </td>
                  </tr>
                </table>

                <!-- Course Format -->
                <h3 style="margin:0 0 12px;color:#17213b;font-size:17px;font-weight:700;">
                  Course Overview
                </h3>

                <div style="padding:16px 18px;background:#f8fafc;border:1px solid #e8edf3;border-radius:7px;margin-bottom:24px;">
                  <p style="margin:0;color:#475569;font-size:14px;line-height:25px;">
                    <strong style="color:#17213b;">24 Live Classes</strong>
                    <span style="color:#94a3b8;"> &nbsp;|&nbsp; </span>
                    <strong style="color:#17213b;">8 Modules</strong>
                    <span style="color:#94a3b8;"> &nbsp;|&nbsp; </span>
                    <strong style="color:#17213b;">Practical Assignments</strong>
                  </p>
                </div>

                <!-- Orientation Notice -->
                <div style="padding:18px 20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;margin-bottom:24px;">
                  <h3 style="margin:0 0 8px;color:#1e40af;font-size:15px;font-weight:700;">
                    Orientation Class &amp; Schedule
                  </h3>
                  <p style="margin:0;color:#334155;font-size:14px;line-height:24px;">
                    Details regarding the orientation class, including its date and time, will be shared with registered participants later. Please stay connected and check your email and WhatsApp group regularly for further announcements.
                  </p>
                </div>

                ${groupHtml}

                <p style="margin:22px 0 0;color:#526078;font-size:14px;line-height:24px;">
                  Please keep this email for your records. We look forward to having you with us on this learning journey.
                </p>

                <!-- Signature -->
                <div style="margin-top:30px;padding-top:22px;border-top:1px solid #e8edf3;">
                  <p style="margin:0 0 12px;color:#334155;font-size:14px;">
                    Regards,
                  </p>

                  <img
                    src="https://www.researchustad.org/logo.png"
                    alt="Research Ustad"
                    style="width:100px;height:100px;display:block;object-fit:contain;margin-bottom:10px;"
                    width="100"
                    height="100"
                  >

                  <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#17213b;">
                    Research Ustad Team
                  </p>

                  <p style="margin:5px 0;color:#555;font-size:13px;line-height:21px;">
                    <strong>Website:</strong>
                    <a href="https://www.researchustad.org" style="color:#2546a8;text-decoration:none;">
                      Research Ustad
                    </a>
                  </p>

                  <p style="margin:5px 0;color:#555;font-size:13px;line-height:21px;">
                    <strong>WhatsApp:</strong>
                    <a href="https://wa.me/8801724653054" style="color:#16834a;text-decoration:none;">
                      +880 1724-653054
                    </a>
                  </p>

                  <p style="margin:5px 0;color:#555;font-size:13px;line-height:21px;">
                    <strong>Email:</strong>
                    <a href="mailto:info@researchustad.org" style="color:#2546a8;text-decoration:none;">
                      info@researchustad.org
                    </a>
                  </p>
                </div>

              </div>

              <!-- Footer -->
              <div style="padding:18px 25px;background:#f8fafc;text-align:center;border-top:1px solid #e8edf3;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:20px;">
                  © ${new Date().getFullYear()} Research Ustad. All rights reserved.
                </p>
                <p style="margin:5px 0 0;color:#94a3b8;font-size:11px;">
                  Empowering Research, Inspiring Excellence.
                </p>
              </div>

            </div>
          </div>
        `,

    });
  }

  private async sendSms(registration: CourseRecord) {
    const key = process.env.ZENDSMS_API_KEY;
    const sender = process.env.ZENDSMS_SENDER_ID;

    if (!key || !sender) {
      throw new Error('ZendSMS configuration missing');
    }

    const phone = this.normalizePhone(registration.whatsapp);

    const message =
    `Dear ${registration.fullName},\n` +
    `Congratulations! Your registration for Batch 01 has been successfully confirmed.\n` +
    `Registration ID: ${registration.registrationId}\n` +
    `Payment Received: BDT ${registration.amount.toLocaleString('en-BD')}\n` +
    `Please check your email for enrollment details and further instructions.\n`+
    `Thank you for choosing Research Ustad!\n` +
    `-Research Ustad`;

    const response = await fetch(
      'https://api.zendsms.com/api/v1/send-sms',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: phone,
          sender_id: sender,
          message,
          client_ref: `ru-course-${registration.registrationId}`,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok || data.success !== true) {
      throw new Error('SMS provider did not accept the message');
    }
  }

  private async dispatchNotification(
    registration: CourseRecord,
    channel: 'email' | 'sms',
  ) {
    // Claim an unsent or previously failed notification atomically.
    const claim = await this.records.findOneAndUpdate(
      {
        _id: registration._id,
        status: 'confirmed',
        [`notifications.${channel}`]: {
          $in: ['pending', 'failed'],
        },
      },
      {
        $set: {
          [`notifications.${channel}`]: 'sending',
        },
      },
      { returnDocument: 'after' },
    );

    if (!claim) return;
    this.courseRealtime.notifyChange();

    try {
      if (channel === 'email') {
        await this.sendEmail(registration);
      } else {
        await this.sendSms(registration);
      }

      await this.records.updateOne(
        { _id: registration._id },
        {
          $set: {
            [`notifications.${channel}`]: 'sent',
          },
        },
      );
      this.courseRealtime.notifyChange();
    } catch {
      await this.records.updateOne(
        { _id: registration._id },
        {
          $set: {
            [`notifications.${channel}`]: 'failed',
          },
        },
      );
      this.courseRealtime.notifyChange();
    }
  }

  async confirm(accessToken?: string, termsAccepted?: boolean) {
    if (termsAccepted !== true) {
      throw new BadRequestException(
        'You must accept the Terms and Conditions',
      );
    }

    let registration = await this.authorized(accessToken);

    // Verify payment before confirmation.
    if (registration.status === 'pending') {
      await this.verifyRegistration(registration);
      registration = await this.authorized(accessToken);
    }

    if (registration.status !== 'paid' &&
        registration.status !== 'confirmed') {
      throw new BadRequestException(
        'Payment must be verified before confirmation',
      );
    }

    let confirmed: CourseRecord | null = null;
    let newlyConfirmed = false;

    const session = this.mongo.startSession();

    try {
      await session.withTransaction(
        async () => {
          // Always read the latest registration inside the transaction.
          const current = await this.records.findOne(
            {
              _id: registration!._id,
              courseId: COURSE_ID,
            },
            { session },
          );

          if (!current) {
            throw new NotFoundException(
              'Registration not found',
            );
          }

          // Idempotency: never allocate another ID for an already confirmed registration.
          if (current.status === 'confirmed') {
            confirmed = current;
            return;
          }

          if (current.status !== 'paid') {
            throw new BadRequestException(
              'Payment must be verified before confirmation',
            );
          }

          // Fresh official counter namespace.
          // First successful confirmation gets RU-RAP01-0001.
          const counter = await this.counters.findOneAndUpdate(
            { _id: 'RU-RAP01' },
            {
              $inc: {
                seq: 1,
              },
            },
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
          const officialRegistrationId = `RU-RAP01-${serial}`;

          const now = new Date();

          // Assign the official ID and confirm in the same transaction.
          const updateResult = await this.records.updateOne(
            {
              _id: current._id,
              status: 'paid',
            },
            {
              $set: {
                registrationId: officialRegistrationId,
                status: 'confirmed',
                termsAcceptedAt: now,
                confirmedAt: now,
                updatedAt: now,
              },
            },
            { session },
          );

          if (updateResult.modifiedCount !== 1) {
            throw new ConflictException(
              'Registration confirmation failed. Please try again.',
            );
          }

          const finalRecord = await this.records.findOne(
            { _id: current._id },
            { session },
          );

          if (!finalRecord) {
            throw new ServiceUnavailableException(
              'Unable to retrieve confirmed registration',
            );
          }

          confirmed = finalRecord;
          newlyConfirmed = true;
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

    if (!confirmed) {
      throw new ServiceUnavailableException(
        'Registration confirmation could not be completed',
      );
    }

    if (newlyConfirmed) {
      this.courseRealtime.notifyChange();
    }

    // Notifications run only after the transaction commits.
    // They will receive the official registration ID.
    await Promise.allSettled([
      this.dispatchNotification(confirmed, 'email'),
      this.dispatchNotification(confirmed, 'sms'),
    ]);

    return this.safeRecord(
      await this.authorized(accessToken),
    );
  }

  private normalizeResumeEmail(input: unknown): string {
  const email = String(input || '').trim().toLowerCase();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new BadRequestException('Please enter a valid email address');
  }

  return email;
}

private makeResumeOtpHash(email: string, otp: string): string {
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

async requestResume(emailInput: unknown) {
  const email = this.normalizeResumeEmail(emailInput);

  const publicResponse = {
    message:
      'If a registration exists for this email, a verification code has been sent.',
  };

  const registration = await this.records.findOne({
    courseId: COURSE_ID,
    emailNormalized: email,
  });

  // Avoid revealing whether an email exists.
  if (!registration) {
    return publicResponse;
  }

  const now = new Date();
  const otp = String(randomInt(0, 1000000)).padStart(6, '0');
  const otpHash = this.makeResumeOtpHash(email, otp);

  // Atomic 60-second cooldown: prevents concurrent OTP spam.
  const claimed = await this.records.updateOne(
    {
      _id: registration._id,
      $or: [
        { resumeOtpRequestedAt: { $exists: false } },
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
        resumeOtpExpiresAt: new Date(now.getTime() + 10 * 60_000),
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
    const port = Number(process.env.SMTP_PORT || 587);

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration is missing');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Research Ustad" <${user}>`,
      to: email,
      subject: 'Your Course Registration Verification Code',
      text:
        `Your Research Ustad Batch 01 verification code is: ${otp}\n\n` +
        'This code expires in 10 minutes.\n' +
        'If you did not request this code, you can ignore this message.',
      html: `
        <div style="max-width:560px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#17213b">
          <h2 style="color:#4338ca">Research Ustad</h2>
          <h3>Resume Your Course Registration</h3>
          <p>Use the following verification code to securely access your existing registration:</p>
          <div style="padding:20px;background:#eef2ff;border-radius:12px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#312e81">
            ${otp}
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this code, simply ignore this email.</p>
          <p>Research Ustad Team</p>
        </div>
      `,
    });

    return publicResponse;
  } catch (error) {
    console.error(
      '[Course Resume OTP]',
      error instanceof Error ? error.message : 'Email failure',
    );

    // Release the unsuccessful OTP request for a later retry.
    await this.records.updateOne(
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

async verifyResume(
  emailInput: unknown,
  codeInput: unknown,
) {
  const email = this.normalizeResumeEmail(emailInput);
  const code = String(codeInput || '').trim();

  if (!/^\d{6}$/.test(code)) {
    throw new BadRequestException('Enter the six-digit verification code');
  }

  const now = new Date();

  // Atomically consume one verification attempt.
  const attempted = await this.records.findOneAndUpdate(
    {
      courseId: COURSE_ID,
      emailNormalized: email,
      resumeOtpHash: { $exists: true },
      resumeOtpExpiresAt: { $gt: now },
      resumeOtpAttempts: { $lt: 5 },
    },
    {
      $inc: { resumeOtpAttempts: 1 },
    },
    {
      returnDocument: 'after',
    },
  );

  if (!attempted || !attempted.resumeOtpHash) {
    throw new BadRequestException(
      'Invalid or expired verification code. Request a new code.',
    );
  }

  const suppliedHash = this.makeResumeOtpHash(email, code);

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
    timingSafeEqual(expectedBuffer, suppliedBuffer);

  if (!isValid) {
    throw new BadRequestException(
      'Incorrect verification code',
    );
  }

  // Create a completely new session token.
  const accessToken = randomBytes(32).toString('hex');

  // Only one concurrent request can consume this OTP.
  const updated = await this.records.findOneAndUpdate(
    {
      _id: attempted._id,
      resumeOtpHash: suppliedHash,
      resumeOtpExpiresAt: { $gt: new Date() },
      resumeOtpAttempts: { $lte: 5 },
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
    accessToken,
    registrationId: updated.registrationId,
    status: updated.status,
    };
}
}