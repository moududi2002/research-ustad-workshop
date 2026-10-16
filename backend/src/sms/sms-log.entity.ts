import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sms_logs')
@Index(['createdAt'])
@Index(['status'])
export class SmsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ nullable: true, length: 255 })
  recipientName: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 20 })
  status: 'queued' | 'failed';

  @Column({ nullable: true, length: 255 })
  providerMessageId: string | null;

  @Column({ nullable: true, type: 'text' })
  error: string | null;

  @Column({ type: 'int', default: 0 })
  smsCount: number;

  @Column({ length: 20 })
  recipientMode: 'all' | 'selected' | 'manual';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, length: 50 })
    deliveryStatus: string | null;

    @Column({ type: 'datetime', nullable: true })
    dlrCheckedAt: Date | null;
}
