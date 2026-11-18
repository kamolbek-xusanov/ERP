import { Link } from 'react-router-dom';
import { Dashboard } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Card, Empty, PageHeader, Progress, Query, Stat } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDate, fmtDateTime, greeting } from '../../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const q = useGet<Dashboard>('/student/dashboard');
  return (
    <>
      <PageHeader title={greeting(user?.fullName)} subtitle="Bugungi o'qish holatingiz va natijalaringiz" />
      <Query q={q}>
        {(d) => (
          <>
            <div className="grid">
              <Stat label="XP" value={d.xp} icon="star" tone="warning" />
              <Stat label="Kumush" value={d.gems} icon="gem" tone="info" />
              <Stat label="Bosqich" value={d.level} icon="trophy" tone="violet" hint={`Keyingisigacha ${d.levelRemaining} XP`} />
              <Stat label="Kunlik seriya" value={`${d.streak} kun`} icon="flame" tone="danger" />
              <Stat label="Umumiy o'rin" value={`${d.overallRank} / ${d.totalStudents}`} icon="chart" tone="success" />
            </div>
            <Card title="Bosqich progressi">
              <Progress value={d.levelPercent} />
              <p className="muted" style={{ margin: 0 }}>
                {d.xp - d.levelFrom} / {d.levelTo - d.levelFrom} XP ({d.levelPercent}%)
              </p>
            </Card>
            <div className="grid-2">
              <Card title="Guruhlardagi o'rin">
                {d.groupRanks.length === 0 && <Empty>Guruh yo'q.</Empty>}
                <ul className="list">
                  {d.groupRanks.map((g) => (
                    <li key={g.groupId}>
                      <Link to={`/leaderboard?group=${g.groupId}`}>{g.groupName}</Link>
                      <span>
                        {g.rank} / {g.size}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Yaqin hodisalar">
                {d.upcoming.length === 0 && <Empty>Yaqin hodisa yo'q.</Empty>}
                <ul className="list">
                  {d.upcoming.map((e) => (
                    <li key={e.id}>
                      <span>{e.title}</span>
                      <span className="muted">
                        {fmtDate(`${e.date}T00:00:00+05:00`)} {e.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <Card title="So'nggi faoliyat">
              {d.activities.length === 0 && <Empty>Faoliyat yo'q.</Empty>}
              <ul className="list">
                {d.activities.map((a) => (
                  <li key={a.id}>
                    <span>{a.text}</span>
                    <span className="muted">
                      {a.xp ? `+${a.xp} XP ` : ''}
                      {fmtDateTime(a.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </Query>
    </>
  );
}
