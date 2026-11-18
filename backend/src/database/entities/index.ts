import { CareerVideo, Faq, Guide } from './content.entity';
import { Payment, PaymentNotice } from './finance.entity';
import { Group, GroupMember, GroupSchedule, PaymentPlan, Room } from './group.entity';
import { Homework, HomeworkAttachment, StudentHomework, Submission, SubmissionFile } from './homework.entity';
import { Attendance, ExamResult, Lesson, LessonProgress, LessonRating } from './lesson.entity';
import { Activity, AuditLog, Notification, RankSnapshot, StoredFile } from './system.entity';
import { Student, Teacher, User, UserSettings } from './user.entity';

export * from './content.entity';
export * from './finance.entity';
export * from './group.entity';
export * from './homework.entity';
export * from './lesson.entity';
export * from './system.entity';
export * from './user.entity';

export const ENTITIES = [
  User,
  Student,
  Teacher,
  UserSettings,
  Room,
  Group,
  GroupSchedule,
  GroupMember,
  PaymentPlan,
  Lesson,
  LessonProgress,
  Attendance,
  LessonRating,
  ExamResult,
  Homework,
  HomeworkAttachment,
  StudentHomework,
  Submission,
  SubmissionFile,
  Payment,
  PaymentNotice,
  Notification,
  StoredFile,
  CareerVideo,
  Guide,
  Faq,
  Activity,
  AuditLog,
  RankSnapshot,
];
