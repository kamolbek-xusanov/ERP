import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HomeworkStatus } from '../common/enums';
import { average } from '../common/utils';
import { openPassword } from '../common/credentials';
import { Lesson, User } from '../database/entities';
import { AttendanceService } from '../lessons/attendance.service';
import { ExamsService } from '../exams/exams.service';
import { GroupsService } from '../groups/groups.service';
import { HomeworkService } from '../homework/homework.service';
import { LessonsService } from '../lessons/lessons.service';
import { RewardsService, key } from '../rewards/rewards.service';

@Injectable()
export class TeacherService {
  constructor(
    private readonly groups: GroupsService,
    private readonly rewards: RewardsService,
    private readonly exams: ExamsService,
    private readonly homework: HomeworkService,
    private readonly lessons: LessonsService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly attendance: AttendanceService,
  ) {}

  async dashboard(teacherId: string) {
    const groups = await this.groups.groupsOfTeacher(teacherId);
    const described = await this.groups.describe(groups);
    const pending = await this.homework.pendingCounts(groups.map((g) => g.id));
    const waitingReview = [...pending.values()].reduce((a, b) => a + b, 0);
    const lessonsHeld = groups.length
      ? await this.lessonRepo
          .createQueryBuilder('l')
          .where('l.groupId IN (:...ids) AND l.startsAt <= now()', { ids: groups.map((g) => g.id) })
          .getCount()
      : 0;
    return {
      groups: described.map((g) => ({ id: g.id, name: g.name, course: g.course, members: g.members })),
      waitingReview,
      upcomingLessons: described
        .filter((g) => g.nextSession)
        .map((g) => ({ groupId: g.id, groupName: g.name, ...g.nextSession }))
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
      stats: {
        groups: groups.length,
        students: described.reduce((sum, g) => sum + g.members, 0),
        lessonsHeld,
        waitingReview,
      },
    };
  }

  async myGroups(teacherId: string) {
    const groups = await this.groups.groupsOfTeacher(teacherId);
    const described = await this.groups.describe(groups);
    const pending = await this.homework.pendingCounts(groups.map((g) => g.id));
    return described.map((g) => ({
      id: g.id,
      name: g.name,
      course: g.course,
      members: g.members,
      schedule: g.schedule,
      nextSession: g.nextSession,
      waitingCount: pending.get(g.id) ?? 0,
    }));
  }

  async groupStudents(teacherId: string, groupId: string) {
    await this.groups.assertTeacherOwns(groupId, teacherId);
    const snap = await this.rewards.loadGroup(groupId);
    const now = new Date();
    const held = snap.lessons.filter((l) => l.startsAt <= now);
    const accounts = snap.memberIds.length ? await this.userRepo.find({ where: { id: In(snap.memberIds) } }) : [];
    const account = new Map(accounts.map((u) => [u.id, u] as [string, User]));
    return this.rewards.board(snap).map((entry) => {
      let attended = 0;
      let assigned = 0;
      let done = 0;
      let pending = 0;
      const balls: number[] = [];
      for (const l of snap.lessons) {
        const calc = this.rewards.lesson(snap, l.id, entry.studentId);
        if (l.startsAt <= now && calc.attended) attended += 1;
        const row = snap.sh.get(key(l.id, entry.studentId));
        if (snap.homeworks.has(l.id) && row) {
          assigned += 1;
          if (row.status === HomeworkStatus.DONE) done += 1;
          if (row.status === HomeworkStatus.PENDING) pending += 1;
        }
        if (calc.ball != null) balls.push(calc.ball);
      }
      return {
        studentId: entry.studentId,
        name: entry.name,
        login: account.get(entry.studentId)?.login ?? '',
        phone: account.get(entry.studentId)?.phone ?? null,
        password: openPassword(account.get(entry.studentId)?.credentialEnc),
        rank: entry.rank,
        xp: entry.xp,
        gems: entry.gems,
        avgBall: average(balls),
        held: held.length,
        attended,
        assigned,
        done,
        pending,
      };
    });
  }

  async groupLessons(teacherId: string, groupId: string, order?: string, q?: string) {
    await this.groups.assertTeacherOwns(groupId, teacherId);
    const snap = await this.rewards.loadGroup(groupId);
    const now = new Date();
    const { exams, since } = this.exams.structure(snap);
    const needle = q?.trim().toLowerCase();
    let list = snap.lessons.filter((l) => !needle || l.title.toLowerCase().includes(needle));
    list = order === 'oldest' ? list : [...list].reverse();
    return {
      lessons: list.map((l) => {
        const counts = { attended: 0, handedIn: 0, pending: 0, done: 0, returned: 0, notDone: 0 };
        for (const id of snap.memberIds) {
          if (l.startsAt <= now && this.rewards.lesson(snap, l.id, id).attended) counts.attended += 1;
          const row = snap.sh.get(key(l.id, id));
          if (!row) continue;
          if (row.status === HomeworkStatus.PENDING) counts.pending += 1;
          if (row.status === HomeworkStatus.DONE) counts.done += 1;
          if (row.status === HomeworkStatus.RETURNED) counts.returned += 1;
          if (row.status === HomeworkStatus.NOT_DONE) counts.notDone += 1;
        }
        counts.handedIn = counts.pending + counts.done;
        const hw = snap.homeworks.get(l.id);
        return {
          id: l.id,
          title: l.title,
          startsAt: l.startsAt,
          isExam: l.isExam,
          upcoming: l.startsAt > now,
          attendanceSaved: l.attendanceSaved,
          summary: { students: snap.memberIds.length, ...counts },
          homework: { given: !!hw, dueAt: hw?.dueAt ?? null, timeLimit: hw?.timeLimitHours ?? null },
        };
      }),
      exams: exams.map((e) => {
        const states = snap.memberIds.map((id) => this.exams.state(snap, e, id, now).state);
        return {
          id: e.lesson.id,
          number: e.number,
          date: e.lesson.startsAt,
          title: e.lesson.title,
          admitted: states.filter((s) => s !== 'blocked').length,
          total: states.length,
          graded: states.filter((s) => s === 'done').length,
        };
      }),
      sinceLastExam: since.length,
    };
  }

  async lessonDetail(teacherId: string, lessonId: string) {
    const lesson = await this.lessons.getOwned(lessonId, teacherId);
    const snap = await this.rewards.loadGroup(lesson.groupId);
    const hw = snap.homeworks.get(lesson.id);
    const marks = new Map((await this.attendance.marksFor([lesson.id])).map((m) => [m.studentId, m] as [string, (typeof m)]));
    const ratingRows = await this.lessons.ratingsOfLesson(lesson.id);
    return {
      ratings: {
        average: average(ratingRows.map((r) => r.stars)),
        count: ratingRows.length,
        items: ratingRows.map((r) => ({ studentId: r.studentId, name: snap.names.get(r.studentId) ?? '', stars: r.stars, comment: r.comment })),
      },
      lesson: this.lessons.view(lesson),
      video: lesson.videoFileId
        ? { fileId: lesson.videoFileId, fileUrl: `/api/v1/files/${lesson.videoFileId}` }
        : { url: lesson.videoUrl ?? undefined },
      homework: hw
        ? {
            id: hw.id,
            task: hw.task,
            steps: hw.steps,
            assignedAt: hw.assignedAt,
            dueAt: hw.dueAt,
            timeLimit: hw.timeLimitHours,
            attachments: await this.homework.attachmentsOf(hw.id),
          }
        : null,
      attendanceSaved: lesson.attendanceSaved,
      students: snap.memberIds
        .map((id) => {
          const view = this.rewards.homeworkView(snap, lesson.id, id);
          return {
            studentId: id,
            name: snap.names.get(id),
            attended: this.rewards.lesson(snap, lesson.id, id).attended,
            arrivedAt: marks.get(id)?.arrivedAt ?? null,
            leftAt: marks.get(id)?.leftAt ?? null,
            homework: {
              status: view.status,
              submittedAt: view.submittedAt,
              late: view.late,
              ball: view.ball,
              rawBall: view.rawBall,
            },
            canReview: view.status === 'pending' || view.status === 'done',
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
      sameGroupLessons: snap.lessons
        .filter((l) => l.id !== lesson.id)
        .map((l) => ({ id: l.id, title: l.title, startsAt: l.startsAt, isExam: l.isExam }))
        .reverse(),
    };
  }

  async journal(teacherId: string, groupId: string) {
    await this.groups.assertTeacherOwns(groupId, teacherId);
    const snap = await this.rewards.loadGroup(groupId);
    const now = new Date();
    const { exams } = this.exams.structure(snap);
    const examByLesson = new Map(exams.map((e) => [e.lesson.id, e]));
    const columns: Record<string, unknown>[] = [];
    for (const l of snap.lessons) {
      columns.push({ kind: 'lesson', id: l.id, title: l.title, startsAt: l.startsAt, isExam: l.isExam, saved: l.attendanceSaved, upcoming: l.startsAt > now });
      const exam = examByLesson.get(l.id);
      if (exam) columns.push({ kind: 'exam', id: l.id, number: exam.number, title: l.title, startsAt: l.startsAt });
    }
    const started = snap.lessons.filter((l) => l.startsAt <= now);
    const rows = snap.memberIds
      .map((id) => {
        const cells: Record<string, string> = {};
        let attended = 0;
        for (const l of snap.lessons) {
          if (l.startsAt > now) {
            cells[l.id] = 'upcoming';
            continue;
          }
          const present = this.rewards.lesson(snap, l.id, id).attended;
          cells[l.id] = present ? 'present' : 'absent';
          if (present) attended += 1;
        }
        const examCells: Record<string, { state: string; ball?: number }> = {};
        for (const exam of exams) {
          const st = this.exams.state(snap, exam, id, now);
          examCells[exam.lesson.id] = { state: st.state, ball: st.ball ?? undefined };
        }
        return {
          studentId: id,
          name: snap.names.get(id),
          cells,
          examCells,
          held: started.length,
          attended,
          percent: started.length ? Math.round((attended / started.length) * 100) : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return { columns, rows };
  }
}
