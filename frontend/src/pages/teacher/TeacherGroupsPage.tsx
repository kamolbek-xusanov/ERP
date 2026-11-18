import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GroupCard, StudentStat } from '../../api/types';
import { Credential, downloadCsv } from '../../components/Credentials';
import { Badge, Button, Card, Empty, PageHeader, Query, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { scheduleText } from '../../utils/format';

function Students({ groupId }: { groupId: string }) {
  const q = useGet<StudentStat[]>(`/teacher/groups/${groupId}/students`);
  return (
    <Query q={q}>
      {(rows) => (
        <>
        <div className="toolbar" style={{ marginTop: 18 }}>
          <Button
            variant="secondary"
            className="btn-sm"
            onClick={() =>
              downloadCsv('oquvchilar.csv', [
                ['Ism', 'Login', 'Parol', 'Telefon'],
                ...rows.map((r) => [r.name, r.login, r.password ?? "o'zgartirgan", r.phone]),
              ])
            }
          >
            Login/parollarni yuklab olish (CSV)
          </Button>
        </div>
        <Table head={['O\'rin', 'Ism', 'Login', 'Parol', 'XP', 'Kumush', "O'rtacha ball", 'Qatnashgan', 'Berilgan vazifa', 'Baholangan', 'Kutilmoqda']}>
          {rows.map((r) => (
            <tr key={r.studentId}>
              <td>{r.rank}</td>
              <td>{r.name}</td>
              <td>
                <Credential value={r.login} />
              </td>
              <td>
                <Credential secret value={r.password} empty="O'zgartirgan" />
              </td>
              <td>{r.xp}</td>
              <td>{r.gems}</td>
              <td>{r.avgBall ?? '-'}</td>
              <td>
                {r.attended} / {r.held}
              </td>
              <td>{r.assigned}</td>
              <td>{r.done}</td>
              <td>{r.pending}</td>
            </tr>
          ))}
        </Table>
        </>
      )}
    </Query>
  );
}

export default function TeacherGroupsPage() {
  const q = useGet<GroupCard[]>('/teacher/groups');
  const [params] = useSearchParams();
  const [open, setOpen] = useState<string | null>(params.get('open'));
  useEffect(() => setOpen(params.get('open')), [params]);
  return (
    <>
      <PageHeader title="Guruhlarim" />
      <Query q={q}>
        {(groups) =>
          groups.length === 0 ? (
            <Empty>Sizga guruh biriktirilmagan.</Empty>
          ) : (
            groups.map((g) => (
              <Card key={g.id} title={g.name}>
                <dl className="dl">
                  <dt>Yo'nalish</dt>
                  <dd>{g.course}</dd>
                  <dt>Jadval</dt>
                  <dd>{scheduleText(g.schedule)}</dd>
                  <dt>O'quvchilar</dt>
                  <dd>{g.members}</dd>
                  <dt>Tekshirish</dt>
                  <dd>{g.waitingCount ? <Badge tone="warning">{g.waitingCount} ta kutmoqda</Badge> : '0'}</dd>
                </dl>
                <div className="toolbar" style={{ marginTop: 16 }}>
                  <Button variant="secondary" onClick={() => setOpen(open === g.id ? null : g.id)}>
                    {open === g.id ? "O'quvchilarni yopish" : "O'quvchilar statistikasi"}
                  </Button>
                  <Link className="btn btn-ghost" to={`/teacher/lessons?group=${g.id}`}>
                    Darslar
                  </Link>
                  <Link className="btn btn-ghost" to={`/teacher/journal?group=${g.id}`}>
                    Jurnal
                  </Link>
                </div>
                {open === g.id && <Students groupId={g.id} />}
              </Card>
            ))
          )
        }
      </Query>
    </>
  );
}
