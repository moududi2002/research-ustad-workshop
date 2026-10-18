import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomBytes, randomInt } from 'crypto';
import { Registration } from '../registrations/registration.entity';
import { Certificate } from './certificate.entity';
import { CertificateEmailLog } from './certificate-email-log.entity';
import { AttendanceSourceService } from './attendance-source.service';
import { CustomCertificateDto } from './dto/issue-certificates.dto';


function maskEmail(email: string): string {
  const [local, domain] = (email || '').split('@');
  if (!local || !domain) return 'Not available';
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}***@${domain}`;
}
function maskPhone(phone: string | null): string {
  if (!phone) return 'Not provided';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7
    ? `${digits.slice(0, 3)}${'*'.repeat(Math.max(3, digits.length - 6))}${digits.slice(-3)}`
    : '***';
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Registration) private readonly registrations: Repository<Registration>,
    @InjectRepository(Certificate) private readonly certs: Repository<Certificate>,
    @InjectRepository(CertificateEmailLog) private readonly logs: Repository<CertificateEmailLog>,
    private readonly attendance: AttendanceSourceService,
    private readonly config: ConfigService,
  ) {}

  private workshop() {
    const workshopCode = this.config.get<string>('CERT_WORKSHOP_CODE', 'W01-26');
    const workshopName = this.config.get<string>(
      'CERT_WORKSHOP_NAME', 'Research to Higher Study Workshop',
    );
    const workshopDate = this.config.get<string>('CERT_WORKSHOP_DATE', '2026-10-17');
    if (!/^[A-Z0-9-]{3,30}$/.test(workshopCode)) {
      throw new BadRequestException('CERT_WORKSHOP_CODE must contain only A-Z, 0-9, hyphen');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workshopDate)) {
      throw new BadRequestException('Invalid CERT_WORKSHOP_DATE');
    }
    return { workshopCode, workshopName, workshopDate };
  }

  private async registrationsByIds(ids: string[]): Promise<Map<string, Registration>> {
    const all: Registration[] = [];
    for (let i = 0; i < ids.length; i += 300) {
      all.push(...await this.registrations.find({
        where: { registrationId: In(ids.slice(i, i + 300)) },
      }));
    }
    return new Map(all.map(r => [r.registrationId, r]));
  }

  async listAttendees() {
    const ids = await this.attendance.getAttendedRegistrationIds();
    const byId = await this.registrationsByIds(ids);
    const attendees = ids.filter(id => byId.has(id)).map(id => {
      const r = byId.get(id)!;
      return {
        registrationId: r.registrationId,
        fullName: r.fullName,
        email: r.email,
        department: r.department ?? '',
        universityName: r.universityName,
      };
    });
    return {
      attendees,
      mongoAttended: ids.length,
      matched: attendees.length,
      missingRegistrationIds: ids.filter(id => !byId.has(id)),
    };
  }

  async issueRegistered(requestedIds: string[], issuedBy: string | null) {
    const ids = [...new Set(requestedIds.map(s => s.trim()).filter(Boolean))];
    if (!ids.length || ids.length > 500) {
      throw new BadRequestException('Provide between 1 and 500 registration IDs per request');
    }
    // Do not trust the browser: eligibility is verified again against MongoDB.
    const allowed = new Set(await this.attendance.getAttendedRegistrationIds());
    const eligibleIds = ids.filter(id => allowed.has(id));
    const notAttendedIds = ids.filter(id => !allowed.has(id));
    const byId = await this.registrationsByIds(eligibleIds);
    const missingRegistrationIds = eligibleIds.filter(id => !byId.has(id));
    const workshop = this.workshop();
    const existing = await this.certs.find({
      where: {
        workshopCode: workshop.workshopCode,
        registrationId: In(eligibleIds.length ? eligibleIds : ['---none---']),
      },
    });
    const existingIds = new Set(existing.map(cert => cert.registrationId));
    let created = 0;
    let alreadyIssued = 0;

    for (const registrationId of eligibleIds) {
      const r = byId.get(registrationId);
      if (!r) continue;
      if (existingIds.has(registrationId)) { alreadyIssued++; continue; }
      const certificate = this.certs.create({
        certificateId: `RU-${workshop.workshopCode}-${Array.from(
            { length: 6 },
            () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[
              randomInt(32)
            ]
          ).join('')}`,
        registrationId: r.registrationId,
        source: 'registered',
        // IMPORTANT: identity fields must come exclusively from MySQL.
        fullName: r.fullName.trim(), email: r.email.trim(), whatsapp: r.whatsapp,
        department: r.department ?? null, universityName: r.universityName,
        ...workshop,
        certificateStatus: 'issued', emailStatus: 'queued',
        emailError: null, sentAt: null, processingStartedAt: null,
        sendAttempts: 0, issuedBy,
      });
      try {
        await this.certs.manager.transaction(async manager => {
          await manager.getRepository(Certificate).save(certificate);
          await manager.getRepository(Registration).update({ id: r.id }, { certificateIssued: true });
        });
        created++;
      } catch (err: any) {
        // Concurrent issue requests may hit the unique workshop+registration index.
        // Only treat actual duplicate-key errors as already-issued.
        if (err?.code === 'ER_DUP_ENTRY' || err?.driverError?.code === 'ER_DUP_ENTRY') {
          alreadyIssued++;
        } else throw err;
      }
    }
    return {
      requested: ids.length, eligible: eligibleIds.length,
      created, alreadyIssued, notAttendedIds, missingRegistrationIds,
      message: 'Certificates queued. The email worker will attach PDFs and deliver them.',
    };
  }

  async issueAll(issuedBy: string | null) {
    const ids = await this.attendance.getAttendedRegistrationIds();
    const summary = {
      requested: ids.length, eligible: 0, created: 0, alreadyIssued: 0,
      notAttendedIds: [] as string[], missingRegistrationIds: [] as string[],
      message: 'All matched attendees have been queued.',
    };
    for (let i = 0; i < ids.length; i += 500) {
      const result = await this.issueRegistered(ids.slice(i, i + 500), issuedBy);
      summary.eligible += result.eligible;
      summary.created += result.created;
      summary.alreadyIssued += result.alreadyIssued;
      summary.missingRegistrationIds.push(...result.missingRegistrationIds);
    }
    return summary;
  }

  async issueCustom(dto: CustomCertificateDto, issuedBy: string | null) {
    const workshop = this.workshop();
    const email = dto.email.toLowerCase().trim();
    const cert = this.certs.create({
      certificateId: `RU-${workshop.workshopCode}-${Array.from(
      { length: 6 },
      () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[
        randomInt(32)
      ]
      ).join('')}`,
      registrationId: null, source: 'custom',
      fullName: dto.fullName.trim(), email,
      whatsapp: dto.whatsapp?.trim() || null,
      department: dto.department?.trim() || null,
      universityName: dto.universityName?.trim() || null,
      ...workshop,
      certificateStatus: 'issued', emailStatus: 'queued',
      emailError: null, sentAt: null, processingStartedAt: null,
      sendAttempts: 0, issuedBy,
    });
    return this.certs.save(cert);
  }

  async listRecords(take = 200) {
    return this.certs.find({ order: { createdAt: 'DESC' }, take });
  }

  async findById(id: string) {
    const cert = await this.certs.findOne({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async retry(id: string) {
    const cert = await this.findById(id);
    if (cert.certificateStatus === 'revoked') throw new BadRequestException('Cannot send a revoked certificate');
    if (cert.emailStatus === 'sent') throw new ConflictException('Already sent; no retry required');
    if (cert.emailStatus === 'sending') throw new ConflictException('Email is currently being sent');
    cert.emailStatus = 'queued';
    cert.emailError = null;
    return this.certs.save(cert);
  }

  async revoke(id: string) {
    const cert = await this.findById(id);
    cert.certificateStatus = 'revoked';
    if (cert.emailStatus === 'queued' || cert.emailStatus === 'failed') {
      cert.emailStatus = 'failed';
      cert.emailError = 'Certificate revoked before delivery';
    }
    return this.certs.save(cert);
  }

  async emailLogs(id: string) {
    const cert = await this.findById(id);
    return this.logs.find({ where: { certificateId: cert.certificateId }, order: { createdAt: 'DESC' } });
  }

  async verify(certificateId: string) {
    const cert = await this.certs.findOne({ where: { certificateId } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return {
      verified: cert.certificateStatus === 'issued',
      status: cert.certificateStatus,
      certificateId: cert.certificateId,
      participantName: cert.fullName,
      workshopName: cert.workshopName,
      workshopDate: cert.workshopDate,
      maskedEmail: maskEmail(cert.email),
      maskedPhone: maskPhone(cert.whatsapp),
      issuedAt: cert.createdAt,
    };
  }
}
