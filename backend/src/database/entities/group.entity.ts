import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Day } from '../../common/enums';
import { User } from './user.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) name: string;

  @Column({ name: 'name_key', type: 'text', unique: true }) nameKey: string;

  @Column({ type: 'int' }) capacity: number;
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) name: string;

  @Column({ type: 'text' }) course: string;

  @Index()
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('group_schedule')
@Unique('uq_schedule_room_day_start', ['roomId', 'day', 'startTime'])
export class GroupSchedule {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'enum', enum: Day, enumName: 'day_of_week' }) day: Day;

  @Column({ name: 'start_time', type: 'varchar', length: 5 }) startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 5 }) endTime: string;

  @Column({ name: 'room_id', type: 'uuid', nullable: true }) roomId: string | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_id' })
  room: Room | null;
}

@Entity('group_members')
export class GroupMember {
  @PrimaryColumn({ name: 'group_id', type: 'uuid' }) groupId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' }) joinedAt: Date;
}

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryColumn({ name: 'group_id', type: 'uuid' }) groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'int' }) amount: number;

  @Column({ name: 'due_date', type: 'date' }) dueDate: string;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' }) updatedAt: Date;
}
