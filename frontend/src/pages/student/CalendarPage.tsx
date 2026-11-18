import { useState } from 'react';
import { CalendarEvent } from '../../api/types';
import { Badge, Card, Empty, Input, PageHeader, Query } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';

const LABEL: Record<string, string> = { lesson: 'Dars', exam: 'Imtihon', deadline: 'Muddat', interview: 'Suhbat' };
const TONE: Record<string, 'neutral' | 'warning' | 'danger' | 'info'> = { lesson: 'info', exam: 'warning', deadline: 'danger', interview: 'neutral' };

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const q = useGet<CalendarEvent[]>(`/student/calendar?month=${month}`);
  return (
    <>
      <PageHeader title="Kalendar" actions={<Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />} />
      <Query q={q}>
        {(events) => {
          if (!events.length) return <Empty>Bu oyda hodisa yo'q.</Empty>;
          const byDate = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
            (acc[e.date] ??= []).push(e);
            return acc;
          }, {});
          return Object.entries(byDate).map(([date, list]) => (
            <Card key={date} title={fmtDate(`${date}T00:00:00+05:00`)}>
              <ul className="list">
                {list.map((e) => (
                  <li key={e.id}>
                    <span>
                      <Badge tone={TONE[e.type]}>{LABEL[e.type]}</Badge> {e.title}
                    </span>
                    <span className="muted">{e.time}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ));
        }}
      </Query>
    </>
  );
}
