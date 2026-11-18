import { JournalData } from '../../api/types';
import { GroupPicker } from '../../components/GroupPicker';
import { Card, PageHeader, Query, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDate, EXAM_LABEL } from '../../utils/format';

const CELL = { present: '+', absent: '-', upcoming: '.' } as const;

function Journal({ groupId }: { groupId: string }) {
  const q = useGet<JournalData>(`/teacher/groups/${groupId}/journal`);
  return (
    <Query q={q}>
      {(d) => (
        <Card>
          <Table
            head={[
              "O'quvchi",
              ...d.columns.map((c) => (c.kind === 'exam' ? `${c.number}-imtihon` : `${c.title.slice(0, 14)}${c.saved ? ' (qulf)' : ''} ${fmtDate(c.startsAt)}`)),
              'Qatnashgan',
              'Foiz',
            ]}
          >
            {d.rows.map((r) => (
              <tr key={r.studentId}>
                <td>{r.name}</td>
                {d.columns.map((c) =>
                  c.kind === 'lesson' ? (
                    <td key={c.id} className={`cell-${r.cells[c.id]}`}>
                      {CELL[r.cells[c.id]]}
                    </td>
                  ) : (
                    <td key={`e${c.id}`}>
                      {r.examCells[c.id]?.ball !== undefined ? r.examCells[c.id].ball : EXAM_LABEL[r.examCells[c.id]?.state ?? 'blocked']}
                    </td>
                  ),
                )}
                <td>
                  {r.attended} / {r.held}
                </td>
                <td>{r.percent}%</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </Query>
  );
}

export default function TeacherJournalPage() {
  return (
    <>
      <PageHeader title="Jurnal" />
      <GroupPicker endpoint="/teacher/groups">{(id) => <Journal groupId={id} />}</GroupPicker>
    </>
  );
}
