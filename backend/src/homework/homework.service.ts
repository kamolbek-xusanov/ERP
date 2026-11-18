import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { HomeworkStatus } from '../common/enums';
import { addHours, fieldError } from '../common/utils';
import { FILE_RULES, RULES } from '../config/rules';
import {
  GroupMember,
  Homework,
  HomeworkAttachment,
  Lesson,
  StudentHomework,
  Submission,
  SubmissionFile,
} from '../database/entities';
import { FilesService } from '../files/files.service';
import { LessonsService } from '../lessons/lessons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignHomeworkDto } from './homework.dto';
import { SubmitHomeworkDto } from '../lessons/lessons.dto';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework) private readonly homeworks: Repository<Homework>,
    @InjectRepository(HomeworkAttachment) private readonly attachments: Repository<HomeworkAttachment>,
    @InjectRepository(StudentHomework) private readonly sh: Repository<StudentHomework>,
    @InjectRepository(Submission) private readonly subs: Repository<Submission>,
    @InjectRepository(SubmissionFile) private readonly subFiles: Repository<SubmissionFile>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    private readonly lessons: LessonsService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
    private readonly ds: DataSource,
  ) {}

  async assign(lessonId: string, teacherId: string, dto: AssignHomeworkDto) {
    const lesson = await this.lessons.getOwned(lessonId, teacherId);
    const steps = dto.steps.map((s) => s.trim()).filter(Boolean);
    if (!steps.length) throw fieldError('steps', 'Kamida bitta qadam kiriting.');
    const task = dto.task.trim();
    if (task.length < 10) throw fieldError('task', "Vazifa matni kamida 10 belgi bo'lsin.");
    const attachmentIds = [...new Set(dto.attachmentIds ?? [])];
    await this.files.assertOwned(attachmentIds, teacherId);
    const now = new Date();
    const dueAt = addHours(now, dto.limitHours);
    const members = await this.members.find({ where: { groupId: lesson.groupId } });
    const isNew = await this.ds.transaction(async (em) => {
      let hw = await em.findOneBy(Homework, { lessonId });
      const created = !hw;
      if (!hw) {
        hw = await em.save(em.create(Homework, { lessonId, task, steps, assignedAt: now, dueAt, timeLimitHours: dto.limitHours }));
      } else {
        await em.update(Homework, { id: hw.id }, { task, steps, assignedAt: now, dueAt, timeLimitHours: dto.limitHours });
        await em.update(
          StudentHomework,
          { homeworkId: hw.id, status: HomeworkStatus.NOT_DONE },
          { assignedAt: now, dueAt },
        );
      }
      const existing = await em.find(StudentHomework, { where: { homeworkId: hw.id } });
      const have = new Set(existing.map((e) => e.studentId));
      const missing = members.filter((m) => !have.has(m.studentId));
      if (missing.length) {
        await em.insert(
          StudentHomework,
          missing.map((m) => ({ homeworkId: hw.id, studentId: m.studentId, status: HomeworkStatus.NOT_DONE, assignedAt: now, dueAt })),
        );
      }
      await em.delete(HomeworkAttachment, { homeworkId: hw.id });
      if (attachmentIds.length) {
        await em.insert(HomeworkAttachment, attachmentIds.map((fileId) => ({ homeworkId: hw.id, fileId })));
      }
      return created;
    });
    if (isNew) {
      await this.notifications.notify(
        members.map((m) => m.studentId),
        'homework_assigned',
        `Yangi vazifa: ${lesson.title}`,
        `/lessons/${lesson.id}`,
      );
    }
    const hw = await this.homeworks.findOneBy({ lessonId });
    return {
      id: hw.id,
      lessonId,
      task: hw.task,
      steps: hw.steps,
      assignedAt: hw.assignedAt,
      dueAt: hw.dueAt,
      timeLimit: hw.timeLimitHours,
      attachments: await this.attachmentsOf(hw.id),
    };
  }

  async attachmentsOf(homeworkId: string) {
    const rows = await this.attachments.find({ where: { homeworkId } });
    return this.files.meta(rows.map((r) => r.fileId));
  }

  async submissionView(submission: Submission) {
    const rows = await this.subFiles.find({ where: { submissionId: submission.id } });
    return {
      id: submission.id,
      text: submission.text,
      files: await this.files.meta(rows.map((r) => r.fileId)),
      submittedAt: submission.submittedAt,
      late: submission.isLate,
    };
  }

  async latestSubmission(homeworkId: string, studentId: string) {
    return this.subs.findOne({ where: { homeworkId, studentId }, order: { submittedAt: 'DESC' } });
  }

  async submit(studentId: string, lessonId: string, dto: SubmitHomeworkDto) {
    const lesson = await this.lessons.getForStudent(lessonId, studentId);
    const hw = await this.homeworks.findOneBy({ lessonId });
    if (!hw) throw new NotFoundException('Bu darsga vazifa berilmagan.');
    const row = await this.sh.findOneBy({ homeworkId: hw.id, studentId });
    if (!row) throw new NotFoundException('Vazifa topilmadi.');
    if (!(await this.lessons.ratingOf(lessonId, studentId))) throw fieldError('rating', 'Vazifani topshirishdan oldin darsni baholang.');
    if (row.status !== HomeworkStatus.NOT_DONE && row.status !== HomeworkStatus.RETURNED) {
      throw new ConflictException('Vazifa allaqachon topshirilgan.');
    }
    const text = (dto.text ?? '').trim();
    const fileIds = [...new Set(dto.fileIds ?? [])];
    if (text.length > 2000) throw fieldError('text', "Javob matni 2000 belgidan oshmasin.");
    if (!text && !fileIds.length) throw fieldError('text', 'Javob yozing yoki kamida bitta fayl biriktiring.');
    if (fileIds.length > FILE_RULES.answer.maxCount) {
      throw fieldError('fileIds', `Eng ko'pi bilan ${FILE_RULES.answer.maxCount} ta fayl biriktirish mumkin.`);
    }
    await this.files.assertOwned(fileIds, studentId);
    const now = new Date();
    const late = now > row.dueAt;
    const submission = await this.ds.transaction(async (em) => {
      const saved = await em.save(em.create(Submission, { homeworkId: hw.id, studentId, text, submittedAt: now, isLate: late }));
      if (fileIds.length) await em.insert(SubmissionFile, fileIds.map((fileId) => ({ submissionId: saved.id, fileId })));
      await em.update(StudentHomework, { homeworkId: hw.id, studentId }, { status: HomeworkStatus.PENDING });
      return saved;
    });
    await this.notifications.notify([lesson.group.teacherId], 'homework_submitted', `Yangi topshirilgan ish: ${lesson.title}`, `/teacher/review`);
    return { ...(await this.submissionView(submission)), status: HomeworkStatus.PENDING };
  }

  private async ownedRow(lessonId: string, teacherId: string, studentId: string) {
    const lesson = await this.lessons.getOwned(lessonId, teacherId);
    const hw = await this.homeworks.findOneBy({ lessonId });
    if (!hw) throw new NotFoundException('Bu darsga vazifa berilmagan.');
    const row = await this.sh.findOneBy({ homeworkId: hw.id, studentId });
    if (!row) throw new NotFoundException("O'quvchi uchun vazifa topilmadi.");
    return { lesson, hw, row };
  }

  async getSubmission(lessonId: string, teacherId: string, studentId: string) {
    const { hw, row } = await this.ownedRow(lessonId, teacherId, studentId);
    const submission = await this.latestSubmission(hw.id, studentId);
    const view = submission ? await this.submissionView(submission) : { text: '', files: [], submittedAt: null, late: false };
    return {
      ...view,
      status: row.status,
      dueAt: row.dueAt,
      grade: row.grade ?? undefined,
      feedback: row.feedback ?? undefined,
    };
  }

  async grade(lessonId: string, teacherId: string, studentId: string, ball: number) {
    const { lesson, hw, row } = await this.ownedRow(lessonId, teacherId, studentId);
    if (row.status !== HomeworkStatus.PENDING && row.status !== HomeworkStatus.DONE) {
      throw new ConflictException('Bu ish hali topshirilmagan.');
    }
    await this.sh.update(
      { homeworkId: hw.id, studentId },
      { status: HomeworkStatus.DONE, grade: ball, feedback: null, gradedAt: new Date(), gradedBy: teacherId },
    );
    await this.notifications.notify([studentId], 'homework_graded', `“${lesson.title}” vazifangiz baholandi: ${ball} ball`, `/lessons/${lesson.id}`);
    await this.notifications.activity(studentId, 'lesson', `“${lesson.title}” vazifasi baholandi: ${ball} ball`, ball);
  }

  async returnWork(lessonId: string, teacherId: string, studentId: string, feedback: string) {
    const { lesson, hw, row } = await this.ownedRow(lessonId, teacherId, studentId);
    if (row.status !== HomeworkStatus.PENDING && row.status !== HomeworkStatus.DONE) {
      throw new ConflictException('Bu ish hali topshirilmagan.');
    }
    const clean = feedback.trim();
    if (!clean) throw fieldError('feedback', 'Izoh yozish majburiy.');
    const now = new Date();
    await this.sh.update(
      { homeworkId: hw.id, studentId },
      {
        status: HomeworkStatus.RETURNED,
        assignedAt: now,
        dueAt: addHours(now, RULES.RETURN_EXTENSION_H),
        grade: null,
        feedback: clean,
        gradedAt: null,
        gradedBy: null,
      },
    );
    await this.notifications.notify([studentId], 'homework_returned', `“${lesson.title}” vazifangiz qaytarildi`, `/lessons/${lesson.id}`);
  }

  async review(teacherId: string, groupId?: string) {
    const qb = this.sh
      .createQueryBuilder('s')
      .innerJoinAndMapOne('s.hw', Homework, 'h', 'h.id = s.homeworkId')
      .innerJoinAndMapOne('s.lesson', Lesson, 'l', 'l.id = h.lessonId')
      .innerJoinAndSelect('l.group', 'g')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.status = :status AND g.teacherId = :teacherId', { status: HomeworkStatus.PENDING, teacherId });
    if (groupId) qb.andWhere('g.id = :groupId', { groupId });
    const rows: any[] = await qb.orderBy('s.assignedAt', 'ASC').getMany();
    const hwIds = rows.map((r) => r.homeworkId);
    const subs = hwIds.length ? await this.subs.find({ where: { homeworkId: In(hwIds) }, order: { submittedAt: 'ASC' } }) : [];
    const latest = new Map<string, Submission>();
    subs.forEach((s) => latest.set(`${s.homeworkId}:${s.studentId}`, s));
    return rows
      .map((r) => {
        const sub = latest.get(`${r.homeworkId}:${r.studentId}`);
        return {
          lessonId: r.lesson.id,
          lessonTitle: r.lesson.title,
          groupId: r.lesson.group.id,
          groupName: r.lesson.group.name,
          studentId: r.studentId,
          studentName: r.student.fullName,
          submittedAt: sub?.submittedAt ?? null,
          late: sub?.isLate ?? false,
        };
      })
      .sort((a, b) => +new Date(a.submittedAt ?? 0) - +new Date(b.submittedAt ?? 0));
  }

  async pendingCounts(groupIds: string[]) {
    const map = new Map<string, number>();
    if (!groupIds.length) return map;
    const rows = await this.sh
      .createQueryBuilder('s')
      .innerJoin(Homework, 'h', 'h.id = s.homeworkId')
      .innerJoin(Lesson, 'l', 'l.id = h.lessonId')
      .select('l.groupId', 'groupId')
      .addSelect('COUNT(*)', 'count')
      .where('s.status = :status AND l.groupId IN (:...groupIds)', { status: HomeworkStatus.PENDING, groupIds })
      .groupBy('l.groupId')
      .getRawMany<{ groupId: string; count: string }>();
    rows.forEach((r) => map.set(r.groupId, Number(r.count)));
    return map;
  }
}
