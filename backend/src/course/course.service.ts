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

const COURSE_ID = 'research-article-writing-01';
const COURSE_SLUG =
  'research-article-writing-academic-publishing-masterclass';

const COURSE_FEE = 3000;
const ORIGINAL_FEE = 5000;

type CourseStatus =
  | 'draft'
  | 'initiating'
  | 'pending'
  | 'paid'
  | 'confirmed';

type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed';

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
  private mongo: MongoClient;
  private records: Collection<CourseRecord>;
  private coupons: Collection<CourseCoupon>;

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

    return this.safeRecord(updated);
  }


  async register(dto: CourseRegistrationDto) {
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
        'This email already has a Course 01 registration. Use your original browser session to resume.',
      );
    }

    const accessToken = randomBytes(32).toString('hex');
    const registrationId =
      `RU-C01-${randomBytes(9).toString('hex').toUpperCase()}`;

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

    if (registration.status === 'pending') {
      const age = Date.now() -
        new Date(registration.lastVerifiedAt || 0).getTime();

      if (age > 12000) {
        try {
          await this.verifyRegistration(registration);
          registration = await this.authorized(accessToken);
        } catch {
          // A temporary gateway outage must not mark a payment failed.
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

  async initiate(accessToken?: string) {
    const registration = await this.authorized(accessToken);

    if (
      registration.status === 'paid' ||
      registration.status === 'confirmed'
    ) {
      throw new BadRequestException(
        'This registration has already been paid',
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
        checkout_items: 'Course 01 - Research Publishing Masterclass',
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
        await this.records.updateOne(
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

        throw new BadGatewayException(
            'PayStation rejected payment initiation. Please try again.',
        );
        }

      await this.records.updateOne(
        { _id: registration._id, status: 'initiating' },
        {
          $set: {
            status: 'pending',
            paymentUrl: result.payment_url,
            updatedAt: new Date(),
          },
        },
      );

      return {
        invoiceNumber,
        paymentUrl: result.payment_url,
      };
    } catch (error) {
      // Keep the invoice for support/reconciliation if gateway
      // created a payment but its response was interrupted.
      await this.records.updateOne(
        { _id: registration._id, status: 'initiating' },
        {
          $set: {
            status: 'pending',
            updatedAt: new Date(),
          },
        },
      );

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

    if (!registration.invoiceNumber) return;

    // Record the verification attempt to avoid hammering PayStation.
    await this.records.updateOne(
      { _id: registration._id },
      { $set: { lastVerifiedAt: new Date() } },
    );

    const merchant = this.paymentCredentials();

    const result = await this.gatewayRequest(
      '/transaction-status',
      new URLSearchParams({
        invoice_number: registration.invoiceNumber,
      }),
      { merchantId: merchant.id },
    );

    if (
      String(result.status_code) !== '200' ||
      String(result.status).toLowerCase() !== 'success'
    ) {
      return;
    }

    const data = result.data || {};

    const gatewayStatus =
      String(data.trx_status || '').toLowerCase();

    if (gatewayStatus !== 'success') return;

    if (
    String(data.invoice_number) !== registration.invoiceNumber ||
    Number(data.payment_amount) !== registration.amount ||
    !data.trx_id ||
    (
        data.reference &&
        String(data.reference) !== COURSE_ID
    )
    ) {
      throw new BadGatewayException(
        'Gateway transaction details do not match this course registration',
      );
    }

    const transactionId = String(data.trx_id);

    if (
      registration.transactionId &&
      registration.transactionId !== transactionId
    ) {
      throw new ConflictException('Transaction ID mismatch');
    }

    // Atomic update: a duplicate callback cannot credit twice.
    try {
      await this.records.updateOne(
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
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Gateway transaction already associated with another registration',
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
      String(payload?.trx_status).toLowerCase() !== 'success'
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
        Number(payload.trx_amount) !== registration.amount
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

  async callback(invoice?: string) {
    if (invoice && /^[A-Za-z0-9_-]{10,100}$/.test(invoice)) {
      const registration = await this.records.findOne({
        invoiceNumber: invoice,
        courseId: COURSE_ID,
        environment: this.environment(),
      });

      if (registration) {
        try {
          await this.verifyRegistration(registration);
        } catch {
          // A later status check/IPN can complete reconciliation.
        }
      }
    }

    const frontend = (
      process.env.COURSE_FRONTEND_PUBLIC_URL ||
      'https://workshop.researchustad.org'
    ).replace(/\/$/, '');

    return `${frontend}/${COURSE_SLUG}/checkout`;
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
      ? `<p><a href="${whatsapp}">Join the Course WhatsApp Group</a></p>`
      : '<p>Group joining details will be shared separately.</p>';

    await transporter.sendMail({
      from: `"Research Ustad" <${user}>`,
      to: registration.email,
      subject: 'Course 01 Registration Confirmed — Research Ustad',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:30px;color:#17213b">
          <h1 style="color:#2546a8">Registration Confirmed</h1>
          <p>Dear ${this.escapeHtml(registration.fullName)},</p>
          <p>Your payment has been verified and your registration is confirmed.</p>
          <h2>Research Article Writing &amp; Academic Publishing Masterclass</h2>
          <p><strong>Registration ID:</strong> ${this.escapeHtml(registration.registrationId)}</p>
          <p><strong>Transaction ID:</strong> ${this.escapeHtml(registration.transactionId)}</p>
          <p><strong>Amount Paid:</strong> BDT ${registration.amount}</p>
          <p><strong>Format:</strong> 24 live classes · 8 modules · practical assignments</p>
          ${groupHtml}
          <p>Please keep this email for your records. The course schedule and joining instructions will be communicated separately.</p>
          <p>Regards,<br><strong>Research Ustad Team</strong></p>
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
      `Research Ustad: Course 01 registration confirmed. ` +
      `ID: ${registration.registrationId}. ` +
      `Paid: BDT ${registration.amount}. Check your email for details.`;

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
    } catch {
      await this.records.updateOne(
        { _id: registration._id },
        {
          $set: {
            [`notifications.${channel}`]: 'failed',
          },
        },
      );
    }
  }

  async confirm(accessToken?: string, termsAccepted?: boolean) {
    if (termsAccepted !== true) {
      throw new BadRequestException(
        'You must accept the Terms and Conditions',
      );
    }

    let registration = await this.authorized(accessToken);

    if (registration.status !== 'confirmed') {
      if (registration.status === 'pending') {
        await this.verifyRegistration(registration);
        registration = await this.authorized(accessToken);
      }

      if (registration.status !== 'paid') {
        throw new BadRequestException(
          'Payment must be verified before confirmation',
        );
      }

      await this.records.updateOne(
        { _id: registration._id, status: 'paid' },
        {
          $set: {
            status: 'confirmed',
            termsAcceptedAt: new Date(),
            confirmedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
    }

    const confirmed = await this.authorized(accessToken);

    // Sending failure never changes a paid/confirmed record to unpaid.
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
        `Your Research Ustad Course 01 verification code is: ${otp}\n\n` +
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