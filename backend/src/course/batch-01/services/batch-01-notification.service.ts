// backend/src/course/batch-01/services/batch-01-notification.service.ts

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { Collection, ObjectId } from 'mongodb';
import * as nodemailer from 'nodemailer';

import { Batch01DatabaseService } from '../database/batch-01-database.service';
import { PaymentReceiptsService } from '../../../payment-receipts/payment-receipts.service';
import { BATCH_01_COURSE_ID } from '../config/batch-01.defaults';

type Channel = 'email' | 'sms';

type DeliveryStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed';

export interface Batch01Record {
  _id: ObjectId;
  registrationId: string;
  courseId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  status: string;
  amount: number;
  originalAmount: number;
  pricingType: string;
  invoiceNumber?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  confirmedAt?: Date;
  notifications: {
    email: DeliveryStatus;
    sms: DeliveryStatus;
  };
}

@Injectable()
export class Batch01NotificationService {
  private readonly logger = new Logger(
    Batch01NotificationService.name,
  );

  private get registrations(): Collection<Batch01Record> {
    return this.databaseService
      .getDb()
      .collection<Batch01Record>('batch_01_registrations');
  }

  constructor(
    private readonly databaseService: Batch01DatabaseService,
    private readonly receiptService: PaymentReceiptsService,
  ) {}

  private escapeHtml(value: unknown): string {
    return String(value ?? '').replace(
      /[&<>"']/g,
      (character) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };

        return entities[character];
      },
    );
  }

  private normalizePhone(value: string): string {
    let number = String(value || '').replace(/[^\d+]/g, '');

    if (number.startsWith('+')) {
      number = number.slice(1);
    }

    if (number.startsWith('00880')) {
      number = number.slice(2);
    }

    if (number.startsWith('01') && number.length === 11) {
      number = `88${number}`;
    }

    if (/^1[3-9]\d{8}$/.test(number)) {
      number = `880${number}`;
    }

    if (!/^8801[3-9]\d{8}$/.test(number)) {
      throw new Error('Invalid Bangladesh mobile number');
    }

    return number;
  }

  private getWhatsappGroupUrl(): string | null {
    const value = String(
      process.env.BATCH_01_WHATSAPP_GROUP_URL || '',
    ).trim();

    if (!value) return null;

    try {
      const url = new URL(value);

      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'chat.whatsapp.com'
      ) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  private createTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration is missing');
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  private emailLayout(
    registration: Batch01Record,
  ): string {
    const name = this.escapeHtml(registration.fullName);
    const registrationId = this.escapeHtml(
      registration.registrationId,
    );
    const transactionId = this.escapeHtml(
      registration.transactionId || 'Not available',
    );
    const amount = Number(registration.amount || 0).toLocaleString(
      'en-BD',
    );

    const groupUrl = this.getWhatsappGroupUrl();

    const groupHtml = groupUrl
      ? `
        <div style="background:#ecfdf5;border:2px solid #6ee7b7;border-radius:14px;padding:28px 22px;margin:25px 0;text-align:center;">
          <h3 style="margin:0;color:#064e3b;font-size:19px;">
            Join Your Official Course WhatsApp Group
          </h3>
          <p style="margin:12px 0 22px;color:#065f46;font-size:14px;line-height:24px;">
            Stay connected with course announcements, class updates and the learning community.
          </p>
          <a href="${this.escapeHtml(groupUrl)}"
             target="_blank"
             style="display:inline-block;background:#059669;color:#fff;padding:14px 26px;border-radius:9px;font-weight:700;text-decoration:none;">
            Join WhatsApp Group
          </a>
        </div>
      `
      : `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:25px 0;text-align:center;">
          <h3 style="margin:0 0 8px;color:#334155;">
            Course WhatsApp Group
          </h3>
          <p style="margin:0;color:#64748b;font-size:14px;line-height:23px;">
            Group joining details will be shared separately. Please check your email for future updates.
          </p>
        </div>
      `;

    return `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Enrollment Confirmed - Research Ustad</title>
      </head>
      <body style="margin:0;padding:35px 12px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#263247;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e9f0;">

          <div style="background:#3A5A78;padding:32px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:25px;">
              Registration Confirmed!
            </h1>
            <p style="margin:10px 0 0;color:#e4edf5;font-size:14px;">
              Your payment has been successfully verified.
            </p>
          </div>

          <div style="padding:32px 30px;">

            <p style="font-size:16px;line-height:26px;">
              Dear <strong>${name}</strong>,
            </p>

            <p style="font-size:15px;line-height:25px;color:#4b5563;">
              Congratulations! Your payment has been verified and your enrollment in Research Foundation Course-2026, Batch-01 is now officially confirmed.
            </p>

            <div style="background:#f5f7fc;border-left:4px solid #3A5A78;padding:20px;margin:22px 0;border-radius:5px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;">
                COURSE ENROLLMENT
              </p>
              <h2 style="margin:0;color:#3A5A78;font-size:20px;line-height:28px;">
                Research Foundation Course-2026
              </h2>
              <p style="margin:8px 0 0;color:#526078;font-size:13px;">
                Batch-01
              </p>
            </div>

            <h3 style="color:#17213b;">Registration & Payment Details</h3>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:12px;background:#f8fafc;border-bottom:1px solid #e8edf3;color:#64748b;">
                  Registration ID
                </td>
                <td style="padding:12px;background:#f8fafc;border-bottom:1px solid #e8edf3;font-weight:700;">
                  ${registrationId}
                </td>
              </tr>
              <tr>
                <td style="padding:12px;border-bottom:1px solid #e8edf3;color:#64748b;">
                  Transaction ID
                </td>
                <td style="padding:12px;border-bottom:1px solid #e8edf3;font-weight:600;word-break:break-word;">
                  ${transactionId}
                </td>
              </tr>
              <tr>
                <td style="padding:12px;background:#f8fafc;color:#64748b;">
                  Amount Paid
                </td>
                <td style="padding:12px;background:#f8fafc;color:#15803d;font-weight:700;">
                  BDT ${amount}
                </td>
              </tr>
            </table>

            <h3 style="margin-top:28px;color:#17213b;">
              Course Overview
            </h3>

            <div style="padding:16px 18px;background:#f8fafc;border:1px solid #e8edf3;border-radius:7px;">
              <p style="margin:0;color:#475569;font-size:14px;line-height:25px;">
                <strong>5 Weekly Live Zoom Sessions</strong><br />
                Practical research learning and guided activities<br />
                Course participation certificate<br />
                Top 2 participants may receive the Outstanding Research Learner Award
              </p>
            </div>

            <div style="padding:18px 20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;margin-top:24px;">
              <h3 style="margin:0 0 8px;color:#1e40af;font-size:15px;">
                Class Schedule & Orientation
              </h3>
              <p style="margin:0;color:#334155;font-size:14px;line-height:24px;">
                Zoom session dates, orientation details and class instructions will be shared with registered participants through official Research Ustad communication channels.
              </p>
            </div>

            ${groupHtml}

            <p style="margin-top:24px;color:#526078;font-size:14px;line-height:24px;">
              Please keep this email and the attached payment receipt for your records.
            </p>

            <div style="margin-top:30px;padding-top:22px;border-top:1px solid #e8edf3;">
              <p style="margin:0 0 12px;color:#334155;">Regards,</p>
              <p style="font-size:17px;font-weight:700;color:#17213b;">
                Research Ustad Team
              </p>
              <p style="font-size:13px;line-height:22px;color:#555;">
                Website:
                <a href="https://researchustad.org">Research Ustad</a><br />
                Email:
                <a href="mailto:workshop@researchustad.org">workshop@researchustad.org</a>
              </p>
            </div>
          </div>

          <div style="padding:18px 25px;background:#f8fafc;text-align:center;border-top:1px solid #e8edf3;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} Research Ustad. All rights reserved.
            </p>
            <p style="margin:5px 0 0;color:#94a3b8;font-size:11px;">
              Empowering Research, Inspiring Excellence.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async sendEmail(registration: Batch01Record) {
    const transporter = this.createTransporter();

    // Reuse the existing Research Ustad payment receipt PDF generator.
    const receiptPdf = await this.receiptService.generatePdf({
      ...registration,
      courseName: 'Research Foundation Course-2026',
      batchName: 'Batch-01',
    } as any);

    await transporter.sendMail({
      from: `"Research Ustad" <${process.env.SMTP_USER}>`,
      to: registration.email,
      subject:
        'Research Foundation Course-2026, Batch-01 Registration Confirmed — Research Ustad',
      html: this.emailLayout(registration),
      attachments: [
        {
          filename: `Research-Ustad-Receipt-${registration.registrationId}.pdf`,
          content: receiptPdf,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private async sendSms(registration: Batch01Record) {
    const key = process.env.ZENDSMS_API_KEY;
    const sender = process.env.ZENDSMS_SENDER_ID;

    if (!key || !sender) {
      throw new Error('ZendSMS configuration is missing');
    }

    const phone = this.normalizePhone(registration.whatsapp);

    const message =
      `Dear ${registration.fullName},\n` +
      `Congratulations! Your registration for Research Foundation Course-2026, Batch-01 has been successfully confirmed.\n` +
      `Registration ID: ${registration.registrationId}\n` +
      `Payment Received: BDT ${Number(registration.amount).toLocaleString('en-BD')}\n` +
      `Please check your email for enrollment details and further instructions.\n` +
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
          client_ref: `ru-batch01-${registration.registrationId}`,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success !== true) {
      throw new Error(
        payload?.message || 'ZendSMS did not accept the message',
      );
    }
  }

  async dispatch(
    registration: Batch01Record,
    channel: Channel,
  ) {
    // Claim pending/failed notifications atomically.
    const claim = await this.registrations.updateOne(
      {
        _id: registration._id,
        courseId: BATCH_01_COURSE_ID,
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
    );

    if (claim.modifiedCount !== 1) return;

    try {
      if (channel === 'email') {
        await this.sendEmail(registration);
      } else {
        await this.sendSms(registration);
      }

      await this.registrations.updateOne(
        { _id: registration._id },
        {
          $set: {
            [`notifications.${channel}`]: 'sent',
            [`notifications.${channel}At`]: new Date(),
          },
          $unset: {
            [`notifications.${channel}Error`]: '',
          },
        },
      );
    } catch (error: any) {
      const reason = String(
        error?.message || 'Notification failed',
      ).slice(0, 300);

      this.logger.error(
        `${channel.toUpperCase()} failed for ${registration.registrationId}: ${reason}`,
      );

      await this.registrations.updateOne(
        { _id: registration._id },
        {
          $set: {
            [`notifications.${channel}`]: 'failed',
            [`notifications.${channel}Error`]: reason,
          },
        },
      );
    }
  }

  async dispatchAll(registration: Batch01Record) {
    await Promise.allSettled([
      this.dispatch(registration, 'email'),
      this.dispatch(registration, 'sms'),
    ]);
  }

  
  /**
   * Send or resend payment receipt email.
   * Used by Batch01AdminService.
   */
  async sendPaymentReceipt(
    registration: Batch01Record,
    force = false,
  ) {
    if (!registration.email) {
      throw new Error('Participant email is missing');
    }

    if (!['paid', 'confirmed'].includes(registration.status)) {
      throw new Error('Payment receipt is available only for paid registrations');
    }

    if (!force && registration.status !== 'confirmed') {
      throw new Error('Registration must be confirmed');
    }

    try {
      await this.sendEmail(registration);

      await this.registrations.updateOne(
        { _id: registration._id },
        {
          $set: {
            'notifications.email': 'sent',
            'notifications.emailAt': new Date(),
          },
          $unset: {
            'notifications.emailError': '',
          },
        },
      );
    } catch (error: any) {
      const reason = String(
        error?.message || 'Payment receipt email failed',
      ).slice(0, 300);

      this.logger.error(
        `Payment receipt email failed: ${reason}`,
      );

      await this.registrations.updateOne(
        { _id: registration._id },
        {
          $set: {
            'notifications.email': 'failed',
            'notifications.emailError': reason,
          },
        },
      );

      throw error;
    }
  }

  /**
   * Send or resend enrollment confirmation email.
   * Used by Batch01AdminService.
   */
  async sendEnrollmentConfirmation(
    registration: Batch01Record,
    force = false,
  ) {
    if (!registration.email) {
      throw new Error('Participant email is missing');
    }

    if (registration.status !== 'confirmed') {
      throw new Error('Registration is not confirmed');
    }

    if (!force && registration.status !== 'confirmed') {
      throw new Error('Registration must be confirmed');
    }

    await this.sendPaymentReceipt(registration, true);
  }


  async resendById(
    registrationId: string,
    channel: Channel,
  ) {
    const registration = await this.registrations.findOne({
      registrationId,
      courseId: BATCH_01_COURSE_ID,
      status: 'confirmed',
    });

    if (!registration) {
      throw new Error(
        'Confirmed Batch-01 registration not found',
      );
    }

    await this.registrations.updateOne(
      { _id: registration._id },
      {
        $set: {
          [`notifications.${channel}`]: 'pending',
        },
      },
    );

    await this.dispatch(registration, channel);

    return this.registrations.findOne(
      { _id: registration._id },
      {
        projection: { accessHash: 0 },
      },
    );
  }
}