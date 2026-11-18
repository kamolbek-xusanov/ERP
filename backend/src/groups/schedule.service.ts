import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DAY_UZ, Day, Role } from '../common/enums';
import { endTime, fieldError, todayKey } from '../common/utils';
import { RULES } from '../config/rules';
import { Group, GroupSchedule, PaymentPlan, Room, User } from '../database/entities';

export interface CreateGroupInput {
  name: string;
  course: string;
  teacherId: string;
  days: Day[];
  start: string;
  roomId?: string | null;
  amount: number;
  dueDate: string;
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(GroupSchedule) private readonly schedules: Repository<GroupSchedule>,
    private readonly ds: DataSource,
  ) {}

  async assertRoomFree(em: EntityManager, roomId: string, day: Day, start: string) {
    const busy = await em.findOne(GroupSchedule, { where: { roomId, day, startTime: start }, relations: { group: true, room: true } });
    if (busy) throw new ConflictException(`${busy.room.name} ${DAY_UZ[day]} kuni ${start} da band: ${busy.group.name}.`);
  }

  async assertTeacherFree(em: EntityManager, teacherId: string, day: Day, start: string) {
    const clash = await em
      .createQueryBuilder(GroupSchedule, 's')
      .innerJoinAndSelect('s.group', 'g')
      .where('g.teacherId = :teacherId AND g.isActive = true AND s.day = :day AND s.startTime = :start', {
        teacherId,
        day,
        start,
      })
      .getOne();
    if (clash) throw new ConflictException(`Ustoz shu vaqtda “${clash.group.name}” guruhida dars o'tadi.`);
  }

  async createGroup(input: CreateGroupInput) {
    const days = [...new Set(input.days)];
    if (!RULES.LESSON_SLOTS.includes(input.start)) throw fieldError('start', "Dars vaqti ro'yxatdagi katakchalardan biri bo'lsin.");
    if (input.dueDate < todayKey()) throw fieldError('dueDate', "To'lov sanasi bugundan oldin bo'lmasin.");
    if (input.amount < RULES.MIN_PAYMENT) throw fieldError('amount', `Summa kamida ${RULES.MIN_PAYMENT} so'm bo'lsin.`);
    return this.ds.transaction(async (em) => {
      const teacher = await em.findOneBy(User, { id: input.teacherId, role: Role.TEACHER, isActive: true });
      if (!teacher) throw fieldError('teacherId', 'Ustoz topilmadi.');
      let room: Room | null = null;
      if (input.roomId) {
        room = await em.findOneBy(Room, { id: input.roomId });
        if (!room) throw fieldError('roomId', 'Xona topilmadi.');
      }
      for (const day of days) {
        if (room) await this.assertRoomFree(em, room.id, day, input.start);
        await this.assertTeacherFree(em, teacher.id, day, input.start);
      }
      const group = await em.save(
        em.create(Group, { name: input.name.trim(), course: input.course.trim(), teacherId: teacher.id }),
      );
      await em.insert(
        GroupSchedule,
        days.map((day) => ({
          groupId: group.id,
          day,
          startTime: input.start,
          endTime: endTime(input.start, RULES.LESSON_SLOT_HOURS),
          roomId: room?.id ?? null,
        })),
      );
      await em.insert(PaymentPlan, { groupId: group.id, amount: input.amount, dueDate: input.dueDate });
      return group;
    });
  }

  async freeRooms(days: Day[], start: string): Promise<string[]> {
    const rooms = await this.rooms.find();
    const taken = await this.schedules
      .createQueryBuilder('s')
      .select('s.roomId', 'roomId')
      .where('s.roomId IS NOT NULL AND s.startTime = :start AND s.day IN (:...days)', { start, days })
      .getRawMany<{ roomId: string }>();
    const busy = new Set(taken.map((t) => t.roomId));
    return rooms.filter((r) => !busy.has(r.id)).map((r) => r.id);
  }

  async timetable(day: Day) {
    const rooms = await this.rooms.find({ order: { name: 'ASC' } });
    const rows = await this.schedules.find({ where: { day }, relations: { group: { teacher: true } } });
    return {
      slots: RULES.LESSON_SLOTS,
      rooms: rooms.map((room) => {
        const cells: Record<string, { groupId: string; groupName: string; teacher: string } | null> = {};
        for (const slot of RULES.LESSON_SLOTS) {
          const hit = rows.find((r) => r.roomId === room.id && r.startTime === slot);
          cells[slot] = hit ? { groupId: hit.groupId, groupName: hit.group.name, teacher: hit.group.teacher.fullName } : null;
        }
        return { id: room.id, name: room.name, capacity: room.capacity, cells };
      }),
    };
  }

  async occupiedToday(day: Day): Promise<number> {
    return this.schedules
      .createQueryBuilder('s')
      .innerJoin('s.group', 'g')
      .where('s.roomId IS NOT NULL AND s.day = :day AND g.isActive = true', { day })
      .getCount();
  }

  async roomOrFail(id: string): Promise<Room> {
    const room = await this.rooms.findOneBy({ id });
    if (!room) throw new NotFoundException('Xona topilmadi.');
    return room;
  }
}
