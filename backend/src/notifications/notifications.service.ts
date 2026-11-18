import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Activity, Notification } from '../database/entities';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
  ) {}

  async notify(userIds: string[], type: string, title: string, link: string | null = null, em?: EntityManager) {
    if (!userIds.length) return;
    const repo = em ? em.getRepository(Notification) : this.repo;
    await repo.insert(userIds.map((userId) => ({ userId, type, title, link })));
  }

  async activity(studentId: string, type: string, text: string, xp: number | null = null, em?: EntityManager) {
    const repo = em ? em.getRepository(Activity) : this.activities;
    await repo.insert({ studentId, type, text, xp });
  }

  async list(userId: string, unread: boolean, skip: number, take: number) {
    const [items, total] = await this.repo.findAndCount({
      where: unread ? { userId, readAt: IsNull() } : { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return {
      total,
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        link: n.link,
        createdAt: n.createdAt,
        readAt: n.readAt,
      })),
    };
  }

  unreadCount(userId: string) {
    return this.repo.count({ where: { userId, readAt: IsNull() } });
  }

  async readAll(userId: string) {
    await this.repo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
  }

  async readOne(userId: string, id: string) {
    await this.repo.update({ id, userId, readAt: IsNull() }, { readAt: new Date() });
  }
}
