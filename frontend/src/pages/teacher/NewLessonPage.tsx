import { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { GroupCard } from '../../api/types';
import { Button, Card, Field, FormError, Input, PageHeader, Query, Select } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';

export default function NewLessonPage() {
  const groups = useGet<GroupCard[]>('/teacher/groups');
  const navigate = useNavigate();
  const m = useAction(
    (v: { groupId: string; title: string; isExam: boolean }) => api.post<{ id: string }>('/teacher/lessons', v),
    ['/teacher'],
    (lesson) => navigate(`/teacher/lessons/${lesson.id}`),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({ groupId: String(f.get('groupId')), title: String(f.get('title')), isExam: f.get('isExam') === 'on' });
  };
  return (
    <>
      <PageHeader title="Darsni boshlash" />
      <Query q={groups}>
        {(list) => (
          <Card>
            <form className="form" onSubmit={submit}>
              <Field label="Guruh" name="groupId" error={m.error}>
                <Select name="groupId" required>
                  {list.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dars nomi" name="title" error={m.error}>
                <Input name="title" required minLength={3} />
              </Field>
              <label className="check">
                <input type="checkbox" name="isExam" /> Bu dars imtihon
              </label>
              <FormError error={m.error} />
              <Button type="submit" loading={m.isPending}>
                Darsni boshlash
              </Button>
            </form>
          </Card>
        )}
      </Query>
    </>
  );
}
