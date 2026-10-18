import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, Index,
} from 'typeorm';

@Entity('certificates')
@Index('uq_cert_workshop_registration', ['workshopCode', 'registrationId'], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_id', unique: true, length: 70 })
  certificateId: string;

  @Column({ name: 'registration_id', type: 'varchar', length: 255, nullable: true })
  registrationId: string | null;

  @Column({ name: 'source', type: 'varchar', length: 16, default: 'registered' })
  source: 'registered' | 'custom';

  @Column({ name: 'full_name' }) fullName: string;
  @Column() email: string;
  @Column({ type: 'varchar', nullable: true }) whatsapp: string | null;
  @Column({ name: 'department', type: 'varchar', nullable: true }) department: string | null;
  @Column({ name: 'university_name', type: 'varchar', nullable: true }) universityName: string | null;
  @Column({ name: 'workshop_code', length: 50 }) workshopCode: string;
  @Column({ name: 'workshop_name' }) workshopName: string;
  @Column({ name: 'workshop_date', type: 'date' }) workshopDate: string;
  @Column({ name: 'certificate_status', type: 'varchar', length: 16, default: 'issued' })
  certificateStatus: 'issued' | 'revoked';
  @Column({ name: 'email_status', type: 'varchar', length: 16, default: 'queued' })
  emailStatus: 'queued' | 'sending' | 'sent' | 'failed';
  @Column({ name: 'email_error', type: 'text', nullable: true }) emailError: string | null;
  @Column({ name: 'send_attempts', type: 'int', default: 0 }) sendAttempts: number;
  @Column({ name: 'processing_started_at', type: 'datetime', nullable: true }) processingStartedAt: Date | null;
  @Column({ name: 'sent_at', type: 'datetime', nullable: true }) sentAt: Date | null;
  @Column({ name: 'issued_by', type: 'varchar', length: 36, nullable: true }) issuedBy: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
