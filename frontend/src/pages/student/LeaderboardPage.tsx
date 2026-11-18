import { LeaderRow } from '../../api/types';
import { GroupPicker } from '../../components/GroupPicker';
import { Card, PageHeader, Query, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';

function Board({ groupId }: { groupId: string }) {
  const q = useGet<LeaderRow[]>(`/student/groups/${groupId}/leaderboard`);
  return (
    <Query q={q}>
      {(rows) => (
        <Card>
          <Table head={['O\'rin', 'Ism', 'XP', "O'zgarish"]}>
            {rows.map((r) => (
              <tr key={r.studentId} className={r.isMe ? 'row-me' : ''}>
                <td>{r.rank}</td>
                <td>
                  {r.name} {r.isMe && <span className="muted">(siz)</span>}
                </td>
                <td>{r.xp}</td>
                <td className={r.delta > 0 ? 'cell-present' : r.delta < 0 ? 'cell-absent' : 'muted'}>
                  {r.delta > 0 ? `+${r.delta}` : r.delta}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </Query>
  );
}

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader title="Reyting" />
      <GroupPicker endpoint="/student/groups">{(id) => <Board groupId={id} />}</GroupPicker>
    </>
  );
}
