// path: backend/src/email/email.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Registration } from '../registrations/registration.entity';
import { EmailCampaign } from './email-campaign.entity';
import { EmailGroup } from './email-group.entity';
import { EmailGroupMember } from './email-group-member.entity';
import {
  SendEmailDto,
  PreviewEmailDto,
} from './dto/send-email.dto';
import { FilterParticipantsDto } from './dto/filter-participants.dto';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddMembersDto,
} from './dto/create-group.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(EmailCampaign)
    private readonly campaignRepo: Repository<EmailCampaign>,
    @InjectRepository(EmailGroup)
    private readonly groupRepo: Repository<EmailGroup>,
    @InjectRepository(EmailGroupMember)
    private readonly groupMemberRepo: Repository<EmailGroupMember>,
    private readonly config: ConfigService
  ) {}

  // ---------- Participant Filtering ----------

  async filterParticipants(dto: FilterParticipantsDto) {
    const qb = this.registrationRepo.createQueryBuilder('r');

    if (dto.search) {
      qb.andWhere(
        '(r.fullName LIKE :s OR r.email LIKE :s OR r.universityName LIKE :s)',
        { s: `%${dto.search}%` }
      );
    }
    if (dto.university) {
      qb.andWhere('r.universityName = :u', { u: dto.university });
    }
    if (dto.department) {
      qb.andWhere('r.department = :d', { d: dto.department });
    }
    if (dto.academicStatus) {
      qb.andWhere('r.academicStatus = :a', { a: dto.academicStatus });
    }
    if (dto.researchLevel) {
      qb.andWhere('r.researchLevel = :l', { l: dto.researchLevel });
    }
    if (dto.higherStudyInterest) {
      qb.andWhere('r.higherStudyInterest = :h', {
        h: dto.higherStudyInterest,
      });
    }
    if (dto.registrationSource) {
      qb.andWhere('r.registrationSource = :src', {
        src: dto.registrationSource,
      });
    }
    if (dto.dateFrom) {
      qb.andWhere('r.createdAt >= :df', { df: new Date(dto.dateFrom) });
    }
    if (dto.dateTo) {
      qb.andWhere('r.createdAt <= :dt', { dt: new Date(dto.dateTo) });
    }

    qb.orderBy('r.createdAt', 'DESC');

    return qb.getMany();
  }

  async getFilterOptions() {
    const universities = await this.registrationRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.universityName', 'value')
      .where('r.universityName IS NOT NULL')
      .orderBy('value', 'ASC')
      .getRawMany();

    const departments = await this.registrationRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.department', 'value')
      .where('r.department IS NOT NULL AND r.department != ""')
      .orderBy('value', 'ASC')
      .getRawMany();

    const academicStatuses = await this.registrationRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.academicStatus', 'value')
      .orderBy('value', 'ASC')
      .getRawMany();

    const researchLevels = await this.registrationRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.researchLevel', 'value')
      .orderBy('value', 'ASC')
      .getRawMany();

    const sources = await this.registrationRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.registrationSource', 'value')
      .orderBy('value', 'ASC')
      .getRawMany();

    return {
      universities: universities.map((u) => u.value).filter(Boolean),
      departments: departments.map((d) => d.value).filter(Boolean),
      academicStatuses: academicStatuses.map((a) => a.value).filter(Boolean),
      researchLevels: researchLevels.map((r) => r.value).filter(Boolean),
      registrationSources: sources.map((s) => s.value).filter(Boolean),
    };
  }

  // ---------- Email Preview ----------

  async previewEmail(dto: PreviewEmailDto) {
    let sampleParticipant: Partial<Registration> = {
      fullName: 'Sample Participant',
      email: 'sample@example.com',
      universityName: 'Sample University',
      department: 'Sample Department',
    };

    if (dto.recipientIds && dto.recipientIds.length > 0) {
      const first = await this.registrationRepo.findOne({
        where: { id: dto.recipientIds[0] },
      });
      if (first) sampleParticipant = first;
    }

    const subject = this.personalize(
      dto.subject || '',
      sampleParticipant as Registration
    );
    const bodyHtml = this.personalize(
      dto.bodyHtml || '',
      sampleParticipant as Registration
    );

    return {
      from: 'Research Ustad <no-reply@researchustad.org>',
      to: sampleParticipant.email,
      subject,
      bodyHtml,
    };
  }

  // ---------- Send Email ----------

  async sendEmail(dto: SendEmailDto, senderId: string, senderEmail: string) {
    const recipients = await this.registrationRepo.findBy({
      id: In(dto.recipientIds),
    });

    if (!recipients.length) {
      throw new BadRequestException('No valid recipients found.');
    }

    const campaign = this.campaignRepo.create({
      subject: dto.subject,
      bodyHtml: dto.bodyHtml,
      cc: dto.cc || [],
      bcc: dto.bcc || [],
      recipientEmails: recipients.map((r) => r.email),
      recipientIds: recipients.map((r) => r.id),
      totalRecipients: recipients.length,
      status: 'sending',
      senderId,
      senderEmail,
    });

    await this.campaignRepo.save(campaign);

    // Send asynchronously (fire and forget) — progress tracked on campaign row
    this.sendBatch(campaign.id, recipients, dto, senderEmail).catch((err) => {
      this.logger.error(`Campaign ${campaign.id} failed: ${err.message}`);
    });

    return {
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      status: 'sending',
    };
  }

  async getCampaignProgress(campaignId: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found.');

    return {
      id: campaign.id,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      failures: campaign.failures,
    };
  }

  private async sendBatch(
    campaignId: string,
    recipients: Registration[],
    dto: SendEmailDto,
    senderEmail: string
  ) {
    const transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT')) || 587,
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });

    let sent = 0;
    let failed = 0;
    const failures: { email: string; reason: string }[] = [];

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `"Research Ustad" <${senderEmail}>`,
          to: recipient.email,
          cc: dto.cc && dto.cc.length ? dto.cc.join(',') : undefined,
          bcc: dto.bcc && dto.bcc.length ? dto.bcc.join(',') : undefined,
          subject: this.personalize(dto.subject, recipient),
          html: this.personalize(dto.bodyHtml, recipient),
        });
        sent++;
      } catch (err: any) {
        failed++;
        failures.push({ email: recipient.email, reason: err.message });
      }

      // Update progress after each send
      await this.campaignRepo.update(campaignId, {
        sentCount: sent,
        failedCount: failed,
        failures,
      });
    }

    const finalStatus = failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial';

    await this.campaignRepo.update(campaignId, {
      status: finalStatus,
      sentCount: sent,
      failedCount: failed,
      failures,
    });
  }

  private personalize(template: string, participant: Registration): string {
    if (!template) return '';
    return template
      .replace(/{{\s*name\s*}}/g, participant.fullName || '')
      .replace(/{{\s*email\s*}}/g, participant.email || '')
      .replace(/{{\s*university\s*}}/g, participant.universityName || '')
      .replace(/{{\s*department\s*}}/g, participant.department || '');
  }

  // ---------- Campaign History ----------

  async getCampaignHistory() {
    return this.campaignRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  // ---------- Groups ----------

  async listGroups() {
    const groups = await this.groupRepo.find({
      order: { createdAt: 'DESC' },
    });
    // attach member counts
    const result = await Promise.all(
      groups.map(async (g) => {
        const count = await this.groupMemberRepo.count({
          where: { groupId: g.id },
        });
        return { ...g, memberCount: count };
      })
    );
    return result;
  }

  async getGroup(id: string) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found.');

    const members = await this.groupMemberRepo.find({
      where: { groupId: id },
      relations: ['registration'],
    });

    return {
      ...group,
      members: members.map((m) => ({
        id: m.id,
        registrationId: m.registrationId,
        participant: m.registration
          ? {
              id: m.registration.id,
              fullName: m.registration.fullName,
              email: m.registration.email,
              universityName: m.registration.universityName,
              department: m.registration.department,
              academicStatus: m.registration.academicStatus,
              researchLevel: m.registration.researchLevel,
            }
          : null,
      })),
    };
  }

  async createGroup(dto: CreateGroupDto, createdBy: string) {
    const existing = await this.groupRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('A group with this name already exists.');
    }

    const group = this.groupRepo.create({
      name: dto.name,
      description: dto.description,
      createdBy,
    });
    await this.groupRepo.save(group);

    if (dto.memberIds && dto.memberIds.length) {
      const members = dto.memberIds.map((regId) =>
        this.groupMemberRepo.create({
          groupId: group.id,
          registrationId: regId,
        })
      );
      await this.groupMemberRepo.save(members);
    }

    return this.getGroup(group.id);
  }

  async updateGroup(id: string, dto: UpdateGroupDto) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found.');

    if (dto.name && dto.name !== group.name) {
      const existing = await this.groupRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException('A group with this name already exists.');
      }
    }

    Object.assign(group, dto);
    await this.groupRepo.save(group);
    return this.getGroup(id);
  }

  async deleteGroup(id: string) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found.');
    await this.groupRepo.remove(group);
    return { success: true };
  }

  async addMembers(groupId: string, dto: AddMembersDto) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found.');

    const toAdd: EmailGroupMember[] = [];
    for (const regId of dto.memberIds) {
      const exists = await this.groupMemberRepo.findOne({
        where: { groupId, registrationId: regId },
      });
      if (!exists) {
        toAdd.push(
          this.groupMemberRepo.create({
            groupId,
            registrationId: regId,
          })
        );
      }
    }
    if (toAdd.length) await this.groupMemberRepo.save(toAdd);
    return this.getGroup(groupId);
  }

  async removeMember(groupId: string, registrationId: string) {
    await this.groupMemberRepo.delete({ groupId, registrationId });
    return this.getGroup(groupId);
  }

  async getGroupParticipantIds(groupId: string): Promise<string[]> {
    const members = await this.groupMemberRepo.find({
      where: { groupId },
    });
    return members.map((m) => m.registrationId);
  }
}