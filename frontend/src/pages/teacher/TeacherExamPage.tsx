import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ExamDetail } from '../../api/types';
import { Badge, Button, Card, FormError, Input, PageHeader, Query, Table } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { EXAM_LABEL, fmtDateTime } from '../../utils/format';

const tone = (s: string) => (s === 'done' ? 'success' : s === 'ready' ? 'info' : 'danger');

export default function TeacherExamPage() {
  const { id = '' } = useParams();
  const q = useGet<ExamDetail>(`/teacher/exams/${id}`);
  const [balls, setBalls] = useState<Record<string, string>>({});
  const m = useAction((v: { studentId: string; ball: number }) => api.put(`/teacher/exams/${id}/students/${v.studentId}`, { ball: v.ball }), [`/teacher/exams/${id}`, '/teacher/groups']);
  return (
    <Query q={q}>
      {(d) => (
        <>
          <PageHeader title={`${d.exam.number}-imtihon: ${d.exam.title}`} />
          <p className="muted">
            {fmtDateTime(d.exam.date)} | Qamrab olingan darslar: {d.exam.coveredLessons}
          </p>
          <Card>
            <FormError error={m.error} />
            <Table head={["O'quvchi", 'Holat', 'Ball', '']}>
              {d.students.map((s) => (
                <tr key={s.studentId}>
                  <td>{s.name}</td>
                  <td>
                    <Badge tone={tone(s.state)}>{EXAM_LABEL[s.state]}</Badge>
                    {s.state === 'blocked' && s.missingLessons && (
                      <div className="muted">Topshirilmagan: {s.missingLessons.map((l) => l.title).join(', ')}</div>
                    )}
                  </td>
                  <td>
                    {s.state === 'blocked' ? (
                      '-'
                    ) : (
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        style={{ width: 90 }}
                        value={balls[s.studentId] ?? (s.ball !== undefined ? String(s.ball) : '')}
                        onChange={(e) => setBalls({ ...balls, [s.studentId]: e.target.value })}
                      />
                    )}
                  </td>
                  <td>
                    {s.state !== 'blocked' && (
                      <Button
                        className="btn-sm"
                        disabled={!(balls[s.studentId] ?? '')}
                        onClick={() => m.mutate({ studentId: s.studentId, ball: Number(balls[s.studentId]) })}
                      >
                        Saqlash
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </Query>
  );
}
