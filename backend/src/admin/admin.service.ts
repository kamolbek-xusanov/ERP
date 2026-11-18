import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.module';
import { Day, Role } from '../common/enums';
import { RULES } from '../config/rules';
import { openPassword } from '../common/credentials';
import { dayOf, diffDays, fieldError, todayKey } from '../common/utils';
import { Group, GroupMember, Room, User } from '../database/entities';
import { GroupsService } from '../groups/groups.service';
import { ScheduleService } from '../groups/schedule.service';
import { PaymentsService } from '../payments/payments.service';
import { UsersService } from '../users/users.service';
import { CreateGroupDto, CreateStudentDto, CreateUserDto, UpdateAccountDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    private readonly accounts: UsersService,
    private readonly groups: GroupsService,
    private readonly schedule: ScheduleService,
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
    private readonly ds: DataSource,
  ) {}

  async dashboard() {
    const [studentsCount, teachersCount, groupsCount, roomsCount, occupied, upcomingPayments, lastNotices] = await Promise.all([
      this.users.count({ where: { role: Role.STUDENT, isActive: true } }),
      this.users.count({ where: { role: Role.TEACHER, isActive: true } }),
      this.groupRepo.count({ where: { isActive: true } }),
      this.rooms.count(),
      this.schedule.occupiedToday(dayOf(new Date())),
      this.payments.upcomingForDashboard(),
      this.payments.lastNotices(),
    ]);
    return {
      studentsCount,
      teachersCount,
      groupsCount,
      freeSlotsToday: Math.max(0, roomsCount * RULES.LESSON_SLOTS.length - occupied),
      upcomingPayments,
      lastNotices,
    };
  }

  private async groupNamesFor(ids: string[]) {
    const map = new Map<string, { id: string; name: string }[]>();
    if (!ids.length) return map;
    const rows = await this.members.find({ where: { studentId: In(ids) }, relations: { group: true } });
    rows.forEach((r) => {
      const list = map.get(r.studentId) ?? [];
      list.push({ id: r.group.id, name: r.group.name });
      map.set(r.studentId, list);
    });
    return map;
  }

  private studentView(u: User, groups: { id: string; name: string }[]) {
    return {
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      login: u.login,
      isActive: u.isActive,
      groups,
      passwordChangedAt: u.passwordChangedAt,
      password: openPassword(u.credentialEnc),
      isNew: Date.now() - u.createdAt.getTime() < RULES.NEW_STUDENT_DAYS * 86400000,
    };
  }

  async listStudents(q: string | undefined, groupId: string | undefined, skip: number, take: number) {
    const qb = this.users.createQueryBuilder('u').where('u.role = :role', { role: Role.STUDENT });
    if (q?.trim()) {
      qb.andWhere('(u.fullName ILIKE :q OR u.login ILIKE :q OR u.phone ILIKE :q)', { q: `%${q.trim()}%` });
    }
    if (groupId) {
      qb.andWhere('EXISTS (SELECT 1 FROM group_members gm WHERE gm.student_id = u.id AND gm.group_id = :groupId)', { groupId });
    }
    const [rows, total] = await qb.orderBy('u.createdAt', 'DESC').skip(skip).take(take).getManyAndCount();
    const groups = await this.groupNamesFor(rows.map((r) => r.id));
    return { total, items: rows.map((u) => this.studentView(u, groups.get(u.id) ?? [])) };
  }

  async createStudent(dto: CreateStudentDto, adminId: string) {
    const groupIds = [...new Set(dto.groupIds ?? [])];
    const user = await this.ds.transaction(async (em) => {
      const created = await this.accounts.createAccount(em, Role.STUDENT, dto);
      for (const groupId of groupIds) await this.groups.addMemberTx(em, groupId, created.id);
      return created;
    });
    await this.audit.log(adminId, 'student.created', user.id, { login: user.login, groupIds });
    const groups = await this.groupNamesFor([user.id]);
    return this.studentView(user, groups.get(user.id) ?? []);
  }

  async enrol(studentId: string, groupId: string, adminId: string) {
    const student = await this.users.findOneBy({ id: studentId, role: Role.STUDENT });
    if (!student) throw new NotFoundException("O'quvchi topilmadi.");
    await this.groups.addMember(groupId, studentId);
    await this.audit.log(adminId, 'student.enrolled', studentId, { groupId });
  }

  async unenrol(studentId: string, groupId: string, adminId: string) {
    await this.groups.removeMember(groupId, studentId);
    await this.audit.log(adminId, 'student.removed_from_group', studentId, { groupId });
  }

  async updateAccount(targetId: string, roles: Role[], dto: UpdateAccountDto, adminId: string) {
    const user = await this.accounts.changeAccount(targetId, roles, dto);
    await this.audit.log(adminId, 'account.updated', targetId, {
      loginChanged: dto.login !== undefined,
      passwordChanged: dto.password !== undefined,
      nameChanged: dto.fullName !== undefined,
      phoneChanged: dto.phone !== undefined,
    });
    return user;
  }

  async setActive(targetId: string, isActive: boolean, adminId: string) {
    const user = await this.users.findOneBy({ id: targetId });
    if (!user || user.role === Role.ADMIN) throw new NotFoundException('Foydalanuvchi topilmadi.');
    await this.users.update({ id: targetId }, { isActive, tokenVersion: user.tokenVersion + 1 });
    await this.audit.log(adminId, isActive ? 'user.activated' : 'user.deactivated', targetId);
  }

  async listTeachers() {
    const rows = await this.users.find({ where: { role: Role.TEACHER }, order: { fullName: 'ASC' } });
    const groups = await this.groupRepo.find({ where: { teacherId: In(rows.map((r) => r.id)) } });
    const memberRows = groups.length ? await this.members.find({ where: { groupId: In(groups.map((g) => g.id)) } }) : [];
    const countFor = (teacherId: string) => {
      const ids = new Set(groups.filter((g) => g.teacherId === teacherId).map((g) => g.id));
      return new Set(memberRows.filter((m) => ids.has(m.groupId)).map((m) => m.studentId)).size;
    };
    return rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      login: u.login,
      isActive: u.isActive,
      groups: groups.filter((g) => g.teacherId === u.id).map((g) => ({ id: g.id, name: g.name })),
      passwordChangedAt: u.passwordChangedAt,
      password: openPassword(u.credentialEnc),
      studentsCount: countFor(u.id),
    }));
  }

  /** Ustozning barcha o'quvchilari (login va parol bilan). */
  async teacherStudents(teacherId: string) {
    const teacher = await this.users.findOneBy({ id: teacherId, role: Role.TEACHER });
    if (!teacher) throw new NotFoundException('Ustoz topilmadi.');
    const groups = await this.groupRepo.find({ where: { teacherId } });
    const members = groups.length ? await this.members.find({ where: { groupId: In(groups.map((g) => g.id)) } }) : [];
    const ids = [...new Set(members.map((m) => m.studentId))];
    const users = ids.length ? await this.users.find({ where: { id: In(ids) }, order: { fullName: 'ASC' } }) : [];
    const names = new Map(groups.map((g) => [g.id, g.name] as [string, string]));
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      login: u.login,
      isActive: u.isActive,
      password: openPassword(u.credentialEnc),
      passwordChangedAt: u.passwordChangedAt,
      groups: members.filter((m) => m.studentId === u.id).map((m) => ({ id: m.groupId, name: names.get(m.groupId) ?? '' })),
    }));
  }

  async createTeacher(dto: CreateUserDto, adminId: string) {
    const user = await this.ds.transaction((em) => this.accounts.createAccount(em, Role.TEACHER, dto));
    await this.audit.log(adminId, 'teacher.created', user.id, { login: user.login });
    return { id: user.id, fullName: user.fullName, phone: user.phone, login: user.login, groups: [], passwordChangedAt: null, password: openPassword(user.credentialEnc), studentsCount: 0 };
  }

  async listGroups() {
    const rows = await this.groupRepo.find({ where: { isActive: true }, relations: { teacher: true }, order: { name: 'ASC' } });
    const ids = rows.map((g) => g.id);
    const [counts, schedules, plans] = await Promise.all([
      this.groups.memberCounts(ids),
      this.groups.scheduleOf(ids),
      Promise.all(ids.map((id) => this.groups.planOf(id))),
    ]);
    return rows.map((g, i) => {
      const schedule = schedules.get(g.id) ?? [];
      const plan = plans[i];
      return {
        id: g.id,
        name: g.name,
        course: g.course,
        teacher: { id: g.teacherId, fullName: g.teacher.fullName },
        members: counts.get(g.id) ?? 0,
        capacity: this.groups.capacityFrom(schedule),
        schedule: schedule.map((s) => ({ day: s.day, start: s.startTime, end: s.endTime, roomId: s.roomId, roomName: s.room?.name ?? null })),
        plan: plan ? { amount: plan.amount, dueDate: plan.dueDate, daysLeft: diffDays(todayKey(), plan.dueDate) } : null,
      };
    });
  }

  async createGroup(dto: CreateGroupDto, adminId: string) {
    const group = await this.schedule.createGroup({ ...dto, roomId: dto.roomId ?? null });
    await this.audit.log(adminId, 'group.created', group.id, { name: group.name });
    const all = await this.listGroups();
    return all.find((g) => g.id === group.id);
  }

  async freeRooms(days: string | undefined, start: string | undefined) {
    const list = (days ?? '').split(',').map((d) => d.trim().toUpperCase()) as Day[];
    if (!list.length || list.some((d) => !Object.values(Day).includes(d))) throw fieldError('days', "Kunlarni to'g'ri kiriting. Masalan: MON,WED");
    if (!start || !RULES.LESSON_SLOTS.includes(start)) throw fieldError('start', "Dars vaqti ro'yxatdagi katakchalardan biri bo'lsin.");
    return this.schedule.freeRooms(list, start);
  }

  async timetable(day: string | undefined) {
    const value = (day ?? dayOf(new Date())).toUpperCase() as Day;
    if (!Object.values(Day).includes(value)) throw fieldError('day', "Kun noto'g'ri. Masalan: MON");
    return this.schedule.timetable(value);
  }
}
