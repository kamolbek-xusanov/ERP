import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Attendance, GroupMember, Lesson, LessonProgress } from '../database/entities';
import { LessonsService } from './lessons.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private readonly attendance: Repository<Attendance>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(LessonProgress) private readonly progress: Repository<LessonProgress>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    private readonly lessonsService: LessonsService,
    private readonly ds: DataSource,
  ) {}

  private async editable(lessonId: string, teacherId: string) {
    const lesson = await this.lessonsService.getOwned(lessonId, teacherId);
    this.lessonsService.assertStarted(lesson);
    if (lesson.attendanceSaved) throw new ConflictException('Davomat saqlangan.');
    return lesson;
  }

  private async computed(lesson: Lesson) {
    const [members, marks, progress] = await Promise.all([
      this.members.find({ where: { groupId: lesson.groupId } }),
      this.attendance.find({ where: { lessonId: lesson.id } }),
      this.progress.find({ where: { lessonId: lesson.id } }),
    ]);
    const explicit = new Map(marks.map((m) => [m.studentId, m.present] as [string, boolean]));
    const watched = new Map(progress.map((p) => [p.studentId, p.percent] as [string, number]));
    return members.map((m) => ({
      studentId: m.studentId,
      explicit: explicit.has(m.studentId),
      attended: explicit.has(m.studentId) ? explicit.get(m.studentId) : (watched.get(m.studentId) ?? 0) >= 100,
    }));
  }

  async mark(lessonId: string, teacherId: string, studentId: string, present: boolean) {
    const lesson = await this.editable(lessonId, teacherId);
    const member = await this.members.findOneBy({ groupId: lesson.groupId, studentId });
    if (!member) throw new NotFoundException("O'quvchi bu guruhda emas.");
    const now = new Date();
    await this.attendance.upsert(
      { lessonId, studentId, present, markedBy: teacherId, markedAt: now, arrivedAt: present ? now : null, leftAt: null },
      ['lessonId', 'studentId'],
    );
  }

  /** O'quvchi darsdan ketdi: ketish vaqti yoziladi (keldi vaqti bo'lmasa u ham yoziladi). */
  async leave(lessonId: string, teacherId: string, studentId: string) {
    const lesson = await this.editable(lessonId, teacherId);
    const member = await this.members.findOneBy({ groupId: lesson.groupId, studentId });
    if (!member) throw new NotFoundException("O'quvchi bu guruhda emas.");
    const now = new Date();
    const row = await this.attendance.findOneBy({ lessonId, studentId });
    await this.attendance.upsert(
      { lessonId, studentId, present: true, markedBy: teacherId, markedAt: now, arrivedAt: row?.arrivedAt ?? now, leftAt: now },
      ['lessonId', 'studentId'],
    );
  }

  async markAll(lessonId: string, teacherId: string) {
    const lesson = await this.editable(lessonId, teacherId);
    const rows = (await this.computed(lesson)).filter((r) => !r.attended);
    if (!rows.length) return;
    await this.attendance.upsert(
      rows.map((r) => ({ lessonId, studentId: r.studentId, present: true, markedBy: teacherId, markedAt: new Date(), arrivedAt: new Date(), leftAt: null })),
      ['lessonId', 'studentId'],
    );
  }

  async save(lessonId: string, teacherId: string) {
    const lesson = await this.editable(lessonId, teacherId);
    const rows = await this.computed(lesson);
    await this.ds.transaction(async (em) => {
      if (rows.length) {
        await em.upsert(
          Attendance,
          rows.map((r) => ({ lessonId, studentId: r.studentId, present: r.attended, markedBy: teacherId, markedAt: new Date() })),
          ['lessonId', 'studentId'],
        );
      }
      await em.update(Lesson, { id: lessonId }, { attendanceSaved: true });
    });
  }

  async marksFor(lessonIds: string[]) {
    if (!lessonIds.length) return [];
    return this.attendance.find({ where: { lessonId: In(lessonIds) } });
  }
}
