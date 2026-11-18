export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  role: Role;
  fullName: string;
  login?: string;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  avatarFileId?: string | null;
}

export type HomeworkKey = 'done' | 'pending' | 'returned' | 'not-done' | 'not-assigned';
export type ExamState = 'done' | 'ready' | 'blocked';

export interface Session {
  day: string;
  start: string;
  end: string;
  room: string | null;
}

export interface NextSession extends Session {
  date: string;
}

export interface GroupCard {
  id: string;
  name: string;
  course: string;
  teacher: { id: string; fullName: string };
  members: number;
  schedule: Session[];
  nextSession: NextSession | null;
  waitingCount?: number;
}

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  type: 'lesson' | 'exam' | 'deadline' | 'interview';
}

export interface Dashboard {
  xp: number;
  gems: number;
  level: number;
  levelPercent: number;
  levelRemaining: number;
  levelFrom: number;
  levelTo: number;
  streak: number;
  overallRank: number;
  totalStudents: number;
  groupRanks: { groupId: string; groupName: string; rank: number; size: number }[];
  activities: { id: string; type: string; text: string; xp: number | null; at: string }[];
  upcoming: CalendarEvent[];
}

export interface HomeworkBrief {
  status: HomeworkKey;
  dueAt: string | null;
  ball: number | null;
  rawBall: number | null;
  late: boolean;
  submittedAt?: string | null;
}

export interface MissingLesson {
  id: string;
  title: string;
}

export interface LessonRow {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  status: 'completed' | 'in-progress';
  progress: number;
  isExam: boolean;
  upcoming: boolean;
  attendance: 'present' | 'absent' | null;
  homework: HomeworkBrief;
}

export interface ExamRow {
  id: string;
  number: number;
  date: string;
  title: string;
  status: ExamState;
  ball?: number;
  missingLessons?: MissingLesson[];
}

export interface GroupLessons {
  group: { id: string; name: string; course: string };
  stats: { progress: number; avgBall: number | null; graded: number; attended: number; held: number };
  exams: ExamRow[];
  lessons: LessonRow[];
}

export interface FileMeta {
  id: string;
  name: string;
  size: number;
}

export interface SubmissionView {
  id?: string;
  text: string;
  files: FileMeta[];
  submittedAt: string | null;
  late: boolean;
}

export interface LessonDetail {
  lesson: { id: string; groupId: string; title: string; description: string; startsAt: string; durationMin: number; isExam: boolean };
  video: { url?: string; fileId?: string; fileUrl?: string };
  progress: number;
  reward: {
    attended: boolean;
    attendanceXp: number;
    attendanceGems: number;
    ball: number | null;
    rawBall: number | null;
    late: boolean;
    penalty: number;
    ballXp: number;
    ballGems: number;
  };
  exam?: { ball: number | null; xp: number; gems: number };
  rating: { stars: number; comment: string } | null;
  homework: {
    status: HomeworkKey;
    task?: string;
    steps?: string[];
    attachments?: FileMeta[];
    assignedAt?: string;
    dueAt?: string | null;
    timeLimit?: number;
    feedback?: string | null;
    submission?: SubmissionView;
  };
  otherLessons: { id: string; title: string; startsAt: string; isExam: boolean; progress: number; status: string }[];
}

export interface LeaderRow {
  rank: number;
  studentId: string;
  name: string;
  xp: number;
  delta: number;
  isMe: boolean;
}

export interface StudentPayments {
  total: number;
  count: number;
  last: PaymentItem | null;
  upcoming: { groupId: string; groupName: string; dueDate: string; amount: number; daysLeft: number }[];
  items: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  date: string;
  groupName: string;
  description: string;
  method: string;
  amount: number;
}

export interface Analytics {
  weeklyHours: { day: string; hours: number }[];
  xpByWeek: { week: string; xp: number }[];
  skills: { name: string; percent: number }[];
  completionRate: number;
  totalHours: number;
  lessonsCompleted: number;
  avgScore: number | null;
}

export interface Settings {
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyReminders: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface CareerVideo {
  id: string;
  title: string;
  topic: string;
  durationMin: number;
  description: string;
  url: string;
}

export interface Guide {
  id: string;
  title: string;
  category: string;
  readMin: number;
  summary: string;
  body: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface TeacherDashboard {
  groups: { id: string; name: string; course: string; members: number }[];
  waitingReview: number;
  upcomingLessons: (NextSession & { groupId: string; groupName: string })[];
  stats: { groups: number; students: number; lessonsHeld: number; waitingReview: number };
}

export interface StudentStat {
  studentId: string;
  name: string;
  login: string;
  phone: string | null;
  password: string | null;
  rank: number;
  xp: number;
  gems: number;
  avgBall: number | null;
  held: number;
  attended: number;
  assigned: number;
  done: number;
  pending: number;
}

export interface TeacherLessonRow {
  id: string;
  title: string;
  startsAt: string;
  isExam: boolean;
  upcoming: boolean;
  attendanceSaved: boolean;
  summary: { students: number; attended: number; handedIn: number; pending: number; done: number; returned: number; notDone: number };
  homework: { given: boolean; dueAt: string | null; timeLimit: number | null };
}

export interface TeacherGroupLessons {
  lessons: TeacherLessonRow[];
  exams: { id: string; number: number; date: string; title: string; admitted: number; total: number; graded: number }[];
  sinceLastExam: number;
}

export interface TeacherLessonDetail {
  lesson: {
    id: string;
    groupId: string;
    title: string;
    description: string;
    startsAt: string;
    durationMin: number;
    videoUrl: string | null;
    videoFileId: string | null;
    isExam: boolean;
    attendanceSaved: boolean;
  };
  video: { url?: string; fileId?: string };
  homework: { id: string; task: string; steps: string[]; assignedAt: string; dueAt: string; timeLimit: number; attachments: FileMeta[] } | null;
  attendanceSaved: boolean;
  ratings: { average: number | null; count: number; items: { studentId: string; name: string; stars: number; comment: string }[] };
  students: {
    studentId: string;
    name: string;
    attended: boolean;
    arrivedAt: string | null;
    leftAt: string | null;
    homework: { status: HomeworkKey; submittedAt: string | null; late: boolean; ball: number | null; rawBall: number | null };
    canReview: boolean;
  }[];
  sameGroupLessons: { id: string; title: string; startsAt: string; isExam: boolean }[];
}

export interface TeacherSubmission extends SubmissionView {
  status: string;
  dueAt: string;
  grade?: number;
  feedback?: string;
}

export interface ReviewItem {
  lessonId: string;
  lessonTitle: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  submittedAt: string | null;
  late: boolean;
}

export interface JournalData {
  columns: { kind: 'lesson' | 'exam'; id: string; title: string; startsAt: string; number?: number; saved?: boolean; upcoming?: boolean }[];
  rows: {
    studentId: string;
    name: string;
    cells: Record<string, 'present' | 'absent' | 'upcoming'>;
    examCells: Record<string, { state: ExamState; ball?: number }>;
    held: number;
    attended: number;
    percent: number;
  }[];
}

export interface ExamDetail {
  exam: { id: string; number: number; date: string; title: string; groupId: string; coveredLessons: number };
  students: { studentId: string; name: string; state: ExamState; ball?: number; missingLessons?: MissingLesson[] }[];
}

export interface AdminDashboard {
  studentsCount: number;
  teachersCount: number;
  groupsCount: number;
  freeSlotsToday: number;
  upcomingPayments: { groupId: string; groupName: string; amount: number; dueDate: string; daysLeft: number }[];
  lastNotices: { id: string; groupName: string; amount: number; dueDate: string; sentAt: string; recipients: number }[];
}

export interface AdminStudent {
  id: string;
  fullName: string;
  phone: string | null;
  login: string;
  isActive?: boolean;
  groups: { id: string; name: string }[];
  passwordChangedAt: string | null;
  /** Admin/ustoz uchun: foydalanuvchi parolini o'zgartirmagan bo'lsa, boshlang'ich parol. */
  password?: string | null;
  studentsCount?: number;
  isNew?: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Timetable {
  slots: string[];
  rooms: (Room & { cells: Record<string, { groupId: string; groupName: string; teacher: string } | null> })[];
}

export interface AdminGroup {
  id: string;
  name: string;
  course: string;
  teacher: { id: string; fullName: string };
  members: number;
  capacity: number;
  schedule: { day: string; start: string; end: string; roomId: string | null; roomName: string | null }[];
  plan: { amount: number; dueDate: string; daysLeft: number } | null;
}

export interface AdminPayments {
  groups: { groupId: string; name: string; members: number; plan: { amount: number; dueDate: string }; daysLeft: number }[];
  notices: { id: string; groupId: string; groupName: string; amount: number; dueDate: string; sentAt: string; recipients: number }[];
}

export interface AuditItem {
  id: string;
  actorId: string | null;
  actorName?: string | null;
  targetName?: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}
