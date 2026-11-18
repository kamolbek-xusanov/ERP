import { Link } from 'react-router-dom';
import { GroupCard } from '../../api/types';
import { Card, Empty, PageHeader, Query } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { DAY_LABEL, fmtDate, scheduleText } from '../../utils/format';

export default function GroupsPage() {
  const q = useGet<GroupCard[]>('/student/groups');
  return (
    <>
      <PageHeader title="Guruhlarim" />
      <Query q={q}>
        {(groups) =>
          groups.length === 0 ? (
            <Empty>Siz hali guruhga qo'shilmagansiz.</Empty>
          ) : (
            <div className="grid-2">
              {groups.map((g) => (
                <Card key={g.id} title={g.name}>
                  <dl className="dl">
                    <dt>Yo'nalish</dt>
                    <dd>{g.course}</dd>
                    <dt>Ustoz</dt>
                    <dd>{g.teacher.fullName}</dd>
                    <dt>O'quvchilar</dt>
                    <dd>{g.members}</dd>
                    <dt>Jadval</dt>
                    <dd>{scheduleText(g.schedule)}</dd>
                    <dt>Keyingi dars</dt>
                    <dd>
                      {g.nextSession
                        ? `${DAY_LABEL[g.nextSession.day]}, ${fmtDate(`${g.nextSession.date}T00:00:00+05:00`)} ${g.nextSession.start}`
                        : '-'}
                    </dd>
                  </dl>
                  <p>
                    <Link to={`/lessons?group=${g.id}`}>Darslar</Link> | <Link to={`/leaderboard?group=${g.id}`}>Reyting</Link>
                  </p>
                </Card>
              ))}
            </div>
          )
        }
      </Query>
    </>
  );
}
