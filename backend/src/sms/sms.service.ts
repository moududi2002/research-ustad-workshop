import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Registration } from '../registrations/registration.entity';
import { SmsLog } from './sms-log.entity';

type SendInput = {
  mode: 'all' | 'selected' | 'manual';
  registrationIds?: string[];
  phoneNumbers?: string[];
  message: string;
};

type Recipient = {
  phone: string;
  name?: string;
  university?: string;
  registrationId?: string;
};

@Injectable()
export class SmsService {
  private readonly endpoint = 'https://api.zendsms.com/api/v1/send-sms';


    constructor(
      @InjectRepository(Registration)
      private readonly registrationRepo: Repository<Registration>,

      @InjectRepository(SmsLog)
      private readonly smsLogRepo: Repository<SmsLog>,
    ) {}

  async getParticipants() {
    const registrations = await this.registrationRepo.find({
      select: {
        id: true,
        fullName: true,
        whatsapp: true,
        universityName: true,
        registrationId: true,
        consent: true,
      },
      order: { createdAt: 'DESC' },
    });

    return registrations.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      whatsapp: r.whatsapp,
      universityName: r.universityName,
      registrationId: r.registrationId,
      consent: r.consent,
    }));
  }

  async send(input: SendInput) {
    const apiKey = process.env.ZENDSMS_API_KEY;
    const senderId = process.env.ZENDSMS_SENDER_ID;

    if (!apiKey || !senderId) {
      throw new ServiceUnavailableException(
        'ZendSMS is not configured. Set ZENDSMS_API_KEY and ZENDSMS_SENDER_ID.',
      );
    }

    const messageTemplate = String(input.message ?? '').trim();
    if (!messageTemplate) {
      throw new BadRequestException('Message is required.');
    }
    if (messageTemplate.length > 2000) {
      throw new BadRequestException('Message is too long (maximum 2000 characters).');
    }

    const recipients = await this.resolveRecipients(input);
    if (!recipients.length) {
      throw new BadRequestException('No valid recipients were selected.');
    }
    if (recipients.length > 1000) {
      throw new BadRequestException('Send in batches of 1000 recipients or fewer.');
    }

    const results: Array<{
      phone: string;
      name?: string;
      status: 'queued' | 'failed';
      messageId?: string;
      smsCount?: number;
      error?: string;
    }> = [];

    // Sequential requests reduce the chance of hitting provider rate limits.
    for (const recipient of recipients) {
      const message = this.personalize(messageTemplate, recipient);
      const clientRef = `ruws-${randomUUID()}`;

      let logData: Partial<SmsLog> = {
        phone: recipient.phone,
        recipientName: recipient.name || null,
        message,
        status: 'failed',
        providerMessageId: null,
        error: null,
        smsCount: 0,
        recipientMode: input.mode,
      };

      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: recipient.phone,
            sender_id: senderId,
            message,
            client_ref: clientRef,
          }),
          signal: AbortSignal.timeout(20000),
        });

        const payload: any = await response.json().catch(() => ({}));

        if (!response.ok || payload?.success !== true) {
          logData = {
            ...logData,
            status: 'failed',
            error: String(
              payload?.message || `ZendSMS HTTP ${response.status}`,
            ),
          };
        } else {
          logData = {
            ...logData,
            status: 'queued',
            providerMessageId: payload?.data?.message_id
              ? String(payload.data.message_id)
              : null,
            smsCount: Number(payload?.data?.sms_count || 0),
            error: null,
          };
        }
      } catch (error) {
        logData = {
          ...logData,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Request failed',
        };
      }

      // প্রতিটি নম্বরের ফলাফল সঙ্গে সঙ্গে ডেটাবেইসে সংরক্ষণ
      const savedLog = await this.smsLogRepo.save(
        this.smsLogRepo.create(logData),
      );

      results.push({
        phone: savedLog.phone,
        name: savedLog.recipientName || undefined,
        status: savedLog.status,
        messageId: savedLog.providerMessageId || undefined,
        smsCount: savedLog.smsCount,
        error: savedLog.error || undefined,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const queued = results.filter((r) => r.status === 'queued').length;
    return {
      total: results.length,
      queued,
      failed: results.length - queued,
      results,
      note: 'Queued means accepted by ZendSMS, not confirmed delivered to the handset.',
    };
  }

  async getHistory(limit = 500) {
    const logs = await this.smsLogRepo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(Number(limit) || 500, 1), 1000),
    });

    return {
      total: logs.length,
      records: logs,
    };
  }

  private async resolveRecipients(input: SendInput): Promise<Recipient[]> {
    if (input.mode === 'all' || input.mode === 'selected') {
      const query = this.registrationRepo
        .createQueryBuilder('r')
        .where('r.consent = :consent', { consent: true });

      if (input.mode === 'selected') {
        const ids = [...new Set((input.registrationIds || []).filter(Boolean))];
        if (!ids.length) {
          throw new BadRequestException('Select at least one participant.');
        }
        query.andWhere('r.id IN (:...ids)', { ids });
      }

      const registrations = await query.getMany();
      return this.uniqueRecipients(
        registrations.map((r) => ({
          phone: r.whatsapp,
          name: r.fullName,
          university: r.universityName,
          registrationId: r.registrationId,
        })),
      );
    }

    if (input.mode === 'manual') {
      const phones = (input.phoneNumbers || []).flatMap((value) =>
        String(value).split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean),
      );
      if (!phones.length) {
        throw new BadRequestException('Enter at least one phone number.');
      }
      return this.uniqueRecipients(phones.map((phone) => ({ phone })));
    }

    throw new BadRequestException('Invalid recipient mode.');
  }

  private uniqueRecipients(recipients: Recipient[]): Recipient[] {
    const map = new Map<string, Recipient>();
    for (const recipient of recipients) {
      const phone = this.normalizePhone(recipient.phone);
      if (!phone) continue;
      if (!map.has(phone)) map.set(phone, { ...recipient, phone });
    }
    return [...map.values()];
  }

  private normalizePhone(raw: string): string | null {
    let phone = String(raw || '').replace(/[^\d+]/g, '');
    if (phone.startsWith('+')) phone = phone.slice(1);
    if (phone.startsWith('00880')) phone = phone.slice(2);
    if (phone.startsWith('01') && phone.length === 11) phone = `88${phone}`;
    if (/^1[3-9]\d{8}$/.test(phone)) phone = `880${phone}`;
    if (!/^8801[3-9]\d{8}$/.test(phone)) return null;
    return phone;
  }

  private personalize(template: string, recipient: Recipient): string {
    return template
      .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || 'Participant')
      .replace(/\{\{\s*university\s*\}\}/gi, recipient.university || '')
      .replace(/\{\{\s*registrationId\s*\}\}/gi, recipient.registrationId || '');
  }

  async refreshDeliveryStatus(logId: string) {
  const log = await this.smsLogRepo.findOne({
    where: { id: logId },
  });

  if (!log) {
    throw new NotFoundException('SMS record not found');
  }

  if (!log.providerMessageId) {
    throw new BadGatewayException(
      'No ZendSMS message ID exists for this record',
    );
  }

  const apiKey = process.env.ZENDSMS_API_KEY;

  if (!apiKey) {
    throw new BadGatewayException('ZendSMS API key is not configured');
  }

  const response = await fetch(
    `https://api.zendsms.com/api/v1/dlr/${encodeURIComponent(
      log.providerMessageId,
    )}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    },
  );

  const payload: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new BadGatewayException(
      payload?.message ||
        `ZendSMS DLR request failed with HTTP ${response.status}`,
    );
  }

  // Response schema-তে status-এর সঠিক nesting ভিন্ন হলে
  // নিচের candidate list-এ সেই field যোগ করা যাবে।
  const rawStatus =
    payload?.data?.delivery_status ??
    payload?.data?.status ??
    payload?.delivery_status ??
    payload?.status;

  if (typeof rawStatus !== 'string' || !rawStatus.trim()) {
    throw new BadGatewayException(
      'ZendSMS response did not contain a recognized delivery status',
    );
  }

  const normalized = rawStatus.trim().toLowerCase();

  let deliveryStatus = 'unknown';

  if (
    ['delivered', 'delivery_success', 'success'].includes(normalized)
  ) {
    deliveryStatus = 'delivered';
  } else if (
    ['failed', 'undelivered', 'rejected', 'expired'].includes(normalized)
  ) {
    deliveryStatus = 'failed';
  } else if (
    ['queued', 'pending', 'sent', 'processing', 'accepted'].includes(
      normalized,
    )
  ) {
    deliveryStatus = 'pending';
  } else {
    // Provider-এর অচেনা status-ও হারিয়ে না ফেলে সংরক্ষণ করি।
    deliveryStatus = normalized;
  }

  log.deliveryStatus = deliveryStatus;
  log.dlrCheckedAt = new Date();

  await this.smsLogRepo.save(log);

  return {
    id: log.id,
    phone: log.phone,
    messageId: log.providerMessageId,
    deliveryStatus: log.deliveryStatus,
    dlrCheckedAt: log.dlrCheckedAt,
    providerResponse: payload,
  };
}
}
