import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HomeworkStatus, Role } from '../common/enums';
import { mondayKey } from '../common/utils';
import {
  Attendance,
  ExamResult,
  Group,
  GroupMember,
  Homework,
  Lesson,
  LessonProgress,
  RankSnapshot,
  StudentHomework,
  Submission,
  User,
} from '../database/entities';
import { calcExam, calcLesson, calcLevel } from './rewards.calc';

export const key = (a: string, b: string) => `${a}:${b}`;

export interface GroupSnapshot {
  groupId: string;
  lessons: Lesson[];
  memberIds: string[];
  names: Map<string, string>;
  progress: Map<string, number>;
  attendance: Map<string, boolean>;
  homeworks: Map<string, Homework>;
  sh: Map<string, StudentHomework>;
  lastSub: Map<string, { at: Date; late: boolean }>;
  exams: Map<string, ExamResult>;
}

export interface BoardEntry {
  studentId: string;
  name: string;
  xp: number;
  gems: number;
  rank: number;
}

const HW_KEY: Record<HomeworkStatus, string> = {
  DONE: 'done',
  PENDING: 'pending',
  RETURNED: 'returned',
  NOT_DONE: 'not-done',
};

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(LessonProgress) private readonly progress: Repository<LessonProgress>,
    @InjectRepository(Attendance) private readonly attendance: Repository<Attendance>,
    @InjectRepository(Homework) private readonly homeworks: Repository<Homework>,
    @InjectRepository(StudentHomework) private readonly sh: Repository<StudentHomework>,
    @InjectRepository(Submission) private readonly subs: Repository<Submission>,
    @InjectRepository(ExamResult) private readonly exams: Repository<ExamResult>,
    @InjectRepository(RankSnapshot) private readonly snaps: Repository<RankSnapshot>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async loadGroup(groupId: string): Promise<GroupSnapshot> {
    const [lessons, members] = await Promise.all([
      this.lessons.find({ where: { groupId }, order: { startsAt: 'ASC', createdAt: 'ASC' } }),
      this.members.find({ where: { groupId }, relations: { student: true } }),
    ]);
    const snap: GroupSnapshot = {
      groupId,
      lessons,
      memberIds: members.map((m) => m.studentId),
      names: new Map<string, string>(members.map((m) => [m.studentId, m.student.fullName] as [string, string])),
      progress: new Map(),
      attendance: new Map(),
      homeworks: new Map(),
      sh: new Map(),
      lastSub: new Map(),
      exams: new Map(),
    };
    if (!lessons.length) return snap;
    const ids = lessons.map((l) => l.id);
    const [prog, att, hws, exs] = await Promise.all([
      this.progress.find({ where: { lessonId: In(ids) } }),
      this.attendance.find({ where: { lessonId: In(ids) } }),
      this.homeworks.find({ where: { lessonId: In(ids) } }),
      this.exams.find({ where: { lessonId: In(ids) } }),
    ]);
    prog.forEach((p) => snap.progress.set(key(p.lessonId, p.studentId), p.percent));
    att.forEach((a) => snap.attendance.set(key(a.lessonId, a.studentId), a.present));
    hws.forEach((h) => snap.homeworks.set(h.lessonId, h));
    exs.forEach((e) => snap.exams.set(key(e.lessonId, e.studentId), e));
    if (hws.length) {
      const hwLesson = new Map(hws.map((h) => [h.id, h.lessonId] as [string, string]));
      const hwIds = hws.map((h) => h.id);
      const [shs, subs] = await Promise.all([
        this.sh.find({ where: { homeworkId: In(hwIds) } }),
        this.subs.find({ where: { homeworkId: In(hwIds) }, order: { submittedAt: 'ASC' } }),
      ]);
      shs.forEach((s) => snap.sh.set(key(hwLesson.get(s.homeworkId), s.studentId), s));
      subs.forEach((s) =>
        snap.lastSub.set(key(hwLesson.get(s.homeworkId), s.studentId), { at: s.submittedAt, late: s.isLate }),
      );
    }
    return snap;
  }

  lesson(s: GroupSnapshot, lessonId: string, studentId: string) {
    const k = key(lessonId, studentId);
    const sh = s.sh.get(k);
    return calcLesson({
      explicit: s.attendance.get(k),
      progress: s.progress.get(k),
      status: sh?.status,
      grade: sh?.grade,
      late: s.lastSub.get(k)?.late,
    });
  }

  exam(s: GroupSnapshot, lessonId: string, studentId: string) {
    return calcExam(s.exams.get(key(lessonId, studentId))?.ball);
  }

  totals(s: GroupSnapshot, studentId: string) {
    let xp = 0;
    let gems = 0;
    for (const l of s.lessons) {
      const r = this.lesson(s, l.id, studentId);
      xp += r.xp;
      gems += r.gems;
      if (l.isExam) {
        const e = this.exam(s, l.id, studentId);
        xp += e.xp;
        gems += e.gems;
      }
    }
    return { xp, gems };
  }

  level(totalXp: number) {
    return calcLevel(totalXp);
  }

  board(s: GroupSnapshot): BoardEntry[] {
    const rows = s.memberIds.map((id) => ({ studentId: id, name: s.names.get(id) ?? '', ...this.totals(s, id) }));
    rows.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  homeworkView(s: GroupSnapshot, lessonId: string, studentId: string) {
    const hw = s.homeworks.get(lessonId);
    if (!hw) return { status: 'not-assigned', dueAt: null, ball: null, rawBall: null, late: false, submittedAt: null };
    const k = key(lessonId, studentId);
    const row = s.sh.get(k);
    const calc = this.lesson(s, lessonId, studentId);
    const sub = s.lastSub.get(k);
    return {
      status: HW_KEY[row?.status ?? HomeworkStatus.NOT_DONE],
      dueAt: row?.dueAt ?? hw.dueAt,
      ball: calc.ball,
      rawBall: calc.rawBall,
      late: !!sub?.late,
      submittedAt: sub?.at ?? null,
    };
  }

  async previousRanks(groupId: string): Promise<Map<string, number>> {
    const last = await this.snaps
      .createQueryBuilder('r')
      .select('MAX(r.week)', 'week')
      .where('r.groupId = :groupId', { groupId })
      .getRawOne<{ week: string | null }>();
    const map = new Map<string, number>();
    if (!last?.week) return map;
    const rows = await this.snaps.find({ where: { groupId, week: last.week } });
    rows.forEach((r) => map.set(r.studentId, r.rank));
    return map;
  }

  async leaderboard(groupId: string) {
    const [snap, previous] = await Promise.all([this.loadGroup(groupId), this.previousRanks(groupId)]);
    return this.board(snap).map((e) => ({
      ...e,
      delta: previous.has(e.studentId) ? previous.get(e.studentId) - e.rank : 0,
    }));
  }

  async overview() {
    const [groups, students] = await Promise.all([
      this.groups.find({ where: { isActive: true } }),
      this.users.find({ where: { role: Role.STUDENT, isActive: true } }),
    ]);
    const snaps = new Map<string, GroupSnapshot>();
    const totals = new Map<string, { xp: number; gems: number }>(
      students.map((u) => [u.id, { xp: 0, gems: 0 }] as [string, { xp: number; gems: number }]),
    );
    for (const g of groups) {
      const snap = await this.loadGroup(g.id);
      snaps.set(g.id, snap);
      for (const id of snap.memberIds) {
        const t = this.totals(snap, id);
        const current = totals.get(id) ?? { xp: 0, gems: 0 };
        totals.set(id, { xp: current.xp + t.xp, gems: current.gems + t.gems });
      }
    }
    const ranking = students
      .map((u) => ({ id: u.id, name: u.fullName, ...(totals.get(u.id) ?? { xp: 0, gems: 0 }) }))
      .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
    return { groups, snaps, totals, ranking };
  }

  async studentSummary(studentId: string) {
    const { groups, snaps, totals, ranking } = await this.overview();
    const mine = totals.get(studentId) ?? { xp: 0, gems: 0 };
    const groupRanks = groups
      .filter((g) => snaps.get(g.id)?.memberIds.includes(studentId))
      .map((g) => {
        const board = this.board(snaps.get(g.id));
        const entry = board.find((e) => e.studentId === studentId);
        return { groupId: g.id, groupName: g.name, rank: entry?.rank ?? board.length, size: board.length };
      });
    const index = ranking.findIndex((r) => r.id === studentId);
    return {
      xp: mine.xp,
      gems: mine.gems,
      ...this.level(mine.xp),
      overallRank: index === -1 ? ranking.length : index + 1,
      totalStudents: ranking.length,
      groupRanks,
    };
  }

  @Cron('0 0 * * 1', { timeZone: 'Asia/Tashkent' })
  async weeklySnapshot() {
    await this.snapshotAll();
  }

  async snapshotAll() {
    const week = mondayKey(new Date());
    const groups = await this.groups.find({ where: { isActive: true } });
    let rows = 0;
    for (const g of groups) {
      const snap = await this.loadGroup(g.id);
      const data = this.board(snap).map((e) => ({ groupId: g.id, studentId: e.studentId, week, rank: e.rank }));
      if (data.length) {
        await this.snaps.upsert(data, ['groupId', 'studentId', 'week']);
        rows += data.length;
      }
    }
    return { week, rows };
  }
}
