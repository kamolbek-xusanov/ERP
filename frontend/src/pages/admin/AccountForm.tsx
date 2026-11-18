import { FormEvent } from 'react';
import { api } from '../../api/client';
import { Button, Card, Field, FormError, Input } from '../../components/ui';
import { useAction } from '../../hooks/useApi';

export function AccountForm({ kind, id, name, phone, onClose }: { kind: 'students' | 'teachers'; id: string; name: string; phone?: string | null; onClose: () => void }) {
  const m = useAction(
    (v: { fullName?: string; phone?: string; login?: string; password?: string }) => api.put(`/admin/${kind}/${id}/account`, v),
    [`/admin/${kind}`, '/admin/audit-logs', '/admin/groups'],
    onClose,
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: { fullName?: string; phone?: string; login?: string; password?: string } = {};
    const fullName = String(f.get('fullName') ?? '').trim();
    const phoneValue = String(f.get('phone') ?? '').trim();
    if (fullName && fullName !== name) body.fullName = fullName;
    if (phoneValue && phoneValue !== (phone ?? '')) body.phone = phoneValue;
    const login = String(f.get('login') ?? '').trim();
    const password = String(f.get('password') ?? '');
    if (login) body.login = login;
    if (password) body.password = password;
    m.mutate(body);
  };
  return (
    <Card title={`${name}: ma'lumotlarni tahrirlash`} subtitle="Faqat o'zgartirmoqchi bo'lgan maydonlarni to'ldiring.">
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Ism va familiya" name="fullName" error={m.error}>
            <Input name="fullName" defaultValue={name} autoComplete="off" />
          </Field>
          <Field label="Telefon" name="phone" error={m.error}>
            <Input name="phone" defaultValue={phone ?? ''} placeholder="+998 90 123 45 67" autoComplete="off" />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Yangi login" name="login" error={m.error}>
            <Input name="login" autoComplete="off" />
          </Field>
          <Field label="Yangi parol (kamida 8 belgi)" name="password" error={m.error}>
            <Input name="password" type="text" autoComplete="off" />
          </Field>
        </div>
        <FormError error={m.error} />
        <div className="toolbar">
          <Button type="submit" loading={m.isPending}>
            Saqlash
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Card>
  );
}
