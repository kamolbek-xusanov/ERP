import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Settings, User } from '../../api/types';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Field, FormError, Input, PageHeader, Query, Select } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { applyTheme } from '../../utils/theme';

function PasswordForm() {
  const [done, setDone] = useState(false);
  const m = useAction(
    (v: { current: string; next: string }) => api.post('/me/password', v),
    [],
    () => setDone(true),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setDone(false);
    m.mutate({ current: String(f.get('current')), next: String(f.get('next')) }, { onSuccess: () => form.reset() });
  };
  return (
    <Card title="Parolni o'zgartirish">
      <form onSubmit={submit} className="form">
        <Field label="Joriy parol" name="current" error={m.error}>
          <Input name="current" type="password" required autoComplete="current-password" />
        </Field>
        <Field label="Yangi parol" name="next" error={m.error}>
          <Input name="next" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <FormError error={m.error} />
        {done && <div className="success-box">Parol o'zgartirildi.</div>}
        <Button type="submit" loading={m.isPending}>
          Saqlash
        </Button>
      </form>
    </Card>
  );
}

function Preferences() {
  const settings = useGet<Settings>('/me/settings');
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);
  const m = useAction((v: Settings) => api.put<Settings>('/me/settings', v), ['/me/settings'], (s) => applyTheme(s.theme));
  if (!form) return null;
  const toggle = (key: 'notifyEmail' | 'notifyPush' | 'notifyReminders') => setForm({ ...form, [key]: !form[key] });
  return (
    <Card title="Sozlamalar">
      <div className="form">
        <label className="check">
          <input type="checkbox" checked={form.notifyEmail} onChange={() => toggle('notifyEmail')} /> Email orqali bildirishnoma
        </label>
        <label className="check">
          <input type="checkbox" checked={form.notifyPush} onChange={() => toggle('notifyPush')} /> Push bildirishnoma
        </label>
        <label className="check">
          <input type="checkbox" checked={form.notifyReminders} onChange={() => toggle('notifyReminders')} /> Eslatmalar
        </label>
        <Field label="Mavzu">
          <Select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as Settings['theme'] })}>
            <option value="dark">Qorong'i</option>
            <option value="light">Yorug'</option>
            <option value="system">Tizim</option>
          </Select>
        </Field>
        <FormError error={m.error} />
        <Button onClick={() => m.mutate(form)} loading={m.isPending}>
          Saqlash
        </Button>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const me = useGet<User>('/me');
  return (
    <>
      <PageHeader title="Sozlamalar" />
      <Query q={me}>
        {(u) => (
          <Card title="Profil" actions={<Link className="btn btn-secondary btn-sm" to={u.role === 'ADMIN' ? '/admin/profile' : u.role === 'TEACHER' ? '/teacher/profile' : '/profile'}>Suratni o'zgartirish</Link>}>
            <div style={{ marginBottom: 18 }}>
              <Avatar name={u.fullName} fileId={u.avatarFileId} size={72} />
            </div>
            <dl className="dl">
              <dt>Ism</dt>
              <dd>{u.fullName}</dd>
              <dt>Login</dt>
              <dd>{u.login}</dd>
              <dt>Telefon</dt>
              <dd>{u.phone ?? '-'}</dd>
              <dt>Email</dt>
              <dd>{u.email ?? '-'}</dd>
            </dl>
          </Card>
        )}
      </Query>
      <div className="grid-2">
        <PasswordForm />
        <Preferences />
      </div>
    </>
  );
}
