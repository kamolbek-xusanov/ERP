import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TeacherGroupLessons } from '../../api/types';
import { GroupPicker } from '../../components/GroupPicker';
import { Badge, Card, Empty, Input, PageHeader, Query, Select, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDateTime } from '../../utils/format';

function View({ groupId }: { groupId: string }) {
  const [q, setQ] = useState('');
  const [order, setOrder] = useState('newest');
  const data = useGet<TeacherGroupLessons>(`/teacher/groups/${groupId}/lessons?order=${order}&q=${encodeURIComponent(q)}`);
  return (
    <>
      <div className="toolbar">
        <Input placeholder="Dars nomi" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="newest">Yangilari avval</option>
          <option value="oldest">Eskilari avval</option>
        </Select>
      </div>
      <Query q={data}>
        {(d) => (
          <>
            <p className="muted">Oxirgi imtihondan beri o'tilgan darslar: {d.sinceLastExam}</p>
            {d.exams.length > 0 && (
              <Card title="Imtihonlar">
                <Table head={['Imtihon', 'Sana', 'Ruxsat berilgan', 'Baholangan']}>
                  {d.exams.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Link to={`/teacher/exams/${e.id}`}>
                          {e.number}-imtihon: {e.title}
                        </Link>
                      </td>
                      <td>{fmtDateTime(e.date)}</td>
                      <td>
                        {e.admitted} / {e.total}
                      </td>
                      <td>
                        {e.graded} / {e.total}
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            )}
            <Card title="Darslar">
              {d.lessons.length === 0 ? (
                <Empty>Dars topilmadi.</Empty>
              ) : (
                <Table head={['Dars', 'Sana', 'Qatnashgan', 'Topshirgan', 'Kutilmoqda', 'Baholangan', 'Qaytarilgan', 'Bajarmagan', 'Davomat']}>
                  {d.lessons.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link to={`/teacher/lessons/${l.id}`}>{l.title}</Link> {l.isExam && <Badge tone="warning">Imtihon</Badge>}
                      </td>
                      <td>{fmtDateTime(l.startsAt)}</td>
                      <td>
                        {l.summary.attended} / {l.summary.students}
                      </td>
                      <td>{l.summary.handedIn}</td>
                      <td>{l.summary.pending}</td>
                      <td>{l.summary.done}</td>
                      <td>{l.summary.returned}</td>
                      <td>{l.summary.notDone}</td>
                      <td>{l.attendanceSaved ? <Badge tone="success">Saqlangan</Badge> : '-'}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </>
        )}
      </Query>
    </>
  );
}

export default function TeacherLessonsPage() {
  return (
    <>
      <PageHeader title="Darslar" actions={<Link to="/teacher/lessons/new">Dars boshlash</Link>} />
      <GroupPicker endpoint="/teacher/groups">{(id) => <View groupId={id} />}</GroupPicker>
    </>
  );
}
