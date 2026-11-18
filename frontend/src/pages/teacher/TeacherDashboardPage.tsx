import { Link } from 'react-router-dom';
import { TeacherDashboard } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Card, Empty, PageHeader, Query, Stat } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { DAY_LABEL, fmtDate, greeting } from '../../utils/format';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const q = useGet<TeacherDashboard>('/teacher/dashboard');
  return (
    <>
      <PageHeader title={greeting(user?.fullName)} subtitle="Guruhlaringiz va tekshirilishi kerak bo'lgan ishlar" />
      <Query q={q}>
        {(d) => (
          <>
            <div className="grid">
              <Stat label="Guruhlar" value={d.stats.groups} icon="groups" tone="info" />
              <Stat label="O'quvchilar" value={d.stats.students} icon="student" tone="success" />
              <Stat label="O'tilgan darslar" value={d.stats.lessonsHeld} icon="lessons" tone="violet" />
              <Stat label="Tekshirishni kutayotgan" value={d.waitingReview} icon="review" tone="warning" hint={<Link to="/teacher/review">Ko'rish</Link>} />
            </div>
            <div className="grid-2">
              <Card title="Guruhlarim">
                {d.groups.length === 0 && <Empty>Guruh biriktirilmagan.</Empty>}
                <ul className="list">
                  {d.groups.map((g) => (
                    <li key={g.id}>
                      <Link to={`/teacher/lessons?group=${g.id}`}>{g.name}</Link>
                      <span className="muted">{g.members} o'quvchi</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Yaqin darslar">
                {d.upcomingLessons.length === 0 && <Empty>Yaqin dars yo'q.</Empty>}
                <ul className="list">
                  {d.upcomingLessons.map((s) => (
                    <li key={`${s.groupId}${s.date}${s.start}`}>
                      <span>{s.groupName}</span>
                      <span className="muted">
                        {DAY_LABEL[s.day]}, {fmtDate(`${s.date}T00:00:00+05:00`)} {s.start}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </Query>
    </>
  );
}
