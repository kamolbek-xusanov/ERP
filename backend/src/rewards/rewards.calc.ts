import { HomeworkStatus } from '../common/enums';
import { RULES } from '../config/rules';

export interface LessonCalcInput {
  explicit?: boolean;
  progress?: number;
  status?: HomeworkStatus;
  grade?: number | null;
  late?: boolean;
}

export function calcLesson(input: LessonCalcInput) {
  const attended = input.explicit !== undefined ? input.explicit : (input.progress ?? 0) >= 100;
  const rawBall = input.status === HomeworkStatus.DONE && input.grade != null ? input.grade : null;
  const late = !!input.late && rawBall != null;
  const ball = rawBall == null ? null : late ? Math.max(RULES.MIN_BALL, rawBall - RULES.LATE_PENALTY) : rawBall;
  const penalty = rawBall != null && ball != null ? rawBall - ball : 0;
  const attendanceXp = attended ? RULES.ATTENDANCE_XP : 0;
  const attendanceGems = attended ? RULES.ATTENDANCE_GEMS : 0;
  const ballXp = ball == null ? 0 : ball * RULES.XP_PER_BALL;
  const ballGems = ball == null ? 0 : Math.round(ball / RULES.BALL_PER_GEM);
  return {
    attended,
    rawBall,
    ball,
    late,
    penalty,
    attendanceXp,
    attendanceGems,
    ballXp,
    ballGems,
    xp: attendanceXp + ballXp,
    gems: attendanceGems + ballGems,
  };
}

export function calcExam(ball?: number | null) {
  const value = ball ?? null;
  return {
    ball: value,
    xp: value == null ? 0 : value * RULES.XP_PER_BALL,
    gems: value == null ? 0 : Math.round(value / RULES.BALL_PER_GEM),
  };
}

export function calcLevel(totalXp: number) {
  const per = RULES.XP_PER_LEVEL;
  const level = Math.floor(totalXp / per) + 1;
  const levelFrom = (level - 1) * per;
  const levelTo = level * per;
  return {
    level,
    levelFrom,
    levelTo,
    levelPercent: Math.round(((totalXp - levelFrom) / per) * 100),
    levelRemaining: levelTo - totalXp,
  };
}

export function splitExams<T extends { id: string; isExam: boolean }>(lessons: T[]) {
  const exams: { lesson: T; number: number; covered: T[] }[] = [];
  let block: T[] = [];
  for (const lesson of lessons) {
    if (lesson.isExam) {
      exams.push({ lesson, number: exams.length + 1, covered: block });
      block = [];
    } else {
      block.push(lesson);
    }
  }
  return { exams, since: block };
}
