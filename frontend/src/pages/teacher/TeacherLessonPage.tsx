import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, UploadedFile } from '../../api/client';
import { TeacherLessonDetail, TeacherSubmission } from '../../api/types';
import { DownloadLink } from '../../components/DownloadLink';
import { FileUpload } from '../../components/FileUpload';
import { VideoPlayer } from '../../components/VideoPlayer';
import { Badge, Button, Card, Field, FormError, Input, PageHeader, Query, Select, Table, Textarea } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { ReviewPanel } from '../../components/ReviewPanel';
import { fmtDateTime, HW_LABEL } from '../../utils/format';

const LIMITS: [number, string][] = [
  [1, '1 soat'],
  [3, '3 soat'],
  [24, '1 kun'],
  [72, '3 kun'],
  [168, '1 hafta'],
];

function InfoForm({ d }: { d: TeacherLessonDetail }) {
  const [video, setVideo] = useState<UploadedFile[]>([]);
  const m = useAction(
    (v: { description: string; videoUrl?: string; videoFileId?: string; durationMin: number }) => api.put(`/teacher/lessons/${d.lesson.id}/info`, v),
    [`/teacher/lessons/${d.lesson.id}`],
    () => setVideo([]),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: { description: string; videoUrl?: string; videoFileId?: string; durationMin: number } = {
      description: String(f.get('description') ?? ''),
      durationMin: Number(f.get('durationMin')),
    };
    if (video[0]) body.videoFileId = video[0].id;
    else body.videoUrl = String(f.get('videoUrl') ?? '');
    m.mutate(body);
  };
  return (
    <Card title="Dars ma'lumotlari">
      <form className="form" onSubmit={submit}>
        <Field label="Tavsif (bo'sh yoki kamida 10 belgi)" name="description" error={m.error}>
          <Textarea name="description" defaultValue={d.lesson.description} />
        </Field>
        <div className="form-row">
          <Field label="Video havola" name="videoUrl" error={m.error}>
            <Input name="videoUrl" defaultValue={d.lesson.videoUrl ?? ''} placeholder="https://" disabled={video.length > 0} />
          </Field>
          <Field label="Davomiylik (daqiqa, 10-240)" name="durationMin" error={m.error}>
            <Input name="durationMin" type="number" min={10} max={240} defaultValue={d.lesson.durationMin} required />
          </Field>
        </div>
        <Field label="Yoki video fayl (300 MB gacha)" name="videoFileId" error={m.error}>
          <FileUpload purpose="video" max={1} value={video} onChange={setVideo} accept=".mp4,.webm,.mov,.m4v" />
        </Field>
        <VideoPlayer url={d.video.url} fileId={d.video.fileId} />
        <FormError error={m.error} />
        <Button type="submit" loading={m.isPending}>
          Saqlash
        </Button>
      </form>
    </Card>
  );
}

function HomeworkForm({ d }: { d: TeacherLessonDetail }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const m = useAction(
    (v: { task: string; steps: string[]; limitHours: number; attachmentIds: string[] }) => api.put(`/teacher/lessons/${d.lesson.id}/homework`, v),
    [`/teacher/lessons/${d.lesson.id}`],
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const attachments = files.length ? files : [];
    m.mutate({
      task: String(f.get('task')),
      steps: String(f.get('steps')).split('\n').map((s) => s.trim()).filter(Boolean),
      limitHours: Number(f.get('limitHours')),
      attachmentIds: attachments.map((x) => x.id),
    });
  };
  return (
    <Card title={d.homework ? 'Vazifani yangilash' : 'Vazifa berish'}>
      {d.homework && (
        <p className="muted">
          Hozirgi muddat: {fmtDateTime(d.homework.dueAt)}. Yangilash faqat hali topshirmaganlarga ta'sir qiladi.
        </p>
      )}
      {d.homework && d.homework.attachments.length > 0 && (
        <ul className="file-list">
          {d.homework.attachments.map((f) => (
            <li key={f.id}>
              <DownloadLink file={f} />
            </li>
          ))}
        </ul>
      )}
      <form className="form" onSubmit={submit} key={d.homework?.id ?? 'new'}>
        <Field label="Vazifa matni (kamida 10 belgi)" name="task" error={m.error}>
          <Textarea name="task" defaultValue={d.homework?.task} required />
        </Field>
        <Field label="Qadamlar (har biri alohida qatorda)" name="steps" error={m.error}>
          <Textarea name="steps" defaultValue={d.homework?.steps.join('\n')} required />
        </Field>
        <Field label="Muddat" name="limitHours" error={m.error}>
          <Select name="limitHours" defaultValue={d.homework?.timeLimit ?? 24}>
            {LIMITS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Materiallar (5 tagacha, 20 MB gacha). Yangilashda qayta tanlang." name="attachmentIds" error={m.error}>
          <FileUpload purpose="material" max={5} value={files} onChange={setFiles} />
        </Field>
        <FormError error={m.error} />
        <Button type="submit" loading={m.isPending}>
          {d.homework ? 'Yangilash' : 'Vazifa berish'}
        </Button>
      </form>
    </Card>
  );
}

function Attendance({ d }: { d: TeacherLessonDetail }) {
  const key = [`/teacher/lessons/${d.lesson.id}`];
  const mark = useAction((v: { id: string; present: boolean }) => api.put(`/teacher/lessons/${d.lesson.id}/attendance/${v.id}`, { present: v.present }), key);
  const leave = useAction((id: string) => api.put(`/teacher/lessons/${d.lesson.id}/attendance/${id}/leave`), key);
  const all = useAction(() => api.post(`/teacher/lessons/${d.lesson.id}/attendance/mark-all`), key);
  const save = useAction(() => api.post(`/teacher/lessons/${d.lesson.id}/attendance/save`), key);
  const locked = d.attendanceSaved;
  const error = mark.error ?? all.error ?? save.error ?? leave.error;
  const time = (v: string | null) => (v ? fmtDateTime(v).split(', ')[1] : '-');
  return (
    <Card title="Davomat" subtitle={locked ? "Davomat saqlangan va qulflangan, o'zgartirib bo'lmaydi." : "Saqlangandan keyin davomatni o'zgartirib bo'lmaydi."}>
      <div className="toolbar">
        {locked ? (
          <Badge tone="success">Saqlangan (qulflangan)</Badge>
        ) : (
          <>
            <Button variant="secondary" onClick={() => all.mutate(undefined)} loading={all.isPending}>
              Hammasi keldi
            </Button>
            <Button
              onClick={() => confirm("Davomat saqlangandan keyin o'zgartirib bo'lmaydi. Saqlaysizmi?") && save.mutate(undefined)}
              loading={save.isPending}
            >
              Davomatni saqlash
            </Button>
          </>
        )}
      </div>
      <FormError error={error} />
      <Table head={["O'quvchi", 'Holat', 'Keldi', 'Ketdi', '']}>
        {d.students.map((s) => (
          <tr key={s.studentId}>
            <td>{s.name}</td>
            <td>{s.attended ? <span className="cell-present">Keldi</span> : <span className="cell-absent">Kelmadi</span>}</td>
            <td>{time(s.arrivedAt)}</td>
            <td>{time(s.leftAt)}</td>
            <td>
              {!locked && (
                <div className="toolbar" style={{ marginBottom: 0 }}>
                  <Button variant={s.attended ? 'ghost' : 'secondary'} className="btn-sm" onClick={() => mark.mutate({ id: s.studentId, present: !s.attended })}>
                    {s.attended ? 'Kelmadi' : 'Keldi'}
                  </Button>
                  <Button variant="ghost" className="btn-sm" disabled={!!s.leftAt} onClick={() => leave.mutate(s.studentId)}>
                    Ketdi
                  </Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Ratings({ d }: { d: TeacherLessonDetail }) {
  const r = d.ratings;
  return (
    <Card title="Dars baholari" subtitle="O'quvchilar uyga vazifadan oldin darsni baholaydi">
      {r.count === 0 ? (
        <p className="muted">Hali baho qo'yilmagan.</p>
      ) : (
        <>
          <p>
            <strong style={{ fontSize: 26 }}>{r.average}</strong> / 5 <span className="muted">({r.count} ta baho)</span>
          </p>
          <ul className="list">
            {r.items.map((i) => (
              <li key={i.studentId}>
                <span>
                  {i.name}
                  {i.comment && <span className="muted"> - {i.comment}</span>}
                </span>
                <span className="stars" aria-label={`${i.stars} yulduz`}>
                  {'★'.repeat(i.stars)}
                  <span className="stars-off">{'★'.repeat(5 - i.stars)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

export default function TeacherLessonPage() {
  const { id = '' } = useParams();
  const q = useGet<TeacherLessonDetail>(`/teacher/lessons/${id}`);
  const [reviewing, setReviewing] = useState<{ id: string; name: string } | null>(null);
  return (
    <Query q={q}>
      {(d) => (
        <>
          <PageHeader title={d.lesson.title} actions={d.lesson.isExam ? <Link to={`/teacher/exams/${d.lesson.id}`}>Imtihon natijalari</Link> : undefined} />
          <p className="muted">{fmtDateTime(d.lesson.startsAt)}</p>
          <div className="grid-2">
            <InfoForm d={d} />
            <HomeworkForm d={d} />
          </div>
          <Attendance d={d} />
          <Ratings d={d} />
          <Card title="Vazifalar">
            <Table head={["O'quvchi", 'Holat', 'Topshirilgan', 'Ball', '']}>
              {d.students.map((s) => (
                <tr key={s.studentId}>
                  <td>{s.name}</td>
                  <td>
                    <Badge>{HW_LABEL[s.homework.status]}</Badge> {s.homework.late && <Badge tone="danger">Kechikkan</Badge>}
                  </td>
                  <td>{fmtDateTime(s.homework.submittedAt)}</td>
                  <td>
                    {s.homework.ball === null
                      ? '-'
                      : s.homework.late && s.homework.rawBall !== null
                        ? `${s.homework.rawBall} - ${s.homework.rawBall - s.homework.ball} = ${s.homework.ball}`
                        : s.homework.ball}
                  </td>
                  <td>
                    {s.canReview && (
                      <Button variant="secondary" className="btn-sm" onClick={() => setReviewing({ id: s.studentId, name: s.name })}>
                        Ko'rish
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
          {reviewing && <ReviewPanel lessonId={d.lesson.id} studentId={reviewing.id} name={reviewing.name} onClose={() => setReviewing(null)} />}
        </>
      )}
    </Query>
  );
}
