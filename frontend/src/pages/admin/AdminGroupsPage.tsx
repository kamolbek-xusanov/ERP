import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminGroup, AdminStudent, Room } from '../../api/types';
import { Button, Card, Empty, Field, FormError, Input, PageHeader, Query, Select, Table } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { norm } from '../../hooks/useSearchIndex';
import { DAY_KEYS, DAY_LABEL, fmtDate, fmtMoney, scheduleText } from '../../utils/format';

const SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

function CreateForm() {
  const teachers = useGet<AdminStudent[]>('/admin/teachers');
  const rooms = useGet<Room[]>('/admin/rooms');
  const [days, setDays] = useState<string[]>([]);
  const [start, setStart] = useState('18:00');
  const free = useGet<string[]>(days.length ? `/admin/rooms/free?days=${days.join(',')}&start=${start}` : null);
  const m = useAction((v: Record<string, unknown>) => api.post('/admin/groups', v), ['/admin/groups', '/admin/rooms', '/admin/dashboard', '/admin/payments']);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const roomId = String(f.get('roomId') ?? '');
    m.mutate(
      {
        name: f.get('name'),
        course: f.get('course'),
        teacherId: f.get('teacherId'),
        days,
        start,
        ...(roomId ? { roomId } : {}),
        amount: Number(f.get('amount')),
        dueDate: f.get('dueDate'),
      },
      {
        onSuccess: () => {
          form.reset();
          setDays([]);
        },
      },
    );
  };

  return (
    <Card title="Guruh ochish">
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Guruh nomi" name="name" error={m.error}>
            <Input name="name" required minLength={3} />
          </Field>
          <Field label="Yo'nalish" name="course" error={m.error}>
            <Input name="course" required minLength={3} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Ustoz" name="teacherId" error={m.error}>
            <Select name="teacherId" required defaultValue="">
              <option value="" disabled>
                Tanlang
              </option>
              {teachers.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dars vaqti (2 soat)" name="start" error={m.error}>
            <Select value={start} onChange={(e) => setStart(e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Kunlar" name="days" error={m.error}>
          <div className="checks">
            {DAY_KEYS.map((d) => (
              <label key={d} className="check">
                <input type="checkbox" checked={days.includes(d)} onChange={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])} />
                {DAY_LABEL[d]}
              </label>
            ))}
          </div>
        </Field>
        <Field label={days.length ? "Xona (tanlangan kunlarda bo'sh xonalar)" : 'Xona'} name="roomId" error={m.error}>
          <Select name="roomId" defaultValue="">
            <option value="">Onlayn (xona kerak emas)</option>
            {rooms.data
              ?.filter((r) => !days.length || free.data?.includes(r.id))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity})
                </option>
              ))}
          </Select>
        </Field>
        <div className="form-row">
          <Field label="To'lov summasi (so'm)" name="amount" error={m.error}>
            <Input name="amount" type="number" min={10000} step={1000} required />
          </Field>
          <Field label="Birinchi to'lov sanasi" name="dueDate" error={m.error}>
            <Input name="dueDate" type="date" required min={new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
        <FormError error={m.error} />
        <Button type="submit" loading={m.isPending} disabled={!days.length}>
          Guruh ochish
        </Button>
      </form>
    </Card>
  );
}

export default function AdminGroupsPage() {
  const q = useGet<AdminGroup[]>('/admin/groups');
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(params.get('q') ?? '');
  useEffect(() => setFilter(params.get('q') ?? ''), [params]);
  return (
    <>
      <PageHeader title="Guruhlar" />
      <CreateForm />
      <Card title="Guruhlar ro'yxati">
        <div className="toolbar">
          <Input placeholder="Qidirish: guruh, yo'nalish, ustoz" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <Query q={q}>
          {(all) => {
            const groups = all.filter((g) => !filter.trim() || norm(`${g.name} ${g.course} ${g.teacher.fullName}`).includes(norm(filter)));
            return groups.length === 0 ? (
              <Empty>Guruh topilmadi.</Empty>
            ) : (
            <Table head={['Guruh', 'Ustoz', "A'zolar", 'Jadval', "Keyingi to'lov"]}>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td>
                    {g.name}
                    <div className="muted">{g.course}</div>
                  </td>
                  <td>{g.teacher.fullName}</td>
                  <td>
                    {g.members} / {g.capacity}
                  </td>
                  <td>{scheduleText(g.schedule)}</td>
                  <td>{g.plan ? `${fmtMoney(g.plan.amount)}, ${fmtDate(`${g.plan.dueDate}T00:00:00+05:00`)}` : '-'}</td>
                </tr>
              ))}
            </Table>
          );
          }}
        </Query>
      </Card>
    </>
  );
}
