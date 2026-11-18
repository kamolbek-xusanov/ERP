import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Role, ThemeMode } from '../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column({ type: 'enum', enum: Role, enumName: 'user_role' })
  role: Role;

  @Column({ type: 'text', unique: true }) login: string;

  @Column({ name: 'password_hash', type: 'text', select: false }) passwordHash: string;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true }) passwordChangedAt: Date | null;

  @Column({ name: 'full_name', type: 'text' }) fullName: string;

  @Column({ type: 'text', nullable: true }) phone: string | null;

  @Column({ type: 'text', nullable: true }) email: string | null;

  @Column({ type: 'text', nullable: true }) bio: string | null;

  @Column({ name: 'avatar_file_id', type: 'uuid', nullable: true }) avatarFileId: string | null;

  @Column({ name: 'credential_enc', type: 'text', nullable: true }) credentialEnc: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;

  @Column({ name: 'token_version', type: 'int', default: 0 }) tokenVersion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId: string;

  @Column({ name: 'joined_at', type: 'date', default: () => 'CURRENT_DATE' }) joinedAt: string;

  @Column({ name: 'streak_days', type: 'int', default: 0 }) streakDays: number;
}

@Entity('teachers')
export class Teacher {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId: string;
}

@Entity('user_settings')
export class UserSettings {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId: string;

  @Column({ name: 'notify_email', type: 'boolean', default: true }) notifyEmail: boolean;

  @Column({ name: 'notify_push', type: 'boolean', default: true }) notifyPush: boolean;

  @Column({ name: 'notify_reminders', type: 'boolean', default: true }) notifyReminders: boolean;

  @Column({ type: 'enum', enum: ThemeMode, enumName: 'theme_mode', default: ThemeMode.DARK }) theme: ThemeMode;
}
