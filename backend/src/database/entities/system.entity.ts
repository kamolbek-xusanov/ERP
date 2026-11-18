import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('files')
export class StoredFile {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'original_name', type: 'text' }) originalName: string;

  @Column({ name: 'mime_type', type: 'text' }) mimeType: string;

  @Column({
    name: 'size_bytes',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string | number) => Number(v) },
  })
  sizeBytes: number;

  @Column({ name: 'storage_key', type: 'text' }) storageKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'user_id', type: 'uuid' }) userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' }) type: string;

  @Column({ type: 'text' }) title: string;

  @Column({ type: 'text', nullable: true }) link: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt: Date | null;
}

@Entity('activities')
@Index(['studentId', 'at'])
export class Activity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'student_id', type: 'uuid' }) studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'text' }) type: string;

  @Column({ type: 'text' }) text: string;

  @Column({ type: 'int', nullable: true }) xp: number | null;

  @CreateDateColumn({ type: 'timestamptz' }) at: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true }) actorId: string | null;

  @Column({ type: 'text' }) action: string;

  @Column({ type: 'text', nullable: true }) target: string | null;

  @Column({ type: 'jsonb', nullable: true }) meta: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('rank_snapshots')
export class RankSnapshot {
  @PrimaryColumn({ name: 'group_id', type: 'uuid' }) groupId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' }) studentId: string;

  @PrimaryColumn({ type: 'text' }) week: string;

  @Column({ type: 'int' }) rank: number;
}
