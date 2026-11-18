import 'dotenv/config';

const num = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

export const RULES = {
  ATTENDANCE_XP: num('ATTENDANCE_XP', 20),
  ATTENDANCE_GEMS: num('ATTENDANCE_GEMS', 10),
  MIN_BALL: 1,
  MAX_BALL: 100,
  XP_PER_BALL: num('XP_PER_BALL', 1),
  BALL_PER_GEM: num('BALL_PER_GEM', 2),
  LATE_PENALTY: num('LATE_PENALTY', 10),
  XP_PER_LEVEL: num('XP_PER_LEVEL', 250),
  HOMEWORK_LIMITS: [1, 3, 24, 72, 168],
  RETURN_EXTENSION_H: num('RETURN_EXTENSION_H', 24),
  LESSON_SLOTS: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
  LESSON_SLOT_HOURS: 2,
  DEFAULT_ONLINE_CAPACITY: num('DEFAULT_ONLINE_CAPACITY', 15),
  MIN_PAYMENT: 10000,
  DEFAULT_LESSON_DURATION: 45,
  NEW_STUDENT_DAYS: 7,
  LOGIN_MAX_FAILS: num('LOGIN_MAX_FAILS', 5),
  LOGIN_LOCK_MINUTES: num('LOGIN_LOCK_MINUTES', 15),
};

const MB = 1024 * 1024;

export type FilePurpose = 'answer' | 'material' | 'video' | 'avatar';

export const FILE_RULES: Record<FilePurpose, { maxCount: number; maxBytes: number; ext: string[] }> = {
  answer: {
    maxCount: 3,
    maxBytes: 25 * MB,
    ext: ['pdf', 'zip', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'json'],
  },
  material: {
    maxCount: 5,
    maxBytes: 20 * MB,
    ext: ['pdf', 'zip', 'rar', '7z', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'json', 'html', 'css', 'js', 'ts', 'tsx'],
  },
  avatar: {
    maxCount: 1,
    maxBytes: 3 * MB,
    ext: ['png', 'jpg', 'jpeg', 'webp'],
  },
  video: {
    maxCount: 1,
    maxBytes: 300 * MB,
    ext: ['mp4', 'webm', 'mov', 'm4v'],
  },
};

export const MAX_UPLOAD_BYTES = 300 * MB;
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
