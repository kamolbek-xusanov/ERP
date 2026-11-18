import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { URL_RE, fieldError } from '../common/utils';
import { RULES } from '../config/rules';
import { GroupMember, Lesson, LessonRating, StoredFile } from '../database/entities';
import { FilesService } from '../files/files.service';
import { GroupsService } from '../groups/groups.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StartLessonDto, UpdateLessonInfoDto } from './lessons.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(StoredFile) private readonly files: Repository<StoredFile>,
    @InjectRepository(LessonRating) private readonly ratings: Repository<LessonRating>,
    private readonly groups: GroupsService,
    private readonly filesService: FilesService,
    private readonly notifications: NotificationsService,
    private readonly ds: DataSource,
  ) {}

  async ratingOf(lessonId: string, studentId: string) {
    const row = await this.ratings.findOneBy({ lessonId, studentId });
    return row ? { stars: row.stars, comment: row.comment } : null;
  }

  async rate(studentId: string, lessonId: string, stars: number, comment?: string) {
    await this.getForStudent(lessonId, studentId);
    await this.ratings.upsert({ lessonId, studentId, stars, comment: (comment ?? '').trim() }, ['lessonId', 'studentId']);
    return { stars, comment: (comment ?? '').trim() };
  }

  ratingsOfLesson(lessonId: string) {
    return this.ratings.find({ where: { lessonId }, order: { createdAt: 'DESC' } });
  }

  view(l: Lesson) {
    return {
      id: l.id,
      groupId: l.groupId,
      title: l.title,
      description: l.description,
      startsAt: l.startsAt,
      durationMin: l.durationMin,
      videoUrl: l.videoUrl,
      videoFileId: l.videoFileId,
      isExam: l.isExam,
      attendanceSaved: l.attendanceSaved,
    };
  }

  async getOrFail(id: string): Promise<Lesson> {
    const lesson = await this.lessons.findOne({ where: { id }, relations: { group: true } });
    if (!lesson) throw new NotFoundException('Dars topilmadi.');
    return lesson;
  }

  async getOwned(lessonId: string, teacherId: string): Promise<Lesson> {
    const lesson = await this.getOrFail(lessonId);
    if (lesson.group.teacherId !== teacherId) throw new ForbiddenException('Bu dars sizning guruhingizga tegishli emas.');
    return lesson;
  }

  async getForStudent(lessonId: string, studentId: string): Promise<Lesson> {
    const lesson = await this.getOrFail(lessonId);
    const member = await this.members.findOneBy({ groupId: lesson.groupId, studentId });
    if (!member) throw new ForbiddenException("Siz bu guruh a'zosi emassiz.");
    return lesson;
  }

  async start(teacherId: string, dto: StartLessonDto) {
    const group = await this.groups.assertTeacherOwns(dto.groupId, teacherId);
    const lesson = await this.lessons.save(
      this.lessons.create({
        groupId: group.id,
        title: dto.title.trim(),
        description: '',
        startsAt: new Date(),
        durationMin: RULES.DEFAULT_LESSON_DURATION,
        isExam: !!dto.isExam,
        createdBy: teacherId,
      }),
    );
    const members = await this.members.find({ where: { groupId: group.id } });
    await this.notifications.notify(
      members.map((m) => m.studentId),
      'new_lesson',
      dto.isExam ? `Yangi imtihon boshlandi: ${lesson.title}` : `Yangi dars boshlandi: ${lesson.title}`,
      `/lessons/${lesson.id}`,
    );
    return this.view(lesson);
  }

  async updateInfo(lessonId: string, teacherId: string, dto: UpdateLessonInfoDto) {
    const lesson = await this.getOwned(lessonId, teacherId);
    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (description && description.length < 10) {
        throw fieldError('description', "Tavsif bo'sh yoki kamida 10 belgi bo'lsin.");
      }
      lesson.description = description;
    }
    const url = dto.videoUrl?.trim();
    if (url && dto.videoFileId) throw fieldError('videoUrl', 'Video havola yoki fayl: bittasini tanlang.');
    if (dto.videoUrl !== undefined && !dto.videoFileId) {
      if (url && !URL_RE.test(url)) throw fieldError('videoUrl', "Havola http:// yoki https:// bilan boshlansin.");
      lesson.videoUrl = url || null;
      if (url) lesson.videoFileId = null;
    }
    if (dto.videoFileId) {
      const [file] = await this.filesService.assertOwned([dto.videoFileId], teacherId);
      if (!file.mimeType.startsWith('video/') && !/\.(mp4|webm|mov|m4v)$/i.test(file.originalName)) {
        throw fieldError('videoFileId', 'Video fayl tanlang.');
      }
      lesson.videoFileId = file.id;
      lesson.videoUrl = null;
    }
    lesson.durationMin = dto.durationMin;
    return this.view(await this.lessons.save(lesson));
  }

  async setProgress(studentId: string, lessonId: string, percent: number) {
    await this.getForStudent(lessonId, studentId);
    const rows: { percent: number }[] = await this.ds.query(
      `INSERT INTO lesson_progress (lesson_id, student_id, percent, completed_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::int, CASE WHEN $3::int >= 100 THEN now() END, now())
       ON CONFLICT (lesson_id, student_id) DO UPDATE SET
         percent = GREATEST(lesson_progress.percent, EXCLUDED.percent),
         completed_at = CASE WHEN GREATEST(lesson_progress.percent, EXCLUDED.percent) >= 100
           THEN COALESCE(lesson_progress.completed_at, now()) ELSE NULL END,
         updated_at = now()
       RETURNING percent`,
      [lessonId, studentId, percent],
    );
    const progress = rows[0].percent;
    return { progress, completed: progress >= 100 };
  }

  assertStarted(lesson: Lesson) {
    if (lesson.startsAt > new Date()) throw new ConflictException("Rejalashtirilgan darsga davomat qo'yib bo'lmaydi.");
  }
}
