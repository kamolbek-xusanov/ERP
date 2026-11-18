import { FormEvent, Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminStudent } from '../../api/types';
import { Credential, downloadCsv } from '../../components/Credentials';
import { Button, Card, Empty, Field, FormError, Input, Loader, PageHeader, Query, Table } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { norm } from '../../hooks/useSearchIndex';
import { AccountForm } from './AccountForm';

/** Ustozning o'quvchilari: login va parol bilan (admin ko'radi). */
function TeacherStudents({ teacher }: { teacher: AdminStudent }) {
  const q = useGet<AdminStudent[]>(`/admin/teachers/${teacher.id}/students`);
  return (
    <div className="subpanel">
      <div className="subpanel-head">
        <strong>{teacher.fullName} o'quvchilari</strong>
        <Button
          variant="secondary"
          className="btn-sm"
          disabled={!q.data?.length}
          onClick={() =>
            downloadCsv(`${teacher.login}-oquvchilari.csv`, [
              ['Ism', 'Login', 'Parol', 'Telefon', 'Guruhlar'],
              ...(q.data ?? []).map((s) => [s.fullName, s.login, s.password ?? "o'zgartirgan", s.phone, s.groups.map((g) => g.name).join('; ')]),
            ])
          }
        >
          Yuklab olish (CSV)
        </Button>
      </div>
      {q.isLoading && <Loader />}
      {q.error && <div className="error-box">{q.error.message}</div>}
      {q.data && q.data.length === 0 && <Empty>Bu ustozda hali o'quvchi yo'q.</Empty>}
      {q.data && q.data.length > 0 && (
        <Table head={['Ism', 'Login', 'Parol', 'Telefon', 'Guruh']}>
          {q.data.map((s) => (
            <tr key={s.id}>
              <td>{s.fullName}</td>
              <td>
                <Credential value={s.login} />
              </td>
              <td>
                <Credential secret value={s.password} empty="O'zgartirgan" />
              </td>
              <td>{s.phone}</td>
              <td>{s.groups.map((g) => g.name).join(', ')}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

export default function AdminTeachersPage() {
  const list = useGet<AdminStudent[]>('/admin/teachers');
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(params.get('q') ?? '');
  useEffect(() => setFilter(params.get('q') ?? ''), [params]);
  const match = (t: AdminStudent) => !filter.trim() || norm(`${t.fullName} ${t.login} ${t.phone ?? ''}`).includes(norm(filter));
  const [account, setAccount] = useState<AdminStudent | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const m = useAction((v: Record<string, unknown>) => api.post('/admin/teachers', v), ['/admin/teachers', '/admin/dashboard']);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    m.mutate(
      { fullName: f.get('fullName'), phone: f.get('phone'), login: String(f.get('login')).toLowerCase(), password: f.get('password') },
      { onSuccess: () => form.reset() },
    );
  };
  return (
    <>
      <PageHeader title="Ustozlar" subtitle="Ustozlar, ularning o'quvchilari, login va parollari" />
      <Card title="Ustoz qo'shish">
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
          <FormError error={m.error} />
          <div className="form-actions">
            <Button type="submit" loading={m.isPending}>
              Qo'shish
            </Button>
          </div>
        </form>
      </Card>
      {account && <AccountForm key={account.id} kind="teachers" id={account.id} name={account.fullName} phone={account.phone} onClose={() => setAccount(null)} />}
      <Card title="Ro'yxat">
        <div className="toolbar">
          <Input placeholder="Qidirish: ism, login, telefon" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Button
            variant="secondary"
            disabled={!list.data?.length}
            onClick={() =>
              downloadCsv('ustozlar.csv', [
                ['Ism', 'Login', 'Parol', 'Telefon', "O'quvchilar soni", 'Guruhlar'],
                ...(list.data ?? []).map((t) => [t.fullName, t.login, t.password ?? "o'zgartirgan", t.phone, t.studentsCount ?? 0, t.groups.map((g) => g.name).join('; ')]),
              ])
            }
          >
            Yuklab olish (CSV)
          </Button>
        </div>
        <Query q={list}>
          {(all) => {
            const items = all.filter(match);
            return items.length === 0 ? (
              <Empty>Ustoz topilmadi.</Empty>
            ) : (
              <Table head={['Ism', 'Login', 'Parol', 'Telefon', "O'quvchilar", 'Guruhlar', '']}>
                {items.map((t) => (
                  <Fragment key={t.id}>
                    <tr>
                      <td>{t.fullName}</td>
                      <td>
                        <Credential value={t.login} />
                      </td>
                      <td>
                        <Credential secret value={t.password} empty="O'zgartirgan" />
                      </td>
                      <td>{t.phone}</td>
                      <td>{t.studentsCount ?? 0} ta</td>
                      <td>{t.groups.map((g) => g.name).join(', ') || '-'}</td>
                      <td>
                        <div className="toolbar" style={{ marginBottom: 0 }}>
                          <Button variant={open === t.id ? 'primary' : 'secondary'} className="btn-sm" onClick={() => setOpen(open === t.id ? null : t.id)}>
                            {open === t.id ? 'Yopish' : "O'quvchilari"}
                          </Button>
                          <Button variant="ghost" className="btn-sm" onClick={() => setAccount(t)}>
                            Tahrirlash
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {open === t.id && (
                      <tr className="row-expand">
                        <td colSpan={7}>
                          <TeacherStudents teacher={t} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Table>
            );
          }}
        </Query>
      </Card>
    </>
  );
}
