//backend/src/registrations/registration.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'registration_id', unique: true })
  registrationId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  whatsapp: string;

  @Column({ name: 'academic_status' })
  academicStatus: string;

  @Column({ name: 'university_name' })
  universityName: string;

  @Column({ nullable: true })
  department: string;

  @Column({ name: 'research_level' })
  researchLevel: string;

  @Column({ name: 'higher_study_interest' })
  higherStudyInterest: string;

  @Column({ name: 'preferred_country', nullable: true })
  preferredCountry: string;

  @Column({ name: 'registration_source' })
  registrationSource: string;

  @Column({ default: true })
  consent: boolean;

  @Column({ name: 'attendance_status', default: 'pending' })
  attendanceStatus: string;

  @Column({ name: 'certificate_issued', default: false })
  certificateIssued: boolean;

  @Column({ name: 'feedback_submitted', default: false })
  feedbackSubmitted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}