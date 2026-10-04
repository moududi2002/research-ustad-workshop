// path: backend/src/email/email-group-member.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { EmailGroup } from './email-group.entity';
import { Registration } from '../registrations/registration.entity';

@Entity('email_group_members')
@Index(['groupId', 'registrationId'], { unique: true })
export class EmailGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @ManyToOne(() => EmailGroup, (g) => g.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: EmailGroup;

  @Column({ name: 'registration_id' })
  registrationId: string;

  @ManyToOne(() => Registration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registration_id' })
  registration: Registration;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}