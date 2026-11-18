import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { HomeworkStatus } from '../../common/enums';
import { Lesson } from './lesson.entity';
import { StoredFile } from './system.entity';
import { User } from './user.entity';

@Entity('homeworks')
export class Homework {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'lesson_id', type: 'uuid', unique: true }) lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ type: 'text' }) task: string;

  @Column({ type: 'jsonb' }) steps: string[];

  @Column({ name: 'assigned_at', type: 'timestamptz' }) assignedAt: Date;

  @Column({ name: 'due_at', type: 'timestamptz' }) dueAt: Date;

  @Column({ name: 'time_limit_hours', type: 'int' }) timeLimitHours: number;
}

@Entity('homework_attachments')
export class HomeworkAttachment {
  @PrimaryColumn({ name: 'homework_id', type: 'uuid' }) homeworkId: string;

  @PrimaryColumn({ name: 'file_id', type: 'uuid' }) fileId: string;

  @ManyToOne(() => Homework, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homework_id' })
  homework: Homework;

  @ManyToOne(() => StoredFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: StoredFile;
}

@Entity('student_homework')
export class StudentHomework {
  @PrimaryColumn({ name: 'homework_id', type: 'uuid' }) homeworkId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => Homework, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homework_id' })
  homework: Homework;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Index()
  @Column({ type: 'enum', enum: HomeworkStatus, enumName: 'homework_status', default: HomeworkStatus.NOT_DONE })
  status: HomeworkStatus;

  @Column({ name: 'assigned_at', type: 'timestamptz' }) assignedAt: Date;

  @Column({ name: 'due_at', type: 'timestamptz' }) dueAt: Date;

  @Column({ type: 'int', nullable: true }) grade: number | null;

  @Column({ type: 'text', nullable: true }) feedback: string | null;

  @Column({ name: 'graded_at', type: 'timestamptz', nullable: true }) gradedAt: Date | null;

  @Column({ name: 'graded_by', type: 'uuid', nullable: true }) gradedBy: string | null;
}

@Entity('submissions')
@Index(['homeworkId', 'studentId'])
export class Submission {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'homework_id', type: 'uuid' }) homeworkId: string;

  @ManyToOne(() => Homework, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homework_id' })
  homework: Homework;

  @Column({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'text', default: '' }) text: string;

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'now()' }) submittedAt: Date;

  @Column({ name: 'is_late', type: 'boolean', default: false }) isLate: boolean;
}

@Entity('submission_files')
export class SubmissionFile {
  @PrimaryColumn({ name: 'submission_id', type: 'uuid' }) submissionId: string;

  @PrimaryColumn({ name: 'file_id', type: 'uuid' }) fileId: string;

  @ManyToOne(() => Submission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;

  @ManyToOne(() => StoredFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: StoredFile;
}
