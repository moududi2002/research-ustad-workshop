//backend/src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../registrations/registration.entity';
import * as ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>
  ) {}

  async exportCSV(): Promise<string> {
    const registrations = await this.registrationRepo.find({
      order: { createdAt: 'DESC' },
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'registrationId', title: 'Registration ID' },
        { id: 'fullName', title: 'Full Name' },
        { id: 'email', title: 'Email' },
        { id: 'whatsapp', title: 'WhatsApp' },
        { id: 'academicStatus', title: 'Academic Status' },
        { id: 'universityName', title: 'University' },
        { id: 'department', title: 'Department' },
        { id: 'researchLevel', title: 'Research Level' },
        { id: 'higherStudyInterest', title: 'Higher Study Interest' },
        { id: 'preferredCountry', title: 'Preferred Country' },
        { id: 'registrationSource', title: 'Source' },
        {
          id: 'createdAt',
          title: 'Registered At',
        },
      ],
    });

    const records = registrations.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));

    return (
      csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)
    );
  }

  async exportExcel(): Promise<Buffer> {
    const registrations = await this.registrationRepo.find({
      order: { createdAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Registration ID', key: 'registrationId', width: 20 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'WhatsApp', key: 'whatsapp', width: 18 },
      { header: 'Academic Status', key: 'academicStatus', width: 22 },
      { header: 'University', key: 'universityName', width: 28 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Research Level', key: 'researchLevel', width: 20 },
      {
        header: 'Higher Study Interest',
        key: 'higherStudyInterest',
        width: 22,
      },
      { header: 'Preferred Country', key: 'preferredCountry', width: 20 },
      { header: 'Source', key: 'registrationSource', width: 28 },
      { header: 'Registered At', key: 'createdAt', width: 22 },
    ];

    worksheet.getRow(1).font = { bold: true };

    registrations.forEach((r) => {
      worksheet.addRow({
        ...r,
        createdAt: r.createdAt.toISOString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async sendBulkEmail(
    subject: string,
    htmlBody: string
  ): Promise<{ sent: number; failed: number }> {
    const registrations = await this.registrationRepo.find();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const reg of registrations) {
      try {
        await transporter.sendMail({
          from: `"Research Ustad" <${process.env.SMTP_USER}>`,
          to: reg.email,
          subject,
          html: htmlBody,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }

  async sendWorkshopReminder(): Promise<{ sent: number; failed: number }> {
    const subject = 'Reminder: Research Ustad Grand Opening Workshop — 26 Sept 2026';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f47f5;">Workshop Reminder</h2>
        <p>Dear Participant,</p>
        <p>This is a friendly reminder that the <strong>Research Ustad Grand Opening Workshop</strong> is happening on <strong>26 September 2026</strong>.</p>
        <p>Please make sure you join on time. The session will run for approximately 2 hours.</p>
        <p>Looking forward to seeing you there!</p>
        <p>— Team Research Ustad</p>
      </div>
    `;
    return this.sendBulkEmail(subject, html);
  }

  async sendCertificateNotification(): Promise<{ sent: number; failed: number }> {
    const eligible = await this.registrationRepo.find({
      where: { certificateIssued: true },
    });

    const subject = 'Your Certificate of Completion is Ready — Research Ustad';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f47f5;">Your Certificate is Ready 🎓</h2>
        <p>Dear Participant,</p>
        <p>Congratulations! Your digital Certificate of Completion for the Research Ustad Grand Opening Workshop is now available.</p>
        <p>Thank you for being part of this journey.</p>
        <p>— Team Research Ustad</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const reg of eligible) {
      try {
        await transporter.sendMail({
          from: `"Research Ustad" <${process.env.SMTP_USER}>`,
          to: reg.email,
          subject,
          html,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }
}