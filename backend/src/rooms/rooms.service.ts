import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { fieldError } from '../common/utils';
import { GroupMember, GroupSchedule, Room } from '../database/entities';
import { ScheduleService } from '../groups/schedule.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(GroupSchedule) private readonly schedules: Repository<GroupSchedule>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    private readonly schedule: ScheduleService,
  ) {}

  async list() {
    const rows = await this.rooms.find({ order: { name: 'ASC' } });
    return rows.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity }));
  }

  async create(name: string, capacity: number) {
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (await this.rooms.findOneBy({ nameKey: key })) throw fieldError('name', 'Bunday nomli xona bor.');
    const room = await this.rooms.save(this.rooms.create({ name: clean, nameKey: key, capacity }));
    return { id: room.id, name: room.name, capacity: room.capacity };
  }

  async update(id: string, name: string, capacity: number) {
    const room = await this.schedule.roomOrFail(id);
    const clean = name.trim();
    const key = clean.toLowerCase();
    const same = await this.rooms.findOneBy({ nameKey: key });
    if (same && same.id !== id) throw fieldError('name', 'Bunday nomli xona bor.');
    const used = await this.schedules.find({ where: { roomId: id } });
    for (const row of used) {
      const count = await this.members.countBy({ groupId: row.groupId });
      if (count > capacity) throw new ConflictException(`Sig'imni kamaytirib bo'lmaydi: guruhda ${count} o'quvchi bor.`);
    }
    room.name = clean;
    room.nameKey = key;
    room.capacity = capacity;
    await this.rooms.save(room);
    return { id: room.id, name: room.name, capacity: room.capacity };
  }
}
