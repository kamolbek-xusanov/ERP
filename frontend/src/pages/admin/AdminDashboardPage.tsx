import { AdminDashboard } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Card, Empty, PageHeader, Query, Stat, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDate, fmtDateTime, fmtMoney, greeting } from '../../utils/format';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const q = useGet<AdminDashboard>('/admin/dashboard');
  return (
    <>
      <PageHeader title={greeting(user?.fullName)} subtitle="O'quv markazining bugungi holati" />
      <Query q={q}>
        {(d) => (
          <>
            <div className="grid">
              <Stat label="O'quvchilar" value={d.studentsCount} icon="student" tone="info" />
              <Stat label="Ustozlar" value={d.teachersCount} icon="teacher" tone="violet" />
              <Stat label="Guruhlar" value={d.groupsCount} icon="groups" tone="success" />
              <Stat label="Bugun bo'sh kataklar" value={d.freeSlotsToday} icon="door" tone="warning" />
            </div>
            <div className="grid-2">
              <Card title="Yaqin to'lovlar">
                {d.upcomingPayments.length === 0 ? (
                  <Empty>Yaqin to'lov yo'q.</Empty>
                ) : (
                  <Table head={['Guruh', 'Sana', 'Qoldi', 'Summa']}>
                    {d.upcomingPayments.map((p) => (
                      <tr key={p.groupId}>
                        <td>{p.groupName}</td>
                        <td>{fmtDate(`${p.dueDate}T00:00:00+05:00`)}</td>
                        <td>{p.daysLeft} kun</td>
                        <td>{fmtMoney(p.amount)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>
              <Card title="So'nggi eslatmalar">
                {d.lastNotices.length === 0 ? (
                  <Empty>Eslatma yuborilmagan.</Empty>
                ) : (
                  <Table head={['Guruh', 'Summa', 'Yuborilgan', 'Qabul qiluvchi']}>
                    {d.lastNotices.map((n) => (
                      <tr key={n.id}>
                        <td>{n.groupName}</td>
                        <td>{fmtMoney(n.amount)}</td>
                        <td>{fmtDateTime(n.sentAt)}</td>
                        <td>{n.recipients}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>
            </div>
          </>
        )}
      </Query>
    </>
  );
}
