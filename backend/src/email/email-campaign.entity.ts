// path: backend/src/email/email-campaign.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('email_campaigns')
export class EmailCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  bodyHtml: string;

  @Column({ type: 'simple-json', default: '[]' })
  cc: string[];

  @Column({ type: 'simple-json', default: '[]' })
  bcc: string[];

  @Column({ name: 'recipient_emails', type: 'simple-json', default: '[]' })
  recipientEmails: string[];

  @Column({ name: 'recipient_ids', type: 'simple-json', default: '[]' })
  recipientIds: string[];

  @Column({ name: 'total_recipients', default: 0 })
  totalRecipients: number;

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  @Column({ name: 'failed_count', default: 0 })
  failedCount: number;

  @Column({ type: 'simple-json', default: '[]' })
  failures: { email: string; reason: string }[];

  @Column({ default: 'pending' })
  status: string; // pending | sending | sent | partial | failed

  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Column({ name: 'sender_email', nullable: true })
  senderEmail: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}