// path: backend/src/email/email-group.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EmailGroupMember } from './email-group-member.entity';

@Entity('email_groups')
export class EmailGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => EmailGroupMember, (m) => m.group, {
    cascade: true,
    eager: false,
  })
  members: EmailGroupMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}