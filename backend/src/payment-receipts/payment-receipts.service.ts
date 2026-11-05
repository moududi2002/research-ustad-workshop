import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, MongoClient } from 'mongodb';
import * as puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { join } from 'path';

interface PaymentReceiptRecord {
  registrationId: string;
  courseId: string;
  fullName: string;
  email: string;
  amount: number;
  originalAmount?: number;
  status: string;
  invoiceNumber?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: Date | string;
  confirmedAt?: Date | string;
  updatedAt?: Date | string;
}

@Injectable()
export class PaymentReceiptsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PaymentReceiptsService.name);

  private mongoClient: MongoClient;
  private registrations: Collection<PaymentReceiptRecord>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const mongoUri = this.configService.get<string>('COURSE_MONGODB_URI');

    if (!mongoUri) {
      throw new ServiceUnavailableException(
        'COURSE_MONGODB_URI is not configured',
      );
    }

    const databaseName =
      this.configService.get<string>('COURSE_MONGODB_DATABASE') ||
      'research_ustad_courses';

    this.mongoClient = new MongoClient(mongoUri, {
      maxPoolSize: 3,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
    });

    await this.mongoClient.connect();

    this.registrations = this.mongoClient
      .db(databaseName)
      .collection<PaymentReceiptRecord>('course_registrations');

    this.logger.log('Payment receipt service connected to MongoDB');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.mongoClient) {
      await this.mongoClient.close();
      this.logger.log('Payment receipt MongoDB connection closed');
    }
  }

  /**
   * Generates a PDF receipt from an already-loaded registration.
   * Used by the course confirmation email workflow.
   */
  async generatePdf(registration: PaymentReceiptRecord): Promise<Buffer> {
    this.assertConfirmed(registration);

    const html = this.buildReceiptHtml(registration);
    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Finds a confirmed registration and generates its receipt.
   * Used by the admin PDF download endpoint.
   */
  async generateByRegistrationId(
    registrationId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (!/^[A-Z0-9-]{4,64}$/i.test(registrationId)) {
      throw new NotFoundException('Invalid registration ID');
    }

    if (!this.registrations) {
      throw new ServiceUnavailableException(
        'Payment receipt database is not ready',
      );
    }

    const registration = await this.registrations.findOne({
      registrationId,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    this.assertConfirmed(registration);

    const buffer = await this.generatePdf(registration);

    return {
      buffer,
      filename: `Research-Ustad-Receipt-${registration.registrationId}.pdf`,
    };
  }

  private assertConfirmed(registration: PaymentReceiptRecord): void {
    if (registration.status !== 'confirmed') {
      throw new NotFoundException(
        'Receipt is available only for confirmed registrations',
      );
    }
  }

  private async launchBrowser(): Promise<puppeteer.Browser> {
    const executablePath =
      this.configService.get<string>('CHROME_PATH') ||
      '/usr/bin/chromium';

    try {
      return await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    } catch (error) {
      this.logger.error(
        'Unable to launch Chromium for payment receipt PDF',
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        'PDF generation service is currently unavailable',
      );
    }
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatDate(value?: Date | string): string {
    if (!value) return 'Not available';

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dhaka',
    }).format(date);
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  }

  private buildReceiptHtml(registration: PaymentReceiptRecord): string {
    const logoPath = join(
      process.cwd(),
      'assets',
      'certificate',
      'logo.png',
    );

    let logoDataUri = '';

    try {
      const logo = readFileSync(logoPath);
      logoDataUri = `data:image/png;base64,${logo.toString('base64')}`;
    } catch (error) {
      this.logger.error(
        `Unable to read Research Ustad logo: ${logoPath}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    const receiptNumber = `RU-REC-${registration.registrationId}`;
    const paymentDate = this.formatDate(registration.paidAt);
    const issueDate = this.formatDate(new Date());

    const fullName = this.escapeHtml(registration.fullName);
    const email = this.escapeHtml(registration.email);
    const registrationId = this.escapeHtml(registration.registrationId);
    const courseId = this.escapeHtml(registration.courseId);
    const invoiceNumber = this.escapeHtml(
      registration.invoiceNumber || 'Not available',
    );
    const transactionId = this.escapeHtml(
      registration.transactionId || 'Not available',
    );
    const paymentMethod = this.escapeHtml(
      registration.paymentMethod || 'PayStation',
    );
    const amount = this.formatAmount(registration.amount);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt - Research Ustad</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1f2937;
      font-family: Arial, Helvetica, sans-serif;
    }

    .receipt {
      width: 100%;
      border: 1px solid #e5e7eb;
      padding: 35px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 22px;
      border-bottom: 3px solid #173b68;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .logo {
      width: 65px;
      height: 65px;
      object-fit: contain;
    }

    .brand-name {
      color: #173b68;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .brand-subtitle {
      margin-top: 5px;
      color: #64748b;
      font-size: 10px;
      letter-spacing: 1.5px;
    }

    .receipt-label {
      text-align: right;
    }

    .receipt-label h1 {
      margin: 0;
      color: #173b68;
      font-size: 23px;
      letter-spacing: 1px;
    }

    .receipt-label p {
      margin: 7px 0 0;
      color: #64748b;
      font-size: 11px;
    }

    .status {
      display: inline-block;
      margin-top: 25px;
      padding: 8px 18px;
      border: 1px solid #15803d;
      border-radius: 4px;
      color: #15803d;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .section {
      margin-top: 28px;
    }

    .section-title {
      margin: 0 0 13px;
      color: #173b68;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td {
      padding: 11px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      vertical-align: top;
    }

    td:first-child {
      width: 38%;
      color: #64748b;
    }

    td:last-child {
      color: #1f2937;
      font-weight: 600;
      word-break: break-word;
    }

    .amount-box {
      margin-top: 28px;
      padding: 20px;
      background: #f1f5f9;
      border-left: 4px solid #173b68;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .amount-label {
      color: #475569;
      font-size: 13px;
      font-weight: 600;
    }

    .amount-value {
      color: #173b68;
      font-size: 24px;
      font-weight: 800;
    }

    .footer {
      margin-top: 40px;
      padding-top: 18px;
      border-top: 1px solid #e5e7eb;
      color: #64748b;
      font-size: 10px;
      line-height: 1.7;
      text-align: center;
    }

    .footer strong {
      color: #173b68;
    }

    .note {
      margin-top: 22px;
      color: #64748b;
      font-size: 10px;
      line-height: 1.6;
    }
  </style>
</head>

<body>
  <main class="receipt">

    <header class="header">
      <div class="brand">
        ${
          logoDataUri
            ? `<img class="logo" src="${logoDataUri}" alt="Research Ustad Logo" />`
            : ''
        }

        <div>
          <div class="brand-name">RESEARCH USTAD</div>
          <div class="brand-subtitle">RESEARCH • EDUCATION • DEVELOPMENT</div>
        </div>
      </div>

      <div class="receipt-label">
        <h1>PAYMENT RECEIPT</h1>
        <p>${receiptNumber}</p>
      </div>
    </header>

    <div style="text-align: right;">
      <span class="status">PAYMENT CONFIRMED</span>
    </div>

    <section class="section">
      <h2 class="section-title">Participant Information</h2>

      <table>
        <tr>
          <td>Participant Name</td>
          <td>${fullName}</td>
        </tr>
        <tr>
          <td>Email Address</td>
          <td>${email}</td>
        </tr>
        <tr>
          <td>Registration ID</td>
          <td>${registrationId}</td>
        </tr>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title">Course Information</h2>

      <table>
        <tr>
          <td>Course / Batch ID</td>
          <td>${courseId}</td>
        </tr>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title">Payment Information</h2>

      <table>
        <tr>
          <td>Payment Provider</td>
          <td>${paymentMethod}</td>
        </tr>
        <tr>
          <td>Invoice Number</td>
          <td>${invoiceNumber}</td>
        </tr>
        <tr>
          <td>Transaction ID</td>
          <td>${transactionId}</td>
        </tr>
        <tr>
          <td>Payment Date</td>
          <td>${paymentDate}</td>
        </tr>
        <tr>
          <td>Receipt Issue Date</td>
          <td>${issueDate}</td>
        </tr>
      </table>
    </section>

    <div class="amount-box">
      <div class="amount-label">Total Amount Paid</div>
      <div class="amount-value">BDT ${amount}</div>
    </div>

    <p class="note">
      This document acknowledges the payment recorded by Research Ustad
      for the above registration. Please retain this receipt for your records.
      This is a payment acknowledgement and not a VAT/Mushak tax invoice.
    </p>

    <footer class="footer">
      <strong>RESEARCH USTAD</strong><br />
      Website: researchustad.org<br />
      This is a computer-generated receipt and does not require a signature.
    </footer>

  </main>
</body>
</html>`;
  }
}