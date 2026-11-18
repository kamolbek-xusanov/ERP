import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { StoredFile } from './system.entity';
import { User } from './user.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'text' }) title: string;

  @Column({ type: 'text', default: '' }) description: string;

  @Column({ name: 'starts_at', type: 'timestamptz' }) startsAt: Date;

  @Column({ name: 'duration_min', type: 'int', default: 45 }) durationMin: number;

  @Column({ name: 'video_url', type: 'text', nullable: true }) videoUrl: string | null;

  @Column({ name: 'video_file_id', type: 'uuid', nullable: true }) videoFileId: string | null;

  @ManyToOne(() => StoredFile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'video_file_id' })
  videoFile: StoredFile | null;

  @Column({ name: 'is_exam', type: 'boolean', default: false }) isExam: boolean;

  @Column({ name: 'attendance_saved', type: 'boolean', default: false }) attendanceSaved: boolean;

  @Column({ name: 'created_by', type: 'uuid' }) createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('lesson_progress')
export class LessonProgress {
  @PrimaryColumn({ name: 'lesson_id', type: 'uuid' }) lessonId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'int', default: 0 }) percent: number;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true }) completedAt: Date | null;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' }) updatedAt: Date;
}

@Entity('attendance')
export class Attendance {
  @PrimaryColumn({ name: 'lesson_id', type: 'uuid' }) lessonId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'boolean' }) present: boolean;

  @Column({ name: 'marked_by', type: 'uuid' }) markedBy: string;

  @Column({ name: 'marked_at', type: 'timestamptz', default: () => 'now()' }) markedAt: Date;

  @Column({ name: 'arrived_at', type: 'timestamptz', nullable: true }) arrivedAt: Date | null;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true }) leftAt: Date | null;
}

@Entity('lesson_ratings')
export class LessonRating {
  @PrimaryColumn({ name: 'lesson_id', type: 'uuid' }) lessonId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'int' }) stars: number;

  @Column({ type: 'text', default: '' }) comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('exam_results')
export class ExamResult {
  @PrimaryColumn({ name: 'lesson_id', type: 'uuid' }) lessonId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'int' }) ball: number;

  @Column({ name: 'entered_by', type: 'uuid' }) enteredBy: string;

  @Column({ name: 'entered_at', type: 'timestamptz', default: () => 'now()' }) enteredAt: Date;
}
