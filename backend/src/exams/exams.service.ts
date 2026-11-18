import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeworkStatus } from '../common/enums';
import { ExamResult, Lesson } from '../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { splitExams } from '../rewards/rewards.calc';
import { GroupSnapshot, RewardsService, key } from '../rewards/rewards.service';

export type ExamState = 'done' | 'ready' | 'blocked';

export interface ExamBlock {
  lesson: Lesson;
  number: number;
  covered: Lesson[];
}

@Injectable()
export class ExamsService {
  constructor(
    private readonly rewards: RewardsService,
    private readonly notifications: NotificationsService,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(ExamResult) private readonly results: Repository<ExamResult>,
  ) {}

  structure(snap: GroupSnapshot) {
    return splitExams(snap.lessons);
  }

  state(snap: GroupSnapshot, exam: ExamBlock, studentId: string, now = new Date()) {
    const result = snap.exams.get(key(exam.lesson.id, studentId));
    const missing = exam.covered.filter((l) => {
      const hw = snap.homeworks.get(l.id);
      const row = snap.sh.get(key(l.id, studentId));
      return !!hw && !!row && row.status === HomeworkStatus.NOT_DONE && row.dueAt < now;
    });
    if (result) return { state: 'done' as ExamState, ball: result.ball, missing };
    return { state: (missing.length ? 'blocked' : 'ready') as ExamState, ball: null as number | null, missing };
  }

  async ownedExam(examId: string, teacherId: string) {
    const lesson = await this.lessons.findOne({ where: { id: examId }, relations: { group: true } });
    if (!lesson || !lesson.isExam) throw new NotFoundException('Imtihon topilmadi.');
    if (lesson.group.teacherId !== teacherId) throw new ForbiddenException('Bu imtihon sizning guruhingizga tegishli emas.');
    return lesson;
  }

  async detail(examId: string, teacherId: string) {
    const lesson = await this.ownedExam(examId, teacherId);
    const snap = await this.rewards.loadGroup(lesson.groupId);
    const { exams } = this.structure(snap);
    const exam = exams.find((e) => e.lesson.id === examId);
    const now = new Date();
    return {
      exam: { id: lesson.id, number: exam.number, date: lesson.startsAt, title: lesson.title, groupId: lesson.groupId, coveredLessons: exam.covered.length },
      students: snap.memberIds
        .map((id) => {
          const st = this.state(snap, exam, id, now);
          return {
            studentId: id,
            name: snap.names.get(id),
            state: st.state,
            ball: st.ball ?? undefined,
            missingLessons: st.state === 'blocked' ? st.missing.map((m) => ({ id: m.id, title: m.title })) : undefined,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async setBall(examId: string, teacherId: string, studentId: string, ball: number) {
    const lesson = await this.ownedExam(examId, teacherId);
    const snap = await this.rewards.loadGroup(lesson.groupId);
    if (!snap.memberIds.includes(studentId)) throw new NotFoundException("O'quvchi bu guruhda emas.");
    const exam = this.structure(snap).exams.find((e) => e.lesson.id === examId);
    const st = this.state(snap, exam, studentId);
    if (st.state === 'blocked') throw new ConflictException("O'quvchi imtihonga kirish shartini bajarmagan: vazifalar topshirilmagan.");
    await this.results.upsert(
      { lessonId: examId, studentId, ball, enteredBy: teacherId, enteredAt: new Date() },
      ['lessonId', 'studentId'],
    );
    await this.notifications.notify([studentId], 'exam_graded', `“${lesson.title}” imtihon natijasi: ${ball} ball`, `/lessons/${lesson.id}`);
    await this.notifications.activity(studentId, 'rank', `“${lesson.title}” imtihonidan ${ball} ball oldingiz`, ball);
  }
}
