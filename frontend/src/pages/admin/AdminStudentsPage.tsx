import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminGroup, AdminStudent } from '../../api/types';
import { Credential, downloadCsv } from '../../components/Credentials';
import { Badge, Button, Card, Empty, Field, FormError, Input, PageHeader, Pager, Query, Select, Table } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { AccountForm } from './AccountForm';

function CreateForm({ groups }: { groups: AdminGroup[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const m = useAction(
    (v: Record<string, unknown>) => api.post('/admin/students', v),
    ['/admin/students', '/admin/groups', '/admin/dashboard'],
    () => setSelected([]),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    m.mutate(
      {
        fullName: f.get('fullName'),
        phone: f.get('phone'),
        login: String(f.get('login')).toLowerCase(),
        password: f.get('password'),
        groupIds: selected,
      },
      { onSuccess: () => form.reset() },
    );
  };
  return (
    <Card title="O'quvchi qo'shish">
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Ism va familiya" name="fullName" error={m.error}>
            <Input name="fullName" required />
          </Field>
          <Field label="Telefon" name="phone" error={m.error}>
            <Input name="phone" placeholder="+998 90 123 45 67" required />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Login" name="login" error={m.error}>
            <Input name="login" required autoComplete="off" />
          </Field>
          <Field label="Parol" name="password" error={m.error}>
            <Input name="password" type="text" required minLength={8} autoComplete="off" />
          </Field>
        </div>
        <Field label="Guruhlar" name="groupIds" error={m.error}>
          <div className="checks">
            {groups.map((g) => (
              <label key={g.id} className="check">
                <input
                  type="checkbox"
                  checked={selected.includes(g.id)}
                  onChange={() => setSelected(selected.includes(g.id) ? selected.filter((x) => x !== g.id) : [...selected, g.id])}
                />
                {g.name} ({g.members}/{g.capacity})
              </label>
            ))}
          </div>
        </Field>
        <FormError error={m.error} />
        <Button type="submit" loading={m.isPending}>
          Qo'shish
        </Button>
      </form>
    </Card>
  );
}

export default function AdminStudentsPage() {
  const [params0] = useSearchParams();
  const [q, setQ] = useState(params0.get('q') ?? '');
  useEffect(() => setQ(params0.get('q') ?? ''), [params0]);
  const [groupId, setGroupId] = useState('');
  const [account, setAccount] = useState<AdminStudent | null>(null);
  const [enrol, setEnrol] = useState<{ student: AdminStudent; groupId: string } | null>(null);
  const groups = useGet<AdminGroup[]>('/admin/groups');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, groupId]);
  const params = new URLSearchParams({ q, page: String(page), limit: '50', ...(groupId ? { groupId } : {}) });
  const list = useGet<AdminStudent[]>(`/admin/students?${params.toString()}`);
  const keys = ['/admin/students', '/admin/groups'];
  const enrolM = useAction((v: { id: string; groupId: string }) => api.post(`/admin/students/${v.id}/enrol`, { groupId: v.groupId }), keys, () => setEnrol(null));
  const removeM = useAction((v: { id: string; groupId: string }) => api.del(`/admin/students/${v.id}/groups/${v.groupId}`), keys);
  const activeM = useAction((v: { id: string; isActive: boolean }) => api.put(`/admin/users/${v.id}/active`, { isActive: v.isActive }), keys);
  const rowError = enrolM.error ?? removeM.error ?? activeM.error;

  return (
    <>
      <PageHeader title="O'quvchilar" />
      <Query q={groups}>{(g) => <CreateForm groups={g} />}</Query>
      {account && <AccountForm key={account.id} kind="students" id={account.id} name={account.fullName} phone={account.phone} onClose={() => setAccount(null)} />}
      <Card title="Ro'yxat">
        <div className="toolbar">
          <Input placeholder="Qidirish: ism, login, telefon" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Hamma guruh</option>
            {groups.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            disabled={!list.data?.length}
            onClick={() =>
              downloadCsv('oquvchilar.csv', [
                ['Ism', 'Login', 'Parol', 'Telefon', 'Guruhlar'],
                ...(list.data ?? []).map((s) => [s.fullName, s.login, s.password ?? "o'zgartirgan", s.phone, s.groups.map((g) => g.name).join('; ')]),
              ])
            }
          >
            Yuklab olish (CSV)
          </Button>
        </div>
        <FormError error={rowError} />
        <Query q={list}>
          {(items) =>
            items.length === 0 ? (
              <Empty>O'quvchi topilmadi.</Empty>
            ) : (
              <>
              <Table head={['Ism', 'Login', 'Telefon', 'Guruhlar', 'Parol', '']}>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.fullName} {s.isNew && <Badge tone="info">Yangi</Badge>} {s.isActive === false && <Badge tone="danger">Bloklangan</Badge>}
                    </td>
                    <td>
                      <Credential value={s.login} />
                    </td>
                    <td>{s.phone}</td>
                    <td>
                      {s.groups.map((g) => (
                        <div key={g.id}>
                          {g.name}{' '}
                          <button type="button" className="link" onClick={() => confirm(`${s.fullName} ni "${g.name}" guruhidan chiqarasizmi?`) && removeM.mutate({ id: s.id, groupId: g.id })}>
                            chiqarish
                          </button>
                        </div>
                      ))}
                      {enrol?.student.id === s.id ? (
                        <div className="toolbar">
                          <Select value={enrol.groupId} onChange={(e) => setEnrol({ student: s, groupId: e.target.value })}>
                            <option value="">Guruh tanlang</option>
                            {groups.data?.filter((g) => !s.groups.some((x) => x.id === g.id)).map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </Select>
                          <Button className="btn-sm" disabled={!enrol.groupId} onClick={() => enrolM.mutate({ id: s.id, groupId: enrol.groupId })}>
                            Qo'shish
                          </Button>
                        </div>
                      ) : (
                        <button type="button" className="link" onClick={() => setEnrol({ student: s, groupId: '' })}>
                          + guruhga qo'shish
                        </button>
                      )}
                    </td>
                    <td>
                      <Credential secret value={s.password} empty="O'zgartirgan" />
                    </td>
                    <td>
                      <div className="toolbar">
                        <Button variant="secondary" className="btn-sm" onClick={() => setAccount(s)}>
                          Tahrirlash
                        </Button>
                        <Button variant="ghost" className="btn-sm" onClick={() => activeM.mutate({ id: s.id, isActive: s.isActive === false })}>
                          {s.isActive === false ? 'Faollashtirish' : 'Bloklash'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
              <Pager page={page} onPage={setPage} hasNext={items.length >= 50} />
              </>
            )
          }
        </Query>
      </Card>
    </>
  );
}
