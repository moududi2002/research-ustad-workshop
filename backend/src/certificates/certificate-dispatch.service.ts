import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';
import { Repository, LessThan } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Certificate } from './certificate.entity';
import { CertificateEmailLog } from './certificate-email-log.entity';
import { CertificatePdfService } from './certificate-pdf.service';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';



function safe(v: string | null | undefined): string {
  return String(v || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]!);
}

@Injectable()
export class CertificateDispatchService {
  private readonly logger = new Logger(CertificateDispatchService.name);
  private busy = false;
  constructor(
    @InjectRepository(Certificate) private readonly certs: Repository<Certificate>,
    @InjectRepository(CertificateEmailLog) private readonly logs: Repository<CertificateEmailLog>,
    private readonly pdf: CertificatePdfService,
    private readonly config: ConfigService,
  ) {}

  @Interval(10000)
  async processQueue() {
    if (this.busy) return;
    this.busy = true;
    try {
      // Reclaim records stuck by a stopped worker. SMTP is at-least-once; see README.
      const expired = new Date(Date.now() - 10 * 60 * 1000);
      await this.certs.update({
        emailStatus: 'sending', processingStartedAt: LessThan(expired),
      }, { emailStatus: 'queued', processingStartedAt: null });

      const batch = await this.certs.find({
        where: { certificateStatus: 'issued', emailStatus: 'queued' },
        order: { createdAt: 'ASC' }, take: 25,
      });
      for (const cert of batch) await this.deliver(cert);
    } catch (e: any) {
      this.logger.error(`Certificate queue error: ${e.message}`, e.stack);
    } finally {
      this.busy = false;
    }
  }

  private async deliver(cert: Certificate) {
    // Atomic claim prevents duplicate workers sending the same queued row.
    const claim = await this.certs.createQueryBuilder()
      .update(Certificate)
      .set({
        emailStatus: 'sending', processingStartedAt: new Date(),
        sendAttempts: () => 'send_attempts + 1',
      })
      .where('id = :id AND email_status = :queued AND certificate_status = :issued', {
        id: cert.id, queued: 'queued', issued: 'issued',
      }).execute();
    if (!claim.affected) return;

    try {
      const pdf = await this.pdf.render(cert);
      const port = Number(this.config.get<string>('SMTP_PORT', '465'));
      const host = this.config.get<string>('SMTP_HOST');
      const username = this.config.get<string>('SMTP_USER');
      const password = this.config.get<string>('SMTP_PASS');

      if (!host || !username || !password) {
        throw new Error('Missing SMTP configuration');
      }

      const smtpOptions: SMTPTransport.Options = {
        host,
        port,
        secure: port === 465,
        auth: {
          user: username,
          pass: password,
        },
      };

      const transporter = nodemailer.createTransport(smtpOptions);
      const baseUrl = this.config.get<string>('CERT_PUBLIC_BASE_URL', 'https://workshop.researchustad.org').replace(/\/$/, '');
      const verifyUrl = `${baseUrl}/certificate/verify/${encodeURIComponent(cert.certificateId)}`;
      const department = cert.department?.trim() || 'Not specified';
      const institute = cert.universityName?.trim() || 'Not specified';
      await transporter.sendMail({
        from: `"Research Ustad" <${this.config.get<string>('CERT_FROM_EMAIL') || username}>`,
        to: cert.email,
        subject: `Your Certificate of Completion — ${cert.workshopName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#273244;font-size:15px;line-height:1.7">
            <h2 style="color:#1f47f5">Your Research Ustad Certificate</h2>
            <p>Dear <strong>${safe(cert.fullName)}</strong>,</p>
            <p>Congratulations on completing <strong>${safe(cert.workshopName)}</strong>!
               Your certificate is attached to this email as a PDF.</p>
            <div style="background:#f6f7fb;border:1px solid #e5e7eb;border-radius:12px;padding:18px">
              <p><strong>Name:</strong> ${safe(cert.fullName)}</p>
              <p><strong>Institute / University:</strong> ${safe(institute)}</p>
              <p><strong>Department:</strong> ${safe(department)}</p>
              <p><strong>Certificate ID:</strong> ${safe(cert.certificateId)}</p>
              <p><strong>Workshop:</strong> ${safe(cert.workshopName)}</p>
              <p><strong>Date:</strong> ${safe(cert.workshopDate)}</p>
            </div>
            <p>Certificate verification: <a href="${safe(verifyUrl)}">${safe(verifyUrl)}</a></p>
            <div>
              <p style="margin-top: 30px;">
                Regards,
                <br>
                <br>
                <img src="https://www.researchustad.org/logo.png" alt="Research Ustad" style="width: 101px; height: 101px; display: block; margin-bottom: 10px;" width="101" height="101">
                <b style="font-size: 16px; color: #222;">Research Ustad Team</b>
                <br>
                <br>
                <span style="color: rgb(85, 85, 85);">
                  <span class="size" style="font-size:14px">
                    <b>Contact:</b>
                    <a href="https://www.researchustad.org" style="color: #1f47f5; text-decoration: none;">Research Ustad</a>
                  </span>
                </span>
                <br>
                <span style="color: rgb(85, 85, 85);">
                  <span class="size" style="font-size:14px">
                    <b>WhatsApp:</b>
                    <a href="https://wa.me/8801724653054" style="color: #25D366; text-decoration: none;">+880 1724-653054</a>
                  </span>
                </span>
                <br>
                <span style="color: rgb(85, 85, 85);">
                  <span class="size" style="font-size:14px">
                    <b>Email:</b>
                    <a href="mailto:info@researchustad.org" style="color: #1f47f5; text-decoration: none;">info@researchustad.org</a>
                  </span>
                </span>
              </p>
            </div>

          </div>`,
        attachments: [{ filename: `${cert.certificateId}.pdf`, content: pdf, contentType: 'application/pdf' }],
      });
      await this.certs.update(cert.id, {
        emailStatus: 'sent', sentAt: new Date(), emailError: null, processingStartedAt: null,
      });
      await this.logs.save(this.logs.create({ certificateId: cert.certificateId, email: cert.email, status: 'sent', error: null }));
    } catch (err: any) {
      const error = String(err?.message || err).slice(0, 2000);
      this.logger.error(`Sending ${cert.certificateId} failed: ${error}`);
      await this.certs.update(cert.id, { emailStatus: 'failed', emailError: error, processingStartedAt: null });
      await this.logs.save(this.logs.create({ certificateId: cert.certificateId, email: cert.email, status: 'failed', error }));
    }
  }
}
