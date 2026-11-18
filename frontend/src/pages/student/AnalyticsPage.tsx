import { Analytics } from '../../api/types';
import { Card, PageHeader, Progress, Query, Stat, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { DAY_LABEL, fmtDate } from '../../utils/format';

export default function AnalyticsPage() {
  const q = useGet<Analytics>('/student/analytics');
  return (
    <>
      <PageHeader title="Tahlil" subtitle="O'qish jarayoningiz statistikasi" />
      <Query q={q}>
        {(d) => (
          <>
            <div className="grid">
              <Stat label="Tugatilgan darslar" value={`${d.completionRate}%`} icon="review" tone="success" />
              <Stat label="Jami soat" value={d.totalHours} icon="clock" tone="info" />
              <Stat label="Tugatilgan darslar soni" value={d.lessonsCompleted} icon="lessons" tone="violet" />
              <Stat label="O'rtacha ball" value={d.avgScore ?? '-'} icon="star" tone="warning" />
            </div>
            <div className="grid-2">
              <Card title="Shu hafta o'qish soatlari">
                <Table head={['Kun', 'Soat']}>
                  {d.weeklyHours.map((w) => (
                    <tr key={w.day}>
                      <td>{DAY_LABEL[w.day] ?? w.day}</td>
                      <td>{w.hours}</td>
                    </tr>
                  ))}
                </Table>
              </Card>
              <Card title="Haftalik XP">
                <Table head={['Hafta', 'XP']}>
                  {d.xpByWeek.map((w) => (
                    <tr key={w.week}>
                      <td>{fmtDate(`${w.week}T00:00:00+05:00`)}</td>
                      <td>{w.xp}</td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </div>
            <Card title="Yo'nalishlar bo'yicha progress">
              {d.skills.map((s) => (
                <div key={s.name}>
                  <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 0 }}>
                    <span>{s.name}</span>
                    <span className="muted">{s.percent}%</span>
                  </div>
                  <Progress value={s.percent} />
                </div>
              ))}
            </Card>
          </>
        )}
      </Query>
    </>
  );
}
