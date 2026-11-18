import { useState } from 'react';
import { AuditItem } from '../../api/types';
import { Badge, Card, Empty, PageHeader, Pager, Query, Table } from '../../components/ui';
import { useGet } from '../../hooks/useApi';
import { fmtDateTime } from '../../utils/format';

const ACTIONS: Record<string, string> = {
  'student.created': "O'quvchi qo'shildi",
  'student.enrolled': "O'quvchi guruhga qo'shildi",
  'student.removed_from_group': "O'quvchi guruhdan chiqarildi",
  'teacher.created': "Ustoz qo'shildi",
  'account.updated': "Ma'lumotlar o'zgartirildi",
  'user.activated': 'Foydalanuvchi faollashtirildi',
  'user.deactivated': 'Foydalanuvchi bloklandi',
  'group.created': 'Guruh yaratildi',
  'payment.recorded': "To'lov yozildi",
  'payment_notice.sent': "To'lov eslatmasi yuborildi",
};

const META_LABEL: Record<string, string> = { login: 'Login', name: 'Nom', groupIds: 'Guruhlar', groupId: 'Guruh', loginChanged: 'Login almashdi', passwordChanged: 'Parol almashdi', nameChanged: 'Ism almashdi', phoneChanged: 'Telefon almashdi', amount: 'Summa' };

function metaText(meta: AuditItem['meta']) {
  if (!meta) return '';
  return Object.entries(meta)
    .map(([k, v]) => {
      const label = META_LABEL[k] ?? k;
      if (Array.isArray(v)) return `${label}: ${v.length} ta`;
      if (typeof v === 'boolean') return v ? label : '';
      if (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)) return '';
      return `${label}: ${String(v)}`;
    })
    .filter(Boolean)
    .join(' | ');
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const q = useGet<AuditItem[]>(`/admin/audit-logs?page=${page}&limit=30`);
  return (
    <>
      <PageHeader title="Harakatlar jurnali" subtitle="Admin panelda bajarilgan barcha o'zgarishlar" />
      <Card>
        <Query q={q}>
          {(items) =>
            items.length === 0 ? (
              <Empty>Hozircha harakat yo'q.</Empty>
            ) : (
              <>
                <Table head={['Vaqt', 'Kim', 'Harakat', 'Kimga / nimaga', "Ma'lumot"]}>
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td className="nowrap">{fmtDateTime(a.createdAt)}</td>
                      <td>{a.actorName ?? <span className="muted">Tizim</span>}</td>
                      <td>
                        <Badge tone="info">{ACTIONS[a.action] ?? a.action}</Badge>
                      </td>
                      <td>{a.targetName ?? <span className="muted">{a.target ? `${a.target.slice(0, 8)}…` : '-'}</span>}</td>
                      <td className="muted">{metaText(a.meta)}</td>
                    </tr>
                  ))}
                </Table>
                <Pager page={page} onPage={setPage} hasNext={items.length >= 30} />
              </>
            )
          }
        </Query>
      </Card>
    </>
  );
}
