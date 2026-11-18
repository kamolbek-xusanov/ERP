import { FormEvent, useState } from 'react';
import { api } from '../../api/client';
import { Room, Timetable } from '../../api/types';
import { Button, Card, Field, FormError, Input, PageHeader, Query, Select, Table } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { DAY_KEYS, DAY_LABEL } from '../../utils/format';

function RoomForm({ room, onDone }: { room?: Room; onDone?: () => void }) {
  const m = useAction(
    (v: { name: string; capacity: number }) => (room ? api.put(`/admin/rooms/${room.id}`, v) : api.post('/admin/rooms', v)),
    ['/admin/rooms'],
    onDone,
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    m.mutate({ name: String(f.get('name')), capacity: Number(f.get('capacity')) }, { onSuccess: () => !room && form.reset() });
  };
  return (
    <form className="form" onSubmit={submit}>
      <div className="form-row">
        <Field label="Xona nomi" name="name" error={m.error}>
          <Input name="name" defaultValue={room?.name} required />
        </Field>
        <Field label="Sig'im (1-60)" name="capacity" error={m.error}>
          <Input name="capacity" type="number" min={1} max={60} defaultValue={room?.capacity} required />
        </Field>
      </div>
      <FormError error={m.error} />
      <div className="toolbar">
        <Button type="submit" loading={m.isPending}>
          {room ? 'Saqlash' : "Qo'shish"}
        </Button>
        {room && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Bekor qilish
          </Button>
        )}
      </div>
    </form>
  );
}

function TimetableView() {
  const [day, setDay] = useState('MON');
  const q = useGet<Timetable>(`/admin/rooms/timetable?day=${day}`);
  return (
    <Card title="Xonalar jadvali">
      <div className="toolbar">
        <Select value={day} onChange={(e) => setDay(e.target.value)}>
          {DAY_KEYS.map((d) => (
            <option key={d} value={d}>
              {DAY_LABEL[d]}
            </option>
          ))}
        </Select>
      </div>
      <Query q={q}>
        {(t) => (
          <Table head={['Xona', ...t.slots]}>
            {t.rooms.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name} <span className="muted">({r.capacity})</span>
                </td>
                {t.slots.map((s) => (
                  <td key={s}>
                    {r.cells[s] ? (
                      <span>
                        {r.cells[s]!.groupName}
                        <div className="muted">{r.cells[s]!.teacher}</div>
                      </span>
                    ) : (
                      <span className="cell-present">bo'sh</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </Table>
        )}
      </Query>
    </Card>
  );
}

export default function AdminRoomsPage() {
  const rooms = useGet<Room[]>('/admin/rooms');
  const [edit, setEdit] = useState<string | null>(null);
  return (
    <>
      <PageHeader title="Xonalar" />
      <div className="grid-2">
        <Card title="Xona qo'shish">
          <RoomForm />
        </Card>
        <Card title="Xonalar">
          <Query q={rooms}>
            {(list) => (
              <ul className="list">
                {list.map((r) => (
                  <li key={r.id}>
                    {edit === r.id ? (
                      <div style={{ width: '100%' }}>
                        <RoomForm room={r} onDone={() => setEdit(null)} />
                      </div>
                    ) : (
                      <>
                        <span>
                          {r.name} <span className="muted">({r.capacity} o'rin)</span>
                        </span>
                        <button type="button" className="link" onClick={() => setEdit(r.id)}>
                          O'zgartirish
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Query>
        </Card>
      </div>
      <TimetableView />
    </>
  );
}
