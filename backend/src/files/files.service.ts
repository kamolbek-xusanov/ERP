import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, promises as fs } from 'fs';
import { extname, join } from 'path';
import { Request, Response } from 'express';
import { In, Repository } from 'typeorm';
import { Role } from '../common/enums';
import { AuthUser } from '../common/security';
import { FILE_RULES, FilePurpose, UPLOAD_DIR } from '../config/rules';
import {
  Group,
  GroupMember,
  Homework,
  HomeworkAttachment,
  Lesson,
  StoredFile,
  Submission,
  SubmissionFile,
  User,
} from '../database/entities';

const MIME_BY_EXT: Record<string, string[]> = {
  pdf: ['application/pdf'],
  zip: ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
  rar: ['application/vnd.rar', 'application/x-rar-compressed', 'application/x-rar'],
  '7z': ['application/x-7z-compressed'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  png: ['image/png'],
  webp: ['image/webp'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  json: ['application/json', 'text/json'],
  js: ['application/javascript', 'text/javascript'],
  ts: ['application/typescript', 'video/mp2t', 'text/typescript'],
  mp4: ['video/mp4'],
  m4v: ['video/mp4', 'video/x-m4v'],
  webm: ['video/webm'],
  mov: ['video/quicktime'],
};

const TEXT_EXT = ['txt', 'md', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'json'];

const SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  webp: [0x52, 0x49, 0x46, 0x46],
  zip: [0x50, 0x4b],
  docx: [0x50, 0x4b],
  pptx: [0x50, 0x4b],
  xlsx: [0x50, 0x4b],
};

const INLINE_TYPES = ['video/', 'image/', 'application/pdf'];

export interface UploadedMeta {
  id: string;
  name: string;
  size: number;
  mime: string;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(StoredFile) private readonly files: Repository<StoredFile>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(HomeworkAttachment) private readonly attachments: Repository<HomeworkAttachment>,
    @InjectRepository(Homework) private readonly homeworks: Repository<Homework>,
    @InjectRepository(SubmissionFile) private readonly submissionFiles: Repository<SubmissionFile>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  resolvePurpose(user: AuthUser, requested?: string): FilePurpose {
    if (requested === 'avatar') return 'avatar';
    if (user.role === Role.STUDENT) {
      if (requested && requested !== 'answer') throw new ForbiddenException("Siz faqat javob fayli yuklay olasiz.");
      return 'answer';
    }
    if (!requested || requested === 'material') return 'material';
    if (requested === 'video' && user.role === Role.TEACHER) return 'video';
    throw new BadRequestException("Fayl maqsadi noto'g'ri.");
  }

  async register(user: AuthUser, file: Express.Multer.File, purpose: FilePurpose): Promise<UploadedMeta> {
    if (!file) throw new BadRequestException('Fayl yuborilmadi.');
    const path = join(UPLOAD_DIR, file.filename);
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[\\/\0]/g, '_').slice(0, 200);
    try {
      const ext = extname(name).slice(1).toLowerCase();
      const rule = FILE_RULES[purpose];
      if (!ext || !rule.ext.includes(ext)) {
        throw new UnsupportedMediaTypeException(`Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: ${rule.ext.map((e) => '.' + e).join(' ')}`);
      }
      if (file.size > rule.maxBytes) {
        throw new PayloadTooLargeException(`Fayl hajmi ${Math.round(rule.maxBytes / 1048576)} MB dan oshmasin.`);
      }
      if (file.size === 0) throw new BadRequestException("Fayl bo'sh.");
      const mime = file.mimetype || 'application/octet-stream';
      const known = MIME_BY_EXT[ext];
      const mimeOk =
        mime === 'application/octet-stream' ||
        (known && known.includes(mime)) ||
        (TEXT_EXT.includes(ext) && mime.startsWith('text/')) ||
        (known === undefined && !TEXT_EXT.includes(ext));
      if (!mimeOk) throw new UnsupportedMediaTypeException('Fayl turi kengaytmaga mos kelmaydi.');
      const signature = SIGNATURES[ext];
      if (signature) {
        const handle = await fs.open(path, 'r');
        const buf = Buffer.alloc(signature.length);
        await handle.read(buf, 0, signature.length, 0);
        await handle.close();
        if (!signature.every((byte, i) => buf[i] === byte)) {
          throw new UnsupportedMediaTypeException('Fayl mazmuni kengaytmaga mos kelmaydi.');
        }
      }
      const saved = await this.files.save(
        this.files.create({
          ownerId: user.id,
          originalName: name,
          mimeType: mime,
          sizeBytes: file.size,
          storageKey: file.filename,
        }),
      );
      return { id: saved.id, name: saved.originalName, size: saved.sizeBytes, mime: saved.mimeType };
    } catch (error) {
      await fs.unlink(path).catch(() => undefined);
      throw error;
    }
  }

  async meta(ids: string[]): Promise<{ id: string; name: string; size: number }[]> {
    if (!ids.length) return [];
    const rows = await this.files.find({ where: { id: In(ids) } });
    return rows.map((f) => ({ id: f.id, name: f.originalName, size: f.sizeBytes }));
  }

  async assertOwned(ids: string[], ownerId: string): Promise<StoredFile[]> {
    if (!ids.length) return [];
    const rows = await this.files.find({ where: { id: In(ids), ownerId } });
    if (rows.length !== new Set(ids).size) throw new NotFoundException('Fayl topilmadi.');
    return rows;
  }

  async download(user: AuthUser, id: string, req: Request, res: Response) {
    const file = await this.files.findOneBy({ id });
    if (!file) throw new NotFoundException('Fayl topilmadi.');
    if (!(await this.canRead(user, file))) throw new ForbiddenException("Bu faylni ko'rishga ruxsat yo'q.");
    const path = join(UPLOAD_DIR, file.storageKey);
    const stat = await fs.stat(path).catch(() => null);
    if (!stat) throw new NotFoundException('Fayl topilmadi.');
    const inline = INLINE_TYPES.some((t) => file.mimeType.startsWith(t));
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      let start = match && match[1] !== '' ? Number(match[1]) : NaN;
      let end = match && match[2] !== '' ? Number(match[2]) : NaN;
      if (!match || (Number.isNaN(start) && Number.isNaN(end))) {
        res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
        return;
      }
      if (Number.isNaN(start)) {
        start = Math.max(0, stat.size - end);
        end = stat.size - 1;
      } else if (Number.isNaN(end) || end >= stat.size) {
        end = stat.size - 1;
      }
      if (start > end || start >= stat.size) {
        res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
        return;
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      createReadStream(path, { start, end }).pipe(res);
      return;
    }
    res.setHeader('Content-Length', String(stat.size));
    createReadStream(path).pipe(res);
  }

  private async groupAccess(user: AuthUser, groupId: string): Promise<boolean> {
    if (user.role === Role.TEACHER) return !!(await this.groups.findOneBy({ id: groupId, teacherId: user.id }));
    if (user.role === Role.STUDENT) return !!(await this.members.findOneBy({ groupId, studentId: user.id }));
    return false;
  }

  private async canRead(user: AuthUser, file: StoredFile): Promise<boolean> {
    if (user.role === Role.ADMIN || file.ownerId === user.id) return true;
    if (file.mimeType.startsWith('image/') && (await this.users.findOne({ where: { avatarFileId: file.id }, select: ['id'] }))) return true;
    const asVideo = await this.lessons.find({ where: { videoFileId: file.id } });
    for (const lesson of asVideo) if (await this.groupAccess(user, lesson.groupId)) return true;
    const asAttachment = await this.attachments
      .createQueryBuilder('a')
      .innerJoin(Homework, 'h', 'h.id = a.homeworkId')
      .innerJoin(Lesson, 'l', 'l.id = h.lessonId')
      .select('l.groupId', 'groupId')
      .where('a.fileId = :id', { id: file.id })
      .getRawMany<{ groupId: string }>();
    for (const row of asAttachment) if (await this.groupAccess(user, row.groupId)) return true;
    const asSubmission = await this.submissionFiles
      .createQueryBuilder('sf')
      .innerJoin(Submission, 's', 's.id = sf.submissionId')
      .innerJoin(Homework, 'h', 'h.id = s.homeworkId')
      .innerJoin(Lesson, 'l', 'l.id = h.lessonId')
      .select('l.groupId', 'groupId')
      .addSelect('s.studentId', 'studentId')
      .where('sf.fileId = :id', { id: file.id })
      .getRawMany<{ groupId: string; studentId: string }>();
    for (const row of asSubmission) {
      if (user.role === Role.TEACHER && (await this.groupAccess(user, row.groupId))) return true;
      if (user.role === Role.STUDENT && row.studentId === user.id) return true;
    }
    return false;
  }
}
