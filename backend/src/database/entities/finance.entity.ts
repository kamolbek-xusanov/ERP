import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'group_id', type: 'uuid' }) groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'int' }) amount: number;

  @Column({ name: 'paid_at', type: 'date' }) paidAt: string;

  @Column({ type: 'text' }) method: string;

  @Column({ type: 'text', default: '' }) description: string;
}

@Entity('payment_notices')
export class PaymentNotice {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'group_id', type: 'uuid' }) groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'int' }) amount: number;

  @Column({ name: 'due_date', type: 'date' }) dueDate: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' }) sentAt: Date;

  @Column({ name: 'sent_by', type: 'uuid' }) sentBy: string;

  @Column({ type: 'int' }) recipients: number;
}
