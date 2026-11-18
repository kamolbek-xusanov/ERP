import { StudentPayments } from '../../api/types';
import { Badge, Card, Empty, PageHeader, Query, Stat, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDate, fmtMoney } from '../../utils/format';


export default function PaymentsPage() {
  const q = useGet<StudentPayments>('/student/payments');
  return (
    <>
      <PageHeader title="To'lovlarim" />
      <Query q={q}>
        {(d) => (
          <>
            <div className="grid">
              <Stat label="Jami to'langan" value={fmtMoney(d.total)} icon="wallet" tone="success" />
              <Stat label="To'lovlar soni" value={d.count} icon="receipt" tone="info" />
              <Stat label="Oxirgi to'lov" value={d.last ? fmtMoney(d.last.amount) : '-'} icon="money" tone="warning" hint={d.last ? fmtDate(d.last.date) : undefined} />
            </div>
            <Card title="Keyingi to'lovlar">
              {d.upcoming.length === 0 ? (
                <Empty>Keyingi to'lov yo'q.</Empty>
              ) : (
                <Table head={['Guruh', 'Sana', 'Qoldi', 'Summa']}>
                  {d.upcoming.map((u) => (
                    <tr key={u.groupId}>
                      <td>{u.groupName}</td>
                      <td>{fmtDate(`${u.dueDate}T00:00:00+05:00`)}</td>
                      <td>
                        <Badge tone={u.daysLeft < 0 ? 'danger' : u.daysLeft <= 5 ? 'warning' : 'neutral'}>
                          {u.daysLeft < 0 ? `${-u.daysLeft} kun kechikdi` : `${u.daysLeft} kun`}
                        </Badge>
                      </td>
                      <td>{fmtMoney(u.amount)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
            <Card title="To'lovlar tarixi">
              {d.items.length === 0 ? (
                <Empty>To'lov tarixi bo'sh.</Empty>
              ) : (
                <Table head={['Sana', 'Guruh', 'Izoh', 'Usul', 'Summa']}>
                  {d.items.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(`${p.date}T00:00:00+05:00`)}</td>
                      <td>{p.groupName}</td>
                      <td>{p.description}</td>
                      <td>{p.method}</td>
                      <td>{fmtMoney(p.amount)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </>
        )}
      </Query>
    </>
  );
}
