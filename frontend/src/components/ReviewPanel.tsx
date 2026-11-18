import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { TeacherSubmission } from '../api/types';
import { useAction, useGet } from '../hooks/useApi';
import { fmtDateTime, HW_LABEL } from '../utils/format';
import { DownloadLink } from './DownloadLink';
import { Badge, Button, Card, Field, FormError, Input, Query, Textarea } from './ui';

/** Topshirilgan ishni ko'rish, baholash yoki qaytarish. Dars sahifasida ham, "Tekshirish" bo'limida ham ishlatiladi. */
export function ReviewPanel({ lessonId, studentId, name, subtitle, onClose, onDone }: { lessonId: string; studentId: string; name: string; subtitle?: string; onClose: () => void; onDone?: () => void }) {
  const sub = useGet<TeacherSubmission>(`/teacher/lessons/${lessonId}/students/${studentId}/submission`);
  const keys = [`/teacher/lessons/${lessonId}`, `/teacher/lessons/${lessonId}/students`, '/teacher/review', '/teacher/groups', '/teacher/dashboard'];
  const finish = () => {
    onDone?.();
    onClose();
  };
  const grade = useAction((ball: number) => api.post(`/teacher/lessons/${lessonId}/students/${studentId}/grade`, { ball }), keys, finish);
  const back = useAction((feedback: string) => api.post(`/teacher/lessons/${lessonId}/students/${studentId}/return`, { feedback }), keys, finish);
  const [ball, setBall] = useState('');
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (sub.data?.grade) setBall(String(sub.data.grade));
  }, [sub.data]);
  return (
    <Card title={`${name}: topshirilgan ish`} subtitle={subtitle}>
      <Query q={sub}>
        {(s) => (
          <>
            <p>
              <Badge>{HW_LABEL[s.status === 'DONE' ? 'done' : s.status === 'PENDING' ? 'pending' : s.status === 'RETURNED' ? 'returned' : 'not-done']}</Badge>{' '}
              {s.late && <Badge tone="danger">Kechikkan</Badge>} <span className="muted">{fmtDateTime(s.submittedAt)}</span>
            </p>
            <p>{s.text || <span className="muted">Matn yo'q.</span>}</p>
            <ul className="file-list">
              {s.files.map((f) => (
                <li key={f.id}>
                  <DownloadLink file={f} />
                </li>
              ))}
            </ul>
            {s.feedback && <p className="muted">Oldingi izoh: {s.feedback}</p>}
            <div className="form-row">
              <div className="form">
                <Field label="Ball (1-100)">
                  <Input type="number" min={1} max={100} value={ball} onChange={(e) => setBall(e.target.value)} />
                </Field>
                <FormError error={grade.error} />
                <Button onClick={() => grade.mutate(Number(ball))} loading={grade.isPending} disabled={!ball}>
                  Baholash
                </Button>
              </div>
              <div className="form">
                <Field label="Qaytarish izohi">
                  <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                </Field>
                <FormError error={back.error} />
                <Button variant="danger" onClick={() => back.mutate(feedback)} loading={back.isPending} disabled={!feedback.trim()}>
                  Qaytarish (+24 soat)
                </Button>
              </div>
            </div>
          </>
        )}
      </Query>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>
          Yopish
        </Button>
      </div>
    </Card>
  );
}

