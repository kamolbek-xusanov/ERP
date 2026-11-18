import { Global, Injectable, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditLog, User } from '../database/entities';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async log(actorId: string | null, action: string, target?: string, meta?: Record<string, unknown>) {
    await this.repo.insert({ actorId, action, target: target ?? null, meta: meta ?? null });
  }

  async list(page: number, limit: number) {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const ids = [...new Set(items.flatMap((i) => [i.actorId, i.target]).filter((v): v is string => !!v && /^[0-9a-f-]{36}$/i.test(v)))];
    const people = ids.length ? await this.users.find({ where: { id: In(ids) } }) : [];
    const name = new Map(people.map((u) => [u.id, u.fullName] as [string, string]));
    return {
      total,
      items: items.map((i) => ({
        id: i.id,
        action: i.action,
        target: i.target,
        meta: i.meta,
        createdAt: i.createdAt,
        actorId: i.actorId,
        actorName: i.actorId ? name.get(i.actorId) ?? null : null,
        targetName: i.target ? name.get(i.target) ?? null : null,
      })),
    };
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
