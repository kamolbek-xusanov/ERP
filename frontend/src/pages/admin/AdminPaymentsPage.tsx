import { FormEvent, useState } from 'react';
import { api } from '../../api/client';
import { AdminPayments, AdminStudent } from '../../api/types';
import { Badge, Button, Card, Field, FormError, Input, PageHeader, Query, Select, Table } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { fmtDate, fmtDateTime, fmtMoney } from '../../utils/format';

function PlanRow({ g }: { g: AdminPayments['groups'][number] }) {
  const [edit, setEdit] = useState(false);
  const m = useAction(
    (v: { amount: number; dueDate: string }) => api.put(`/admin/groups/${g.groupId}/payment-plan`, v),
    ['/admin/payments', '/admin/dashboard', '/admin/groups'],
    () => setEdit(false),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({ amount: Number(f.get('amount')), dueDate: String(f.get('dueDate')) });
  };
  return (
    <tr>
      <td>{g.name}</td>
      <td>{g.members}</td>
      <td>
        {edit ? (
          <form className="toolbar" onSubmit={submit}>
            <Input name="amount" type="number" min={10000} step={1000} defaultValue={g.plan.amount} style={{ width: 130 }} required />
            <Input name="dueDate" type="date" defaultValue={g.plan.dueDate} required />
            <Button type="submit" className="btn-sm" loading={m.isPending}>
              Saqlash va yuborish
            </Button>
            <Button type="button" variant="ghost" className="btn-sm" onClick={() => setEdit(false)}>
              Bekor qilish
            </Button>
            <FormError error={m.error} />
          </form>
        ) : (
          `${fmtMoney(g.plan.amount)}, ${fmtDate(`${g.plan.dueDate}T00:00:00+05:00`)}`
        )}
      </td>
      <td>
        <Badge tone={g.daysLeft < 0 ? 'danger' : g.daysLeft <= 5 ? 'warning' : 'neutral'}>{g.daysLeft} kun</Badge>
      </td>
      <td>
        {!edit && (
          <Button variant="secondary" className="btn-sm" onClick={() => setEdit(true)}>
            O'zgartirish
          </Button>
        )}
      </td>
    </tr>
  );
}

function RecordForm({ groups }: { groups: AdminPayments['groups'] }) {
  const students = useGet<AdminStudent[]>('/admin/students?limit=200');
  const m = useAction((v: Record<string, unknown>) => api.post('/admin/payments', v), ['/admin/payments']);
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setDone(false);
    m.mutate(
      {
        studentId: f.get('studentId'),
        groupId: f.get('groupId'),
        amount: Number(f.get('amount')),
        paidAt: f.get('paidAt'),
        method: f.get('method'),
        description: f.get('description'),
      },
      {
        onSuccess: () => {
          setDone(true);
          form.reset();
        },
      },
    );
  };
  return (
    <Card title="To'lovni yozish">
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="O'quvchi" name="studentId" error={m.error}>
            <Select name="studentId" required defaultValue="">
              <option value="" disabled>
                Tanlang
              </option>
              {students.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guruh" name="groupId" error={m.error}>
            <Select name="groupId" required defaultValue="">
              <option value="" disabled>
                Tanlang
              </option>
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Summa" name="amount" error={m.error}>
            <Input name="amount" type="number" min={10000} step={1000} required />
          </Field>
          <Field label="Sana" name="paidAt" error={m.error}>
            <Input name="paidAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Usul" name="method" error={m.error}>
            <Input name="method" placeholder="Uzcard •• 8600" required />
          </Field>
        </div>
        <Field label="Izoh" name="description" error={m.error}>
          <Input name="description" placeholder="Standart to'lov - noyabr" />
        </Field>
        <FormError error={m.error} />
        {done && <div className="success-box">To'lov yozildi.</div>}
        <Button type="submit" loading={m.isPending}>
          Yozish
        </Button>
      </form>
    </Card>
  );
}

export default function AdminPaymentsPage() {
  const q = useGet<AdminPayments>('/admin/payments');
  return (
    <>
      <PageHeader title="To'lovlar" />
      <Query q={q}>
        {(d) => (
          <>
            <Card title="Guruhlar to'lov rejasi">
              <Table head={['Guruh', "O'quvchilar", "Keyingi to'lov", 'Qoldi', '']}>
                {d.groups.map((g) => (
                  <PlanRow key={g.groupId} g={g} />
                ))}
              </Table>
            </Card>
            <RecordForm groups={d.groups} />
            <Card title="Yuborilgan eslatmalar">
              <Table head={['Guruh', 'Summa', 'Sana', 'Yuborilgan', 'Qabul qiluvchi']}>
                {d.notices.map((n) => (
                  <tr key={n.id}>
                    <td>{n.groupName}</td>
                    <td>{fmtMoney(n.amount)}</td>
                    <td>{fmtDate(`${n.dueDate}T00:00:00+05:00`)}</td>
                    <td>{fmtDateTime(n.sentAt)}</td>
                    <td>{n.recipients}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          </>
        )}
      </Query>
    </>
  );
}
