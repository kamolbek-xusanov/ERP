import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { DAYS, HomeworkStatus } from '../common/enums';
import {
  addDays,
  atTashkent,
  average,
  dateKey,
  dayOf,
  mondayKey,
  monthRange,
  timeKey,
  todayKey,
} from '../common/utils';
import {
  Activity,
  Attendance,
  Lesson,
  LessonProgress,
  StudentHomework,
  Submission,
} from '../database/entities';
import { ExamsService } from '../exams/exams.service';
import { GroupsService } from '../groups/groups.service';
import { HomeworkService } from '../homework/homework.service';
import { LessonsService } from '../lessons/lessons.service';
import { PaymentsService } from '../payments/payments.service';
import { RewardsService, key } from '../rewards/rewards.service';
import { SubmitHomeworkDto } from '../lessons/lessons.dto';

export interface LessonFilters {
  order?: string;
  status?: string;
  homework?: string;
  q?: string;
}

@Injectable()
export class StudentService {
  constructor(
    private readonly rewards: RewardsService,
    private readonly exams: ExamsService,
    private readonly groups: GroupsService,
    private readonly homework: HomeworkService,
    private readonly lessons: LessonsService,
    private readonly payments: PaymentsService,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(LessonProgress) private readonly progress: Repository<LessonProgress>,
    @InjectRepository(Attendance) private readonly attendance: Repository<Attendance>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(StudentHomework) private readonly sh: Repository<StudentHomework>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
  ) {}

  async dashboard(studentId: string) {
    const [summary, streak, activities, upcoming] = await Promise.all([
      this.rewards.studentSummary(studentId),
      this.streak(studentId),
      this.activities.find({ where: { studentId }, order: { at: 'DESC' }, take: 10 }),
      this.upcoming(studentId),
    ]);
    return {
      ...summary,
      streak,
      activities: activities.map((a) => ({ id: a.id, type: a.type, text: a.text, xp: a.xp, at: a.at })),
      upcoming,
    };
  }

  async streak(studentId: string): Promise<number> {
    const [progress, subs, marks] = await Promise.all([
      this.progress.find({ where: { studentId } }),
      this.submissions.find({ where: { studentId } }),
      this.attendance.find({ where: { studentId, present: true }, relations: { lesson: true } }),
    ]);
    const days = new Set<string>();
    progress.forEach((p) => days.add(dateKey(p.updatedAt)));
    subs.forEach((s) => days.add(dateKey(s.submittedAt)));
    marks.forEach((m) => days.add(dateKey(m.lesson.startsAt)));
    const today = todayKey();
    let cursor = days.has(today) ? today : days.has(addDays(today, -1)) ? addDays(today, -1) : null;
    let count = 0;
    while (cursor && days.has(cursor)) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  async upcoming(studentId: string) {
    const today = todayKey();
    const thisMonth = today.slice(0, 7);
    const next = monthRange(addDays(`${thisMonth}-01`, 32).slice(0, 7)).month;
    const [a, b] = await Promise.all([this.calendar(studentId, thisMonth), this.calendar(studentId, next)]);
    return [...a, ...b].filter((e) => e.date >= today).slice(0, 8);
  }

  async myGroups(studentId: string) {
    return this.groups.describe(await this.groups.groupsOfStudent(studentId));
  }

  async lessonsOfGroup(studentId: string, groupId: string, filters: LessonFilters) {
    const group = await this.groups.assertMember(groupId, studentId);
    const snap = await this.rewards.loadGroup(groupId);
    const now = new Date();
    const { exams } = this.exams.structure(snap);
    const rows = snap.lessons.map((l) => {
      const progress = snap.progress.get(key(l.id, studentId)) ?? 0;
      const explicit = snap.attendance.get(key(l.id, studentId));
      const calc = this.rewards.lesson(snap, l.id, studentId);
      return {
        id: l.id,
        title: l.title,
        startsAt: l.startsAt,
        durationMin: l.durationMin,
        status: progress >= 100 ? 'completed' : 'in-progress',
        progress,
        isExam: l.isExam,
        upcoming: l.startsAt > now,
        attendance: explicit !== undefined ? (explicit ? 'present' : 'absent') : progress >= 100 ? 'present' : null,
        homework: this.rewards.homeworkView(snap, l.id, studentId),
        counted: calc,
      };
    });
    const started = rows.filter((r) => !r.upcoming);
    const graded = rows.filter((r) => r.counted.ball != null);
    const stats = {
      progress: rows.length ? Math.round((rows.filter((r) => r.status === 'completed').length / rows.length) * 100) : 0,
      avgBall: average(graded.map((r) => r.counted.ball)),
      graded: graded.length,
      attended: started.filter((r) => r.counted.attended).length,
      held: started.length,
    };
    const q = filters.q?.trim().toLowerCase();
    let list = rows;
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.homework) list = list.filter((r) => r.homework.status === filters.homework);
    if (q) list = list.filter((r) => r.title.toLowerCase().includes(q));
    list = [...list].sort((a, b) => +a.startsAt - +b.startsAt);
    if (filters.order !== 'oldest') list.reverse();
    return {
      group: { id: group.id, name: group.name, course: group.course },
      stats,
      exams: exams.map((e) => {
        const st = this.exams.state(snap, e, studentId, now);
        return {
          id: e.lesson.id,
          number: e.number,
          date: e.lesson.startsAt,
          title: e.lesson.title,
          status: st.state,
          ball: st.ball ?? undefined,
          missingLessons: st.state === 'blocked' ? st.missing.map((m) => ({ id: m.id, title: m.title })) : undefined,
        };
      }),
      lessons: list.map(({ counted, ...rest }) => rest),
    };
  }

  async lessonDetail(studentId: string, lessonId: string) {
    const lesson = await this.lessons.getForStudent(lessonId, studentId);
    const snap = await this.rewards.loadGroup(lesson.groupId);
    const calc = this.rewards.lesson(snap, lesson.id, studentId);
    const progress = snap.progress.get(key(lesson.id, studentId)) ?? 0;
    const hw = snap.homeworks.get(lesson.id);
    const view = this.rewards.homeworkView(snap, lesson.id, studentId);
    let homework: Record<string, unknown> = { status: 'not-assigned' };
    if (hw) {
      const row = snap.sh.get(key(lesson.id, studentId));
      const sub = await this.homework.latestSubmission(hw.id, studentId);
      homework = {
        status: view.status,
        task: hw.task,
        steps: hw.steps,
        attachments: await this.homework.attachmentsOf(hw.id),
        assignedAt: row?.assignedAt ?? hw.assignedAt,
        dueAt: view.dueAt,
        timeLimit: hw.timeLimitHours,
        feedback: row?.status === HomeworkStatus.RETURNED ? row.feedback : undefined,
        submission: sub ? await this.homework.submissionView(sub) : undefined,
      };
    }
    const exam = lesson.isExam ? this.rewards.exam(snap, lesson.id, studentId) : undefined;
    return {
      lesson: {
        id: lesson.id,
        groupId: lesson.groupId,
        title: lesson.title,
        description: lesson.description,
        startsAt: lesson.startsAt,
        durationMin: lesson.durationMin,
        isExam: lesson.isExam,
      },
      video: lesson.videoFileId
        ? { fileId: lesson.videoFileId, fileUrl: `/api/v1/files/${lesson.videoFileId}` }
        : { url: lesson.videoUrl ?? undefined },
      progress,
      reward: {
        attended: calc.attended,
        attendanceXp: calc.attendanceXp,
        attendanceGems: calc.attendanceGems,
        ball: calc.ball,
        rawBall: calc.rawBall,
        late: calc.late,
        penalty: calc.penalty,
        ballXp: calc.ballXp,
        ballGems: calc.ballGems,
      },
      exam,
      homework,
      rating: await this.lessons.ratingOf(lesson.id, studentId),
      otherLessons: snap.lessons
        .filter((l) => l.id !== lesson.id)
        .map((l) => ({
          id: l.id,
          title: l.title,
          startsAt: l.startsAt,
          isExam: l.isExam,
          progress: snap.progress.get(key(l.id, studentId)) ?? 0,
          status: (snap.progress.get(key(l.id, studentId)) ?? 0) >= 100 ? 'completed' : 'in-progress',
        })),
    };
  }

  setProgress(studentId: string, lessonId: string, percent: number) {
    return this.lessons.setProgress(studentId, lessonId, percent);
  }

  rateLesson(studentId: string, lessonId: string, stars: number, comment?: string) {
    return this.lessons.rate(studentId, lessonId, stars, comment);
  }

  submitHomework(studentId: string, lessonId: string, dto: SubmitHomeworkDto) {
    return this.homework.submit(studentId, lessonId, dto);
  }

  async leaderboard(studentId: string, groupId: string) {
    await this.groups.assertMember(groupId, studentId);
    const board = await this.rewards.leaderboard(groupId);
    return board.map((e) => ({
      rank: e.rank,
      studentId: e.studentId,
      name: e.name,
      xp: e.xp,
      delta: e.delta,
      isMe: e.studentId === studentId,
    }));
  }

  myPayments(studentId: string) {
    return this.payments.studentPayments(studentId);
  }

  async calendar(studentId: string, month?: string) {
    const range = monthRange(month);
    const groups = await this.groups.groupsOfStudent(studentId);
    const ids = groups.map((g) => g.id);
    const today = todayKey();
    const events: { id: string; date: string; time: string; title: string; type: string }[] = [];
    if (!ids.length) return events;
    const [lessons, deadlines, schedules] = await Promise.all([
      this.lessonRepo.find({ where: { groupId: In(ids), startsAt: And(MoreThanOrEqual(range.from), LessThan(range.to)) } }),
      this.sh.find({
        where: {
          studentId,
          status: In([HomeworkStatus.NOT_DONE, HomeworkStatus.RETURNED]),
          dueAt: And(MoreThanOrEqual(range.from), LessThan(range.to)),
        },
        relations: { homework: { lesson: true } },
      }),
      this.groups.scheduleOf(ids),
    ]);
    const held = new Set(lessons.map((l) => `${l.groupId}:${dateKey(l.startsAt)}`));
    lessons.forEach((l) =>
      events.push({ id: l.id, date: dateKey(l.startsAt), time: timeKey(l.startsAt), title: l.title, type: l.isExam ? 'exam' : 'lesson' }),
    );
    deadlines.forEach((d) =>
      events.push({
        id: `deadline:${d.homeworkId}`,
        date: dateKey(d.dueAt),
        time: timeKey(d.dueAt),
        title: `Vazifa muddati: ${d.homework.lesson.title}`,
        type: 'deadline',
      }),
    );
    for (let i = 1; i <= range.daysInMonth; i++) {
      const date = `${range.month}-${String(i).padStart(2, '0')}`;
      if (date < today) continue;
      const day = dayOf(atTashkent(date));
      for (const g of groups) {
        if (held.has(`${g.id}:${date}`)) continue;
        for (const slot of schedules.get(g.id) ?? []) {
          if (slot.day === day) events.push({ id: `schedule:${g.id}:${date}`, date, time: slot.startTime, title: g.name, type: 'lesson' });
        }
      }
    }
    return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }

  async analytics(studentId: string) {
    const groups = await this.groups.groupsOfStudent(studentId);
    const snaps = await Promise.all(groups.map((g) => this.rewards.loadGroup(g.id)));
    const progressRows = await this.progress.find({ where: { studentId }, relations: { lesson: true } });
    const now = new Date();
    const weekStart = mondayKey(now);
    const weekly = DAYS.map((day) => ({ day, hours: 0 }));
    let totalHours = 0;
    for (const p of progressRows) {
      const hours = ((p.percent / 100) * p.lesson.durationMin) / 60;
      totalHours += hours;
      if (dateKey(p.updatedAt) >= weekStart) weekly[DAYS.indexOf(dayOf(p.updatedAt))].hours += hours;
    }
    const buckets = new Map<string, number>();
    for (let i = 7; i >= 0; i--) buckets.set(addDays(weekStart, -7 * i), 0);
    const add = (date: Date | null, xp: number) => {
      if (!date || !xp) return;
      const k = mondayKey(date);
      if (buckets.has(k)) buckets.set(k, buckets.get(k) + xp);
    };
    const balls: number[] = [];
    let started = 0;
    let completed = 0;
    const skills: { name: string; percent: number }[] = [];
    snaps.forEach((snap, index) => {
      let groupStarted = 0;
      let groupCompleted = 0;
      for (const l of snap.lessons) {
        const calc = this.rewards.lesson(snap, l.id, studentId);
        add(l.startsAt, calc.attendanceXp);
        add(snap.sh.get(key(l.id, studentId))?.gradedAt ?? null, calc.ballXp);
        if (calc.ball != null) balls.push(calc.ball);
        if (l.isExam) {
          const result = snap.exams.get(key(l.id, studentId));
          if (result) {
            add(result.enteredAt, this.rewards.exam(snap, l.id, studentId).xp);
            balls.push(result.ball);
          }
        }
        if (l.startsAt <= now) {
          groupStarted += 1;
          if ((snap.progress.get(key(l.id, studentId)) ?? 0) >= 100) groupCompleted += 1;
        }
      }
      started += groupStarted;
      completed += groupCompleted;
      skills.push({ name: groups[index].course, percent: groupStarted ? Math.round((groupCompleted / groupStarted) * 100) : 0 });
    });
    return {
      weeklyHours: weekly.map((w) => ({ day: w.day, hours: Math.round(w.hours * 10) / 10 })),
      xpByWeek: [...buckets.entries()].map(([week, xp]) => ({ week, xp })),
      skills,
      completionRate: started ? Math.round((completed / started) * 100) : 0,
      totalHours: Math.round(totalHours * 10) / 10,
      lessonsCompleted: progressRows.filter((p) => p.percent >= 100).length,
      avgScore: average(balls),
    };
  }
}
