import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { DAYS, Day } from '../common/enums';
import { addDays, addHours, atTashkent, dateKey, dayOf, todayKey } from '../common/utils';
import { RULES } from '../config/rules';
import {
  Group,
  GroupMember,
  GroupSchedule,
  Homework,
  Lesson,
  PaymentPlan,
  StudentHomework,
} from '../database/entities';
import { HomeworkStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

export interface SessionView {
  day: Day;
  start: string;
  end: string;
  room: string | null;
}

export interface NextSession {
  date: string;
  day: Day;
  start: string;
  end: string;
  room: string | null;
}

export const sortSchedule = <T extends { day: Day; startTime: string }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime));

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(GroupSchedule) private readonly schedules: Repository<GroupSchedule>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(PaymentPlan) private readonly plans: Repository<PaymentPlan>,
    private readonly ds: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  async getOrFail(id: string): Promise<Group> {
    const group = await this.groups.findOne({ where: { id }, relations: { teacher: true } });
    if (!group) throw new NotFoundException('Guruh topilmadi.');
    return group;
  }

  async assertTeacherOwns(groupId: string, teacherId: string): Promise<Group> {
    const group = await this.getOrFail(groupId);
    if (group.teacherId !== teacherId) throw new ForbiddenException('Bu guruh sizga tegishli emas.');
    return group;
  }

  async assertMember(groupId: string, studentId: string): Promise<Group> {
    const group = await this.getOrFail(groupId);
    const member = await this.members.findOneBy({ groupId, studentId });
    if (!member) throw new ForbiddenException("Siz bu guruh a'zosi emassiz.");
    return group;
  }

  async groupsOfStudent(studentId: string): Promise<Group[]> {
    const rows = await this.members.find({ where: { studentId }, relations: { group: { teacher: true } } });
    return rows.map((r) => r.group).filter((g) => g.isActive);
  }

  groupsOfTeacher(teacherId: string): Promise<Group[]> {
    return this.groups.find({ where: { teacherId, isActive: true }, relations: { teacher: true }, order: { name: 'ASC' } });
  }

  async memberCounts(groupIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!groupIds.length) return map;
    const rows = await this.members
      .createQueryBuilder('m')
      .select('m.groupId', 'groupId')
      .addSelect('COUNT(*)', 'count')
      .where('m.groupId IN (:...groupIds)', { groupIds })
      .groupBy('m.groupId')
      .getRawMany<{ groupId: string; count: string }>();
    rows.forEach((r) => map.set(r.groupId, Number(r.count)));
    return map;
  }

  async scheduleOf(groupIds: string[]): Promise<Map<string, GroupSchedule[]>> {
    const map = new Map<string, GroupSchedule[]>();
    if (!groupIds.length) return map;
    const rows = await this.schedules.find({ where: { groupId: In(groupIds) }, relations: { room: true } });
    for (const row of sortSchedule(rows)) {
      const list = map.get(row.groupId) ?? [];
      list.push(row);
      map.set(row.groupId, list);
    }
    return map;
  }

  capacityFrom(rows: GroupSchedule[]): number {
    const caps = rows.filter((r) => r.room).map((r) => r.room.capacity);
    return caps.length ? Math.min(...caps) : RULES.DEFAULT_ONLINE_CAPACITY;
  }

  async capacityTx(em: EntityManager, groupId: string): Promise<number> {
    const rows = await em.find(GroupSchedule, { where: { groupId }, relations: { room: true } });
    return this.capacityFrom(rows);
  }

  nextSession(schedule: GroupSchedule[], now = new Date()): NextSession | null {
    if (!schedule.length) return null;
    const today = todayKey();
    for (let offset = 0; offset <= 7; offset++) {
      const key = addDays(today, offset);
      const day = dayOf(atTashkent(key));
      const slots = schedule.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (const slot of slots) {
        if (atTashkent(key, slot.startTime) > now) {
          return { date: key, day, start: slot.startTime, end: slot.endTime, room: slot.room?.name ?? null };
        }
      }
    }
    return null;
  }

  async describe(groups: Group[]) {
    const ids = groups.map((g) => g.id);
    const [counts, schedules] = await Promise.all([this.memberCounts(ids), this.scheduleOf(ids)]);
    return groups.map((g) => {
      const rows = schedules.get(g.id) ?? [];
      return {
        id: g.id,
        name: g.name,
        course: g.course,
        teacher: { id: g.teacherId, fullName: g.teacher?.fullName },
        members: counts.get(g.id) ?? 0,
        schedule: rows.map<SessionView>((r) => ({ day: r.day, start: r.startTime, end: r.endTime, room: r.room?.name ?? null })),
        nextSession: this.nextSession(rows),
      };
    });
  }

  addMember(groupId: string, studentId: string) {
    return this.ds.transaction((em) => this.addMemberTx(em, groupId, studentId));
  }

  async addMemberTx(em: EntityManager, groupId: string, studentId: string) {
    const group = await em.findOneBy(Group, { id: groupId });
    if (!group) throw new NotFoundException('Guruh topilmadi.');
    if (await em.findOneBy(GroupMember, { groupId, studentId })) {
      throw new ConflictException("O'quvchi bu guruhda allaqachon bor.");
    }
    const capacity = await this.capacityTx(em, groupId);
    const count = await em.countBy(GroupMember, { groupId });
    if (count >= capacity) throw new ConflictException(`${group.name} guruhida bo'sh joy qolmagan.`);
    await em.insert(GroupMember, { groupId, studentId });
    const homeworks = await em
      .createQueryBuilder(Homework, 'h')
      .innerJoin(Lesson, 'l', 'l.id = h.lessonId')
      .where('l.groupId = :groupId', { groupId })
      .getMany();
    const now = new Date();
    if (homeworks.length) {
      await em.insert(
        StudentHomework,
        homeworks.map((h) => ({
          homeworkId: h.id,
          studentId,
          status: HomeworkStatus.NOT_DONE,
          assignedAt: now,
          dueAt: addHours(now, h.timeLimitHours),
        })),
      );
    }
    await this.notifications.notify([studentId], 'group_added', `Siz “${group.name}” guruhiga qo'shildingiz.`, '/groups', em);
    await this.notifications.activity(studentId, 'group', `“${group.name}” guruhiga qo'shildingiz`, null, em);
    return group;
  }

  async removeMember(groupId: string, studentId: string) {
    const res = await this.members.delete({ groupId, studentId });
    if (!res.affected) throw new NotFoundException("O'quvchi bu guruhda emas.");
  }

  async planOf(groupId: string) {
    return this.plans.findOneBy({ groupId });
  }

  today() {
    return dateKey(new Date());
  }
}
