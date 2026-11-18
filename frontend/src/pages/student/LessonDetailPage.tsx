import { FormEvent, useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, UploadedFile } from '../../api/client';
import { LessonDetail } from '../../api/types';
import { DownloadLink } from '../../components/DownloadLink';
import { FileUpload } from '../../components/FileUpload';
import { OPEN_RATING_EVENT, RatingGate, Stars } from '../../components/RatingGate';
import { VideoPlayer } from '../../components/VideoPlayer';
import { Badge, Button, Card, Field, FormError, PageHeader, Progress, Query, Textarea } from '../../components/ui';
import { useAction, useGet } from '../../hooks/useApi';
import { fmtDateTime, HW_LABEL } from '../../utils/format';

function HomeworkForm({ lessonId, rated }: { lessonId: string; rated: boolean }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const m = useAction(
    (v: { text: string; fileIds: string[] }) => api.post(`/student/lessons/${lessonId}/homework`, v),
    ['/student'],
    () => setFiles([]),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rated) {
      window.dispatchEvent(new Event(OPEN_RATING_EVENT));
      return;
    }
    const text = String(new FormData(e.currentTarget).get('text') ?? '');
    m.mutate({ text, fileIds: files.map((f) => f.id) });
  };
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Javob (2000 belgigacha)" name="text" error={m.error}>
        <Textarea name="text" maxLength={2000} />
      </Field>
      <Field label="Fayllar (3 tagacha, har biri 25 MB gacha)" name="fileIds" error={m.error}>
        <FileUpload purpose="answer" max={3} value={files} onChange={setFiles} />
      </Field>
      {!rated && (
        <div className="error-box" role="alert">
          Vazifani topshirish uchun avval darsni baholang.{' '}
          <button type="button" className="link" onClick={() => window.dispatchEvent(new Event(OPEN_RATING_EVENT))}>
            Baholash
          </button>
        </div>
      )}
      <FormError error={m.error} />
      <div className="form-actions">
        <Button type="submit" loading={m.isPending}>
          Topshirish
        </Button>
      </div>
    </form>
  );
}

export default function LessonDetailPage() {
  const { id = '' } = useParams();
  const q = useGet<LessonDetail>(`/student/lessons/${id}`);
  const progress = useAction((percent: number) => api.put(`/student/lessons/${id}/progress`, { percent }), [`/student/lessons/${id}`, '/student/groups']);
  const send = useCallback((p: number) => progress.mutate(p), [progress.mutate]);

  return (
    <Query q={q}>
      {(d) => {
        const hw = d.homework;
        const canSubmit = hw.status === 'not-done' || hw.status === 'returned';
        return (
          <>
            <PageHeader title={d.lesson.title} actions={d.lesson.isExam ? <Badge tone="warning">Imtihon</Badge> : undefined} />
            <p className="muted">
              {fmtDateTime(d.lesson.startsAt)} | {d.lesson.durationMin} daqiqa
            </p>
            {d.lesson.description && <p>{d.lesson.description}</p>}
            <Card title="Video">
              <VideoPlayer url={d.video.url} fileId={d.video.fileId} startPercent={d.progress} onProgress={send} />
              <p className="muted">Ko'rilgan: {d.progress}%</p>
              <Progress value={d.progress} />
            </Card>
            <div className="grid-2">
              <Card title="Mukofot">
                <dl className="dl">
                  <dt>Davomat</dt>
                  <dd>
                    {d.reward.attended ? `Qatnashdi (+${d.reward.attendanceXp} XP, +${d.reward.attendanceGems} kumush)` : 'Qatnashmagan'}
                  </dd>
                  <dt>Vazifa bali</dt>
                  <dd>
                    {d.reward.ball === null
                      ? '-'
                      : d.reward.late && d.reward.rawBall !== null
                        ? `${d.reward.rawBall} - ${d.reward.penalty} = ${d.reward.ball} (kechikkan)`
                        : d.reward.ball}
                  </dd>
                  <dt>Ball uchun</dt>
                  <dd>
                    +{d.reward.ballXp} XP, +{d.reward.ballGems} kumush
                  </dd>
                  {d.exam && (
                    <>
                      <dt>Imtihon bali</dt>
                      <dd>{d.exam.ball === null ? '-' : `${d.exam.ball} (+${d.exam.xp} XP, +${d.exam.gems} kumush)`}</dd>
                    </>
                  )}
                </dl>
              </Card>
              <RatingGate lessonId={id} assigned={hw.status !== 'not-assigned'} rated={!!d.rating} />
              <Card title="Uyga vazifa">
                <p>
                  <Badge>{HW_LABEL[hw.status]}</Badge>
                </p>
                {hw.status === 'not-assigned' ? (
                  <p className="muted">Bu darsga vazifa berilmagan.</p>
                ) : (
                  <>
                    <p>{hw.task}</p>
                    {hw.steps && (
                      <ol>
                        {hw.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    )}
                    {hw.attachments && hw.attachments.length > 0 && (
                      <ul className="file-list">
                        {hw.attachments.map((f) => (
                          <li key={f.id}>
                            <DownloadLink file={f} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {hw.dueAt && <p className="muted">Muddat: {fmtDateTime(hw.dueAt)}</p>}
                    {hw.feedback && hw.status === 'returned' && <div className="error-box">Ustoz izohi: {hw.feedback}</div>}
                    {hw.submission && (
                      <div>
                        <strong>Sizning javobingiz</strong> {hw.submission.late && <Badge tone="danger">Kechikkan</Badge>}
                        <p>{hw.submission.text}</p>
                        <ul className="file-list">
                          {hw.submission.files.map((f) => (
                            <li key={f.id}>
                              <DownloadLink file={f} />
                            </li>
                          ))}
                        </ul>
                        <p className="muted">{fmtDateTime(hw.submission.submittedAt)}</p>
                      </div>
                    )}
                    {d.rating && (
                      <p className="muted">
                        Siz darsni baholadingiz: <Stars value={d.rating.stars} size={20} />
                      </p>
                    )}
                    {canSubmit && <HomeworkForm lessonId={id} rated={!!d.rating} />}
                  </>
                )}
              </Card>
            </div>
            <Card title="Shu guruhning boshqa darslari">
              <ul className="list">
                {d.otherLessons.map((l) => (
                  <li key={l.id}>
                    <Link to={`/lessons/${l.id}`}>{l.title}</Link>
                    <span className="muted">{l.progress}%</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        );
      }}
    </Query>
  );
}
