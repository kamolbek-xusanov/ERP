import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { diffDays, dueLabel, fieldError, formatMoney, todayKey } from '../common/utils';
import { Group, GroupMember, Payment, PaymentNotice, PaymentPlan } from '../database/entities';
import { AuditService } from '../audit/audit.module';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentPlanDto, RecordPaymentDto } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(PaymentPlan) private readonly plans: Repository<PaymentPlan>,
    @InjectRepository(PaymentNotice) private readonly notices: Repository<PaymentNotice>,
    @InjectRepository(GroupMember) private readonly members: Repository<GroupMember>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly ds: DataSource,
  ) {}

  async setPlan(groupId: string, dto: PaymentPlanDto, adminId: string) {
    if (dto.dueDate < todayKey()) throw fieldError('dueDate', "To'lov sanasi bugundan oldin bo'lmasin.");
    const group = await this.groups.findOneBy({ id: groupId });
    if (!group) throw new NotFoundException('Guruh topilmadi.');
    const result = await this.ds.transaction(async (em) => {
      const members = await em.find(GroupMember, { where: { groupId } });
      if (!members.length) throw new UnprocessableEntityException({ message: "Guruhda o'quvchi yo'q: avval o'quvchi qo'shing." });
      await em.upsert(PaymentPlan, { groupId, amount: dto.amount, dueDate: dto.dueDate, updatedAt: new Date() }, ['groupId']);
      const notice = await em.save(
        em.create(PaymentNotice, { groupId, amount: dto.amount, dueDate: dto.dueDate, sentBy: adminId, recipients: members.length }),
      );
      await this.notifications.notify(
        members.map((m) => m.studentId),
        'payment_notice',
        `To'lov eslatmasi: keyingi to'lov ${dueLabel(dto.dueDate)} gacha, ${formatMoney(dto.amount)} so'm`,
        '/payments',
        em,
      );
      return { plan: { amount: dto.amount, dueDate: dto.dueDate }, notice: { id: notice.id, recipients: members.length } };
    });
    await this.audit.log(adminId, 'payment_notice.sent', groupId, { amount: dto.amount, dueDate: dto.dueDate });
    return result;
  }

  async record(dto: RecordPaymentDto, adminId: string) {
    const member = await this.members.findOneBy({ groupId: dto.groupId, studentId: dto.studentId });
    if (!member) throw new ConflictException("O'quvchi bu guruhda emas.");
    const payment = await this.payments.save(
      this.payments.create({
        studentId: dto.studentId,
        groupId: dto.groupId,
        amount: dto.amount,
        paidAt: dto.paidAt,
        method: dto.method.trim(),
        description: dto.description?.trim() ?? '',
      }),
    );
    await this.notifications.activity(dto.studentId, 'payment', `To'lov qabul qilindi: ${formatMoney(dto.amount)} so'm`);
    await this.audit.log(adminId, 'payment.recorded', payment.id, { studentId: dto.studentId, amount: dto.amount });
    return payment;
  }

  async adminOverview() {
    const [plans, counts, notices] = await Promise.all([
      this.plans.find({ relations: { group: true }, order: { dueDate: 'ASC' } }),
      this.members
        .createQueryBuilder('m')
        .select('m.groupId', 'groupId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('m.groupId')
        .getRawMany<{ groupId: string; count: string }>(),
      this.notices.find({ relations: { group: true }, order: { sentAt: 'DESC' }, take: 50 }),
    ]);
    const countMap = new Map(counts.map((c) => [c.groupId, Number(c.count)] as [string, number]));
    const today = todayKey();
    return {
      groups: plans
        .filter((p) => p.group.isActive)
        .map((p) => ({
          groupId: p.groupId,
          name: p.group.name,
          members: countMap.get(p.groupId) ?? 0,
          plan: { amount: p.amount, dueDate: p.dueDate },
          daysLeft: diffDays(today, p.dueDate),
        })),
      notices: notices.map((n) => ({
        id: n.id,
        groupId: n.groupId,
        groupName: n.group.name,
        amount: n.amount,
        dueDate: n.dueDate,
        sentAt: n.sentAt,
        recipients: n.recipients,
      })),
    };
  }

  async studentPayments(studentId: string) {
    const memberships = await this.members.find({ where: { studentId } });
    const groupIds = memberships.map((m) => m.groupId);
    const [plans, items] = await Promise.all([
      groupIds.length ? this.plans.find({ where: { groupId: In(groupIds) }, relations: { group: true } }) : [],
      this.payments.find({ where: { studentId }, relations: { group: true }, order: { paidAt: 'DESC' } }),
    ]);
    const today = todayKey();
    const total = items.reduce((sum, p) => sum + p.amount, 0);
    const toItem = (p: Payment) => ({
      id: p.id,
      date: p.paidAt,
      groupName: p.group.name,
      description: p.description,
      method: p.method,
      amount: p.amount,
    });
    return {
      total,
      count: items.length,
      last: items.length ? toItem(items[0]) : null,
      upcoming: plans
        .filter((p) => p.group.isActive)
        .map((p) => ({
          groupId: p.groupId,
          groupName: p.group.name,
          dueDate: p.dueDate,
          amount: p.amount,
          daysLeft: diffDays(today, p.dueDate),
        }))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      items: items.map(toItem),
    };
  }

  async upcomingForDashboard(limit = 5) {
    const today = todayKey();
    const plans = await this.plans.find({ relations: { group: true }, order: { dueDate: 'ASC' } });
    return plans
      .filter((p) => p.group.isActive && p.dueDate >= today)
      .slice(0, limit)
      .map((p) => ({ groupId: p.groupId, groupName: p.group.name, amount: p.amount, dueDate: p.dueDate, daysLeft: diffDays(today, p.dueDate) }));
  }

  async lastNotices(limit = 5) {
    const rows = await this.notices.find({ relations: { group: true }, order: { sentAt: 'DESC' }, take: limit });
    return rows.map((n) => ({
      id: n.id,
      groupName: n.group.name,
      amount: n.amount,
      dueDate: n.dueDate,
      sentAt: n.sentAt,
      recipients: n.recipients,
    }));
  }
}
