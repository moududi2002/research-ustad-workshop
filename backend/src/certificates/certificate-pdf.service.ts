import { Injectable, InternalServerErrorException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import puppeteer, { Browser } from 'puppeteer-core';
import * as QRCode from 'qrcode';
import { Certificate } from './certificate.entity';

function escapeHtml(v: string | null | undefined) {
  return String(v ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[s]!);
}

@Injectable()
export class CertificatePdfService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private starting: Promise<Browser> | null = null;
  constructor(private readonly config: ConfigService) {}

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) return this.browser;
    if (!this.starting) {
      this.starting = puppeteer.launch({
        executablePath: this.config.get<string>('CHROME_PATH', '/usr/bin/chromium'),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }).then(b => {
        this.browser = b;
        return b;
      }).finally(() => { this.starting = null; });
    }
    return this.starting;
  }

  private async asset(name: string): Promise<string> {
    // Run backend from its directory, and copy images from frontend/public/images.
    const assetPath = join(process.cwd(), 'assets', 'certificate', name);
    try {
      const buffer = await fs.readFile(assetPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch {
      throw new InternalServerErrorException(
        `Missing certificate asset ${name}; run scripts/copy-certificate-assets.sh from repo root`,
      );
    }
  }

  async render(cert: Certificate): Promise<Buffer> {
    const base = this.config.get<string>('CERT_PUBLIC_BASE_URL', 'https://workshop.researchustad.org').replace(/\/$/, '');
    const verificationUrl = `${base}/certificate/verify/${encodeURIComponent(cert.certificateId)}`;
    const qrCode = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H', margin: 1, width: 210 });
    const [logo, sign] = await Promise.all([this.asset('logo.png'), this.asset('sign.png')]);
    const eventDate = new Date(`${cert.workshopDate}T12:00:00Z`).toLocaleDateString('en-GB', {
      timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
    });
    const issueDate = new Date(cert.createdAt).toLocaleDateString('en-GB', {
      timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
    });

    // Same visual structure as existing Certificate.tsx:
    // top-left RU logo, top-right QR, ID, name, workshop, signature, issue date.
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
      <style>
        *{box-sizing:border-box} html,body{margin:0;padding:0;background:white}
        body{font-family:Arial,Helvetica,sans-serif;color:#23262f}
        .certificate{width:680px;height:615px;padding:37px 43px;display:flex;flex-direction:column;background:white}
        .top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eceef2;padding-bottom:20px;min-height:92px}
        .brand{display:flex;align-items:center;gap:15px}
        .logo{width:67px;height:67px;object-fit:contain}
        .brand-name{font-weight:700;font-size:20px;color:#23262f;margin-bottom:5px}
        .sub{color:#8793aa;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.6px}
        .qr{text-align:center;display:flex;flex-direction:column;align-items:center}
        .qr img{width:68px;height:68px}.qr span{color:#8793aa;font-weight:700;font-size:8px;letter-spacing:1px;text-transform:uppercase}
        .main{flex:1;display:flex;flex-direction:column;position:relative;padding-top:29px}
        .id-label{font-size:10px;text-transform:uppercase;letter-spacing:1.4px;color:#8793aa;font-weight:700}
        .id{font-family:monospace;font-size:12px;font-weight:700;color:#444c60;margin-top:7px}
        .content{text-align:center;margin:auto 0;line-height:1.7;padding:12px 0 34px}
        .presented{font-size:12px;color:#8793aa;text-transform:uppercase;letter-spacing:1.7px}
        .participant{font-size:31px;line-height:1.4;font-weight:800;overflow-wrap:anywhere;margin-top:11px;color:#23262f}
        .awarded{font-size:13px;color:#68758f;margin-top:12px}
        .workshop{font-size:16px;font-weight:700;color:#444c60;line-height:1.5;margin-top:3px}
        .date-line{margin-top:5px;font-size:13px;color:#68758f}
        .bottom{min-height:111px;padding-top:17px;border-top:1px solid #eceef2;display:flex;align-items:flex-end;justify-content:space-between}
        .signature{width:153px}.signature img{width:136px;height:48px;object-fit:contain;object-position:left bottom}
        .rule{height:1px;background:#b1b9c9;width:130px;margin:5px 0}
        .signature span{color:#8793aa;font-size:11px;line-height:1.5}
        .signature b{color:#444c60;font-weight:700}
        .badge{display:flex;align-items:center;justify-content:center;width:57px;height:57px;border:2px dashed #8eb6ff;border-radius:50%;color:#1f47f5;font-size:27px}
        .issue{text-align:right;font-size:12px;color:#8793aa}
        .issue strong{display:block;font-size:14px;color:#444c60;margin-bottom:8px}
        .issue .rule{margin:0 0 7px auto}
      </style></head><body>
      <section class="certificate">
        <header class="top">
          <div class="brand"><img class="logo" src="${logo}" /><div><div class="brand-name">Research Ustad</div><div class="sub">Certificate of Completion</div></div></div>
          <div class="qr"><img src="${qrCode}"/><span>Scan to Verify</span></div>
        </header>
        <div class="main">
          <div class="id-label">Certificate ID</div><div class="id">${escapeHtml(cert.certificateId)}</div>
          <div class="content">
            <div class="presented">This certificate is proudly presented to</div>
            <div class="participant">${escapeHtml(cert.fullName)}</div>
            <div class="awarded">for successfully completing the</div>
            <div class="workshop">${escapeHtml(cert.workshopName)}</div>
            <div class="date-line">held on ${escapeHtml(eventDate)}</div>
          </div>
        </div>
        <footer class="bottom">
          <div class="signature"><img src="${sign}" /><div class="rule"></div><span><b>Anichur Rahman</b><br/>Founder &amp; CEO</span></div>
          <div class="badge">★</div>
          <div class="issue"><strong>${escapeHtml(issueDate)}</strong><div class="rule"></div><div class="sub">Issue Date</div></div>
        </footer>
      </section></body></html>`;

    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        width: '680px', height: '615px', printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
        pageRanges: '1',
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }
}
