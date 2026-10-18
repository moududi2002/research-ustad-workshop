import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('certificate_email_logs')
export class CertificateEmailLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index()
  @Column({ name: 'certificate_id', length: 70 }) certificateId: string;
  @Column({ length: 255 }) email: string;
  @Column({ type: 'varchar', length: 16 }) status: 'sent' | 'failed';
  @Column({ type: 'text', nullable: true }) error: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
