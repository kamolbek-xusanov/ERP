import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Role } from '../common/enums';
import {
  LOGIN_RE,
  fieldError,
  hashPassword,
  isValidFullName,
  normalizePhone,
  verifyPassword,
} from '../common/utils';
import { sealPassword } from '../common/credentials';
import { Student, Teacher, User, UserSettings } from '../database/entities';
import { FilesService } from '../files/files.service';
import { ChangePasswordDto } from '../auth/auth.dto';
import { SettingsDto } from './users.dto';

export interface NewAccount {
  fullName: string;
  phone: string;
  login: string;
  password: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSettings) private readonly settings: Repository<UserSettings>,
    private readonly files: FilesService,
  ) {}

  async me(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi.');
    return {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      login: user.login,
      phone: user.phone,
      email: user.email,
      bio: user.bio,
      avatarFileId: user.avatarFileId,
    };
  }

  async setAvatar(id: string, fileId: string | null) {
    if (fileId) {
      const [file] = await this.files.assertOwned([fileId], id);
      if (!file.mimeType.startsWith('image/')) throw fieldError('fileId', 'Faqat rasm fayli qabul qilinadi.');
    }
    await this.users.update({ id }, { avatarFileId: fileId });
    return this.me(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.users.createQueryBuilder('u').addSelect('u.passwordHash').where('u.id = :id', { id }).getOne();
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi.');
    if (!(await verifyPassword(dto.current, user.passwordHash))) throw fieldError('current', "Joriy parol noto'g'ri.");
    if (!/[A-Za-z]/.test(dto.next) || !/\d/.test(dto.next)) {
      throw fieldError('next', "Parolda kamida bitta harf va bitta raqam bo'lishi kerak.");
    }
    if (dto.next === dto.current) throw fieldError('next', 'Yangi parol eskisidan farq qilishi kerak.');
    await this.users.update({ id }, { passwordHash: await hashPassword(dto.next), passwordChangedAt: new Date(), credentialEnc: null });
  }

  async getSettings(userId: string) {
    let row = await this.settings.findOneBy({ userId });
    if (!row) row = await this.settings.save(this.settings.create({ userId }));
    return this.view(row);
  }

  async updateSettings(userId: string, dto: SettingsDto) {
    const row = await this.settings.findOneBy({ userId });
    const next = this.settings.create({ ...(row ?? { userId }), ...dto, userId });
    return this.view(await this.settings.save(next));
  }

  async assertLoginFree(login: string, exceptId?: string, em?: EntityManager) {
    const repo = em ? em.getRepository(User) : this.users;
    const found = await repo.findOneBy({ login });
    if (found && found.id !== exceptId) throw fieldError('login', 'Bunday login band. Boshqa login tanlang.');
  }

  async createAccount(em: EntityManager, role: Role, data: NewAccount) {
    const fullName = data.fullName.trim().replace(/\s+/g, ' ');
    if (!isValidFullName(fullName)) throw fieldError('fullName', 'Ism va familiyani kiriting.');
    const phone = normalizePhone(data.phone);
    if (!phone) throw fieldError('phone', "Telefon raqami +998 90 123 45 67 ko'rinishida bo'lsin.");
    const login = data.login.trim().toLowerCase();
    if (!LOGIN_RE.test(login)) {
      throw fieldError('login', "Login 4-30 belgi: kichik lotin harflari, raqam, nuqta, pastki chiziq yoki chiziq.");
    }
    if (data.password.length < 8) throw fieldError('password', "Parol kamida 8 belgidan iborat bo'lsin.");
    await this.assertLoginFree(login, undefined, em);
    const user = await em.save(
      em.create(User, { role, login, fullName, phone, passwordHash: await hashPassword(data.password), credentialEnc: sealPassword(data.password) }),
    );
    if (role === Role.STUDENT) await em.insert(Student, { userId: user.id });
    if (role === Role.TEACHER) await em.insert(Teacher, { userId: user.id });
    await em.insert(UserSettings, { userId: user.id });
    return user;
  }

  async changeAccount(targetId: string, roles: Role[], data: { login?: string; password?: string; fullName?: string; phone?: string }, em?: EntityManager) {
    const repo = em ? em.getRepository(User) : this.users;
    const user = await repo.findOneBy({ id: targetId });
    if (!user || !roles.includes(user.role)) throw new NotFoundException('Foydalanuvchi topilmadi.');
    const patch: Partial<User> = {};
    if (data.fullName !== undefined) {
      const fullName = data.fullName.trim().replace(/\s+/g, ' ');
      if (!isValidFullName(fullName)) throw fieldError('fullName', 'Ism va familiyani kiriting.');
      patch.fullName = fullName;
    }
    if (data.phone !== undefined) {
      const phone = normalizePhone(data.phone);
      if (!phone) throw fieldError('phone', "Telefon raqami +998 90 123 45 67 ko'rinishida bo'lsin.");
      patch.phone = phone;
    }
    const credentialsChanged = data.login !== undefined || data.password !== undefined;
    if (data.login !== undefined) {
      const login = data.login.trim().toLowerCase();
      if (!LOGIN_RE.test(login)) {
        throw fieldError('login', "Login 4-30 belgi: kichik lotin harflari, raqam, nuqta, pastki chiziq yoki chiziq.");
      }
      await this.assertLoginFree(login, user.id, em);
      patch.login = login;
    }
    if (data.password !== undefined) {
      if (data.password.length < 8) throw fieldError('password', "Parol kamida 8 belgidan iborat bo'lsin.");
      patch.passwordHash = await hashPassword(data.password);
      patch.passwordChangedAt = new Date();
      patch.credentialEnc = sealPassword(data.password);
    }
    if (!Object.keys(patch).length) throw new UnprocessableEntityException({ message: "O'zgartirish uchun maydon kiriting." });
    await repo.update({ id: user.id }, { ...patch, ...(credentialsChanged ? { tokenVersion: user.tokenVersion + 1 } : {}) });
    return user;
  }

  private view(row: UserSettings) {
    return { notifyEmail: row.notifyEmail, notifyPush: row.notifyPush, notifyReminders: row.notifyReminders, theme: row.theme };
  }
}
