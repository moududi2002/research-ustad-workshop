// backend/src/course/batch-01/services/batch-01-payment.service.ts

import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  Collection,
  ObjectId,
} from 'mongodb';

import {
  createHash,
  randomBytes,
} from 'crypto';

import {
  Batch01DatabaseService,
} from '../database/batch-01-database.service';

import {
  Batch01SettingsService,
} from './batch-01-settings.service';

import {
  BATCH_01_COURSE_ID,
  BATCH_01_COURSE_SLUG,
} from '../config/batch-01.defaults';

type RegistrationStatus =
  | 'draft'
  | 'initiating'
  | 'pending'
  | 'paid'
  | 'confirmed';

interface Batch01PaymentRegistration {
  _id: ObjectId;
  registrationId: string;
  courseId: string;
  accessHash: string;
  fullName: string;
  email: string;
  emailNormalized: string;
  whatsapp: string;
  status: RegistrationStatus;
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
  couponCode?: string;
  discountAmount?: number;
  prePaymentTermsAccepted?: boolean;
  refundPolicyAccepted?: boolean;
  prePaymentAcceptedAt?: Date;
  updatedAt: Date;
}

interface Batch01PaymentCoupon {
  _id: ObjectId;
  courseId: string;
  code: string;
  type: 'final_price' | 'percentage' | 'fixed';
  value: number;
  active: boolean;
  allowedEmail: string | null;
  expiresAt: Date | null;
}

@Injectable()
export class Batch01PaymentService {
  private get registrations(): Collection<Batch01PaymentRegistration> {
    return this.databaseService
      .getDb()
      .collection<Batch01PaymentRegistration>(
        'batch_01_registrations',
      );
  }

  private get coupons(): Collection<Batch01PaymentCoupon> {
    return this.databaseService
      .getDb()
      .collection<Batch01PaymentCoupon>(
        'batch_01_coupons',
      );
  }

  constructor(
    private readonly databaseService: Batch01DatabaseService,
    private readonly settingsService: Batch01SettingsService,
  ) {}

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

  private hash(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex');
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
          'Content-Type':
            'application/x-www-form-urlencoded',
          Accept: 'application/json',
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

    try {
      return await response.json();
    } catch {
      throw new BadGatewayException(
        'Invalid response received from PayStation',
      );
    }
  }

  private validCheckoutUrl(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      const url = new URL(value);
      const expected = new URL(this.gatewayBase());

      return (
        url.protocol === 'https:' &&
        url.hostname === expected.hostname &&
        url.pathname.startsWith('/checkout/')
      );
    } catch {
      return false;
    }
  }

  private async authorized(
    accessToken?: string,
  ): Promise<Batch01PaymentRegistration> {
    if (
      !accessToken ||
      !/^[a-f0-9]{64}$/i.test(accessToken)
    ) {
      throw new UnauthorizedException(
        'Registration access token is missing or invalid',
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

  private generateInvoiceNumber(): string {
    // PayStation invoice number: numeric and unique.
    return (
      Date.now().toString() +
      randomBytes(4).readUInt32BE(0)
        .toString()
        .padStart(10, '0')
    ).slice(0, 23);
  }

  private calculateCouponPrice(
    coupon: Batch01PaymentCoupon,
    basePrice: number,
  ): number {
    let finalPrice: number;

    if (coupon.type === 'percentage') {
      finalPrice = Math.round(
        basePrice * (100 - coupon.value) / 100,
      );
    } else if (coupon.type === 'fixed') {
      finalPrice = basePrice - coupon.value;
    } else {
      finalPrice = coupon.value;
    }

    if (
      !Number.isInteger(finalPrice) ||
      finalPrice < 1 ||
      finalPrice > basePrice
    ) {
      throw new ConflictException(
        'The applied coupon is no longer valid for the current course fee. Please remove and reapply it.',
      );
    }

    return finalPrice;
  }

  // Recalculate the amount on the backend immediately before checkout.
  private async refreshRegistrationPrice(
    registration: Batch01PaymentRegistration,
  ): Promise<number> {
    const settings =
      await this.settingsService.getSettings();

    const now = new Date();

    const availability =
      this.settingsService.getRegistrationAvailability(
        settings,
        now,
      );

    if (!availability.isOpen) {
      throw new ConflictException(
        'Registration is closed. Payment initiation is no longer available.',
      );
    }

    const pricing =
      this.settingsService.getCurrentPrice(
        settings,
        now,
      );

    let finalAmount = pricing.basePrice;
    let discountAmount = 0;

    if (registration.couponCode) {
      const coupon = await this.coupons.findOne({
        courseId: BATCH_01_COURSE_ID,
        code: registration.couponCode,
      });

      if (
        !coupon ||
        !coupon.active ||
        (
          coupon.expiresAt &&
          coupon.expiresAt.getTime() <= now.getTime()
        ) ||
        (
          coupon.allowedEmail &&
          coupon.allowedEmail !==
            registration.emailNormalized
        )
      ) {
        throw new ConflictException(
          'The applied coupon is invalid or expired. Remove the coupon before continuing.',
        );
      }

      finalAmount = this.calculateCouponPrice(
        coupon,
        pricing.basePrice,
      );

      discountAmount =
        pricing.basePrice - finalAmount;
    }

    await this.registrations.updateOne(
      {
        _id: registration._id,
        status: 'draft',
      },
      {
        $set: {
          amount: finalAmount,
          originalAmount: pricing.originalPrice,
          pricingType: pricing.pricingType,
          pricingSnapshotAt: now,
          discountAmount,
          updatedAt: now,
        },
      },
    );

    return finalAmount;
  }

  // Start a PayStation checkout session.
  async initiate(
    accessToken: string | undefined,
    termsAccepted: boolean,
    refundPolicyAccepted: boolean,
  ) {
    const registration =
      await this.authorized(accessToken);

    if (
      registration.status === 'paid' ||
      registration.status === 'confirmed'
    ) {
      throw new ConflictException(
        'This registration has already been paid',
      );
    }

    if (
      termsAccepted !== true ||
      refundPolicyAccepted !== true
    ) {
      throw new BadRequestException(
        'You must accept the Terms & Conditions and Refund Policy before payment.',
      );
    }

    if (
      registration.status === 'pending' &&
      registration.paymentUrl
    ) {
      return {
        success: true,
        invoiceNumber: registration.invoiceNumber,
        paymentUrl: registration.paymentUrl,
        amount: registration.amount,
        status: registration.status,
      };
    }

    if (registration.status !== 'draft') {
      throw new ConflictException(
        'Payment initiation is already in progress. Please check your registration status.',
      );
    }

    // Recalculate current fee and coupon on the server.
    const amount =
      await this.refreshRegistrationPrice(registration);

    const now = new Date();

    // Save policy acceptance and lock the registration atomically.
    const invoiceNumber = this.generateInvoiceNumber();

    const locked = await this.registrations.updateOne(
      {
        _id: registration._id,
        courseId: BATCH_01_COURSE_ID,
        status: 'draft',
        amount,
      },
      {
        $set: {
          status: 'initiating',
          invoiceNumber,
          prePaymentTermsAccepted: true,
          refundPolicyAccepted: true,
          prePaymentAcceptedAt: now,
          updatedAt: now,
        },
      },
    );

    if (locked.modifiedCount !== 1) {
      throw new ConflictException(
        'Payment has already started. Please refresh your registration.',
      );
    }

    try {
      const { id, password } =
        this.paymentCredentials();

      const publicBackend = (
        process.env.COURSE_BACKEND_PUBLIC_URL || ''
      ).replace(/\/$/, '');

      if (!publicBackend.startsWith('https://')) {
        throw new ServiceUnavailableException(
          'A valid public HTTPS backend URL is required',
        );
      }

      const body = new URLSearchParams({
        merchantId: id,
        password,
        invoice_number: invoiceNumber,
        currency: 'BDT',
        payment_amount: String(amount),
        pay_with_charge: '1',
        reference: BATCH_01_COURSE_ID,
        checkout_items:
          'Research Foundation Course - Batch 01',
        cust_name: registration.fullName,
        cust_email: registration.email,
        cust_phone: registration.whatsapp,
        callback_url:
          `${publicBackend}/api/course/batch-01/callback`,
      });

      const result = await this.gatewayRequest(
        '/initiate-payment',
        body,
      );

      if (
        String(result.status_code) !== '200' ||
        String(result.status).trim().toLowerCase() !==
          'success' ||
        String(result.invoice_number) !== invoiceNumber ||
        !this.validCheckoutUrl(result.payment_url)
      ) {
        await this.registrations.updateOne(
          {
            _id: registration._id,
            status: 'initiating',
            invoiceNumber,
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
          'PayStation rejected the payment request. Please try again.',
        );
      }

      await this.registrations.updateOne(
        {
          _id: registration._id,
          status: 'initiating',
          invoiceNumber,
        },
        {
          $set: {
            status: 'pending',
            paymentUrl: result.payment_url,
            updatedAt: new Date(),
          },
        },
      );

      return {
        success: true,
        invoiceNumber,
        paymentUrl: result.payment_url,
        amount,
        status: 'pending',
      };
    } catch (error) {
      // Preserve the invoice for reconciliation if the gateway
      // may have created a checkout but the response was interrupted.
      await this.registrations.updateOne(
        {
          _id: registration._id,
          status: 'initiating',
          invoiceNumber,
        },
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

  // Verify a transaction directly with PayStation.
  private async verifyRegistration(
    registration: Batch01PaymentRegistration,
  ): Promise<void> {
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
      String(result.status).trim().toLowerCase() !==
        'success'
    ) {
      return;
    }

    const data = result.data || {};

    const gatewayStatus = String(
      data.trx_status || '',
    ).trim().toLowerCase();

    if (
      !['success', 'successful'].includes(gatewayStatus)
    ) {
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

    const amountValid =
      Number.isFinite(receivedAmount) &&
      receivedAmount >= expectedAmount &&
      (
        requestedAmount === null ||
        requestedAmount === expectedAmount
      );

    const invoiceValid =
      String(data.invoice_number) ===
      registration.invoiceNumber;

    const transactionId =
      String(data.trx_id || '').trim();

    const transactionValid =
      transactionId.length > 0 &&
      transactionId !== '****';

    const referenceValid =
      !data.reference ||
      String(data.reference) === BATCH_01_COURSE_ID;

    if (
      !invoiceValid ||
      !amountValid ||
      !transactionValid ||
      !referenceValid
    ) {
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
      await this.registrations.updateOne(
        {
          _id: registration._id,
          courseId: BATCH_01_COURSE_ID,
          invoiceNumber: registration.invoiceNumber,
          status: {
            $in: ['pending', 'initiating'],
          },
        },
        {
          $set: {
            status: 'paid',
            transactionId,
            paymentMethod: String(
              data.payment_method || '',
            ),
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'This transaction is already associated with another registration',
        );
      }

      throw error;
    }
  }

  // Participant: verify their own payment using the access token.
  async verify(accessToken?: string) {
    const registration =
      await this.authorized(accessToken);

    await this.verifyRegistration(registration);

    const latest =
      await this.authorized(accessToken);

    return {
      success: true,
      registrationId: latest.registrationId,
      status: latest.status,
      amount: latest.amount,
      invoiceNumber: latest.invoiceNumber || null,
      transactionId: latest.transactionId || null,
      paymentMethod: latest.paymentMethod || null,
      paidAt: latest.paidAt || null,
    };
  }

  // Internal IPN: verify the notification independently with PayStation.
  async handleIpn(payload: any) {
    const invoice = String(
      payload?.invoice_number || '',
    );

    const transactionId = String(
      payload?.trx_id || '',
    ).trim();

    if (
      !/^[A-Za-z0-9_-]{10,100}$/.test(invoice) ||
      !transactionId ||
      transactionId === '****' ||
      !['success', 'successful'].includes(
        String(payload?.trx_status || '')
          .trim()
          .toLowerCase(),
      )
    ) {
      throw new BadRequestException('Invalid Batch-01 IPN');
    }

    const registration =
      await this.registrations.findOne({
        invoiceNumber: invoice,
        courseId: BATCH_01_COURSE_ID,
        environment: this.environment(),
      });

    if (!registration) {
      throw new NotFoundException(
        'Unknown Batch-01 invoice',
      );
    }

    if (
      !Number.isFinite(Number(payload.trx_amount)) ||
      Number(payload.trx_amount) < registration.amount
    ) {
      throw new BadRequestException(
        'IPN amount mismatch',
      );
    }

    if (
      registration.status === 'paid' ||
      registration.status === 'confirmed'
    ) {
      if (registration.transactionId === transactionId) {
        return {
          status: 'success',
        };
      }

      throw new ConflictException(
        'Transaction mismatch',
      );
    }

    await this.verifyRegistration(registration);

    const updated =
      await this.registrations.findOne({
        _id: registration._id,
      });

    if (
      !updated ||
      !['paid', 'confirmed'].includes(updated.status) ||
      updated.transactionId !== transactionId
    ) {
      throw new ServiceUnavailableException(
        'IPN has not been independently verified yet',
      );
    }

    return {
      status: 'success',
    };
  }

  // Browser callback: verify payment, then redirect to the frontend.
  async callback(invoiceInput?: string): Promise<string> {
    const frontend = (
      process.env.COURSE_FRONTEND_PUBLIC_URL ||
      'https://workshop.researchustad.org'
    ).replace(/\/$/, '');

    const invoice = String(invoiceInput || '');

    if (/^[A-Za-z0-9_-]{10,100}$/.test(invoice)) {
      const registration =
        await this.registrations.findOne({
          invoiceNumber: invoice,
          courseId: BATCH_01_COURSE_ID,
          environment: this.environment(),
        });

      if (registration) {
        try {
          await this.verifyRegistration(registration);
        } catch (error) {
          console.error(
            '[Batch-01 Payment] Callback verification failed',
            {
              invoice,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown verification error',
            },
          );
        }
      }
    }

    // Browser callback is never treated as proof of payment.
    return `${frontend}/${BATCH_01_COURSE_SLUG}/payment-verifying`;
  }
}