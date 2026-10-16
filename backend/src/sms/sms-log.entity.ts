
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

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  recipientName: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20 })
  status: 'queued' | 'failed';

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerMessageId: string | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'int', default: 0 })
  smsCount: number;

  @Column({ type: 'varchar', length: 20 })
  recipientMode: 'all' | 'selected' | 'manual';

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  deliveryStatus: string | null;

  @Column({ type: 'datetime', nullable: true })
  dlrCheckedAt: Date | null;
}
