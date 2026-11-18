import { useState } from 'react';
import { ReviewItem } from '../../api/types';
import { ReviewPanel } from '../../components/ReviewPanel';
import { Badge, Card, Empty, PageHeader, Query, Select } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDateTime } from '../../utils/format';

/** Uyga vazifalarni tekshirish bo'limi: chapda kutayotganlar, o'ngda tanlangan ish. */
export default function TeacherReviewPage() {
  const q = useGet<ReviewItem[]>('/teacher/review');
  const [group, setGroup] = useState('');
  const [picked, setPicked] = useState<ReviewItem | null>(null);
  return (
    <>
      <PageHeader title="Uyga vazifalarni tekshirish" subtitle="Topshirilgan ishlarni shu yerda ko'ring, baholang yoki qaytaring" />
      <Query q={q}>
        {(all) => {
          const groups = [...new Map(all.map((i) => [i.groupId, i.groupName])).entries()];
          const items = all.filter((i) => !group || i.groupId === group);
          return all.length === 0 ? (
            <Card>
              <Empty>Tekshiriladigan ish yo'q. Hammasi baholangan.</Empty>
            </Card>
          ) : (
            <div className="review-layout">
              <Card title={`Kutayotgan ishlar (${items.length})`}>
                <div className="toolbar">
                  <Select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Guruh">
                    <option value="">Hamma guruh</option>
                    {groups.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>
                <ul className="review-list">
                  {items.map((i) => {
                    const active = picked?.lessonId === i.lessonId && picked.studentId === i.studentId;
                    return (
                      <li key={`${i.lessonId}${i.studentId}`}>
                        <button type="button" className={`review-item ${active ? 'active' : ''}`} onClick={() => setPicked(i)}>
                          <strong>{i.studentName}</strong>
                          <span className="muted">
                            {i.groupName} · {i.lessonTitle}
                          </span>
                          <span className="muted">
                            {fmtDateTime(i.submittedAt)} {i.late && <Badge tone="danger">Kechikkan</Badge>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
              <div>
                {picked ? (
                  <ReviewPanel
                    key={`${picked.lessonId}${picked.studentId}`}
                    lessonId={picked.lessonId}
                    studentId={picked.studentId}
                    name={picked.studentName}
                    subtitle={`${picked.groupName} · ${picked.lessonTitle}`}
                    onClose={() => setPicked(null)}
                  />
                ) : (
                  <Card>
                    <Empty>Chapdan tekshiriladigan ishni tanlang.</Empty>
                  </Card>
                )}
              </div>
            </div>
          );
        }}
      </Query>
    </>
  );
}
