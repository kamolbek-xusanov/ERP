import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GroupLessons } from '../../api/types';
import { GroupPicker } from '../../components/GroupPicker';
import { Badge, Card, Empty, Input, PageHeader, Query, Select, Stat, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { EXAM_LABEL, fmtDateTime, HW_LABEL } from '../../utils/format';

const hwTone = (s: string) => (s === 'done' ? 'success' : s === 'pending' ? 'info' : s === 'returned' ? 'warning' : s === 'not-done' ? 'danger' : 'neutral');
const examTone = (s: string) => (s === 'done' ? 'success' : s === 'ready' ? 'info' : 'danger');

function GroupLessonsView({ groupId }: { groupId: string }) {
  const [sp] = useSearchParams();
  const [filters, setFilters] = useState({ q: sp.get('q') ?? '', status: '', homework: '', order: 'newest' });
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  const q = useGet<GroupLessons>(`/student/groups/${groupId}/lessons?${params.toString()}`);
  const set = (key: string, value: string) => setFilters({ ...filters, [key]: value });

  return (
    <>
      <div className="toolbar">
        <Input placeholder="Dars nomi" value={filters.q} onChange={(e) => set('q', e.target.value)} />
        <Select value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Hamma holat</option>
          <option value="completed">Tugatilgan</option>
          <option value="in-progress">Jarayonda</option>
        </Select>
        <Select value={filters.homework} onChange={(e) => set('homework', e.target.value)}>
          <option value="">Hamma vazifa</option>
          {Object.entries(HW_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={filters.order} onChange={(e) => set('order', e.target.value)}>
          <option value="newest">Yangilari avval</option>
          <option value="oldest">Eskilari avval</option>
        </Select>
      </div>
      <Query q={q}>
        {(d) => (
          <>
            <div className="grid">
              <Stat label="Tugatilgan darslar" value={`${d.stats.progress}%`} />
              <Stat label="O'rtacha ball" value={d.stats.avgBall ?? '-'} />
              <Stat label="Baholangan" value={d.stats.graded} />
              <Stat label="Qatnashgan" value={`${d.stats.attended} / ${d.stats.held}`} />
            </div>
            {d.exams.length > 0 && (
              <Card title="Imtihonlar">
                <ul className="list">
                  {d.exams.map((e) => (
                    <li key={e.id}>
                      <span>
                        <Link to={`/lessons/${e.id}`}>
                          {e.number}-imtihon: {e.title}
                        </Link>{' '}
                        <span className="muted">{fmtDateTime(e.date)}</span>
                        {e.status === 'blocked' && e.missingLessons && (
                          <div className="muted">Topshirilmagan vazifalar: {e.missingLessons.map((m) => m.title).join(', ')}</div>
                        )}
                      </span>
                      <span>
                        {e.ball !== undefined && <strong>{e.ball} ball </strong>}
                        <Badge tone={examTone(e.status)}>{EXAM_LABEL[e.status]}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card title="Darslar">
              {d.lessons.length === 0 ? (
                <Empty>Dars topilmadi.</Empty>
              ) : (
                <Table head={['Dars', 'Sana', 'Video', 'Davomat', 'Vazifa', 'Ball']}>
                  {d.lessons.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link to={`/lessons/${l.id}`}>{l.title}</Link> {l.isExam && <Badge tone="warning">Imtihon</Badge>}
                      </td>
                      <td>{fmtDateTime(l.startsAt)}</td>
                      <td>
                        <Badge tone={l.status === 'completed' ? 'success' : 'neutral'}>{l.progress}%</Badge>
                      </td>
                      <td>{l.attendance === 'present' ? 'Qatnashdi' : l.attendance === 'absent' ? 'Qatnashmadi' : '-'}</td>
                      <td>
                        <Badge tone={hwTone(l.homework.status)}>{HW_LABEL[l.homework.status]}</Badge>
                        {l.homework.dueAt && l.homework.status !== 'done' && l.homework.status !== 'not-assigned' && (
                          <div className="muted">{fmtDateTime(l.homework.dueAt)} gacha</div>
                        )}
                      </td>
                      <td>
                        {l.homework.ball !== null ? (
                          l.homework.late && l.homework.rawBall !== null ? (
                            `${l.homework.rawBall} - ${l.homework.rawBall - l.homework.ball} = ${l.homework.ball}`
                          ) : (
                            l.homework.ball
                          )
                        ) : (
                          '-'
                        )}
                      </td>
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

export default function LessonsPage() {
  return (
    <>
      <PageHeader title="Darslar" />
      <GroupPicker endpoint="/student/groups">{(id) => <GroupLessonsView groupId={id} />}</GroupPicker>
    </>
  );
}
