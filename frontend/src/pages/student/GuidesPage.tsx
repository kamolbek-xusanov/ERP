import { Faq, Guide } from '../../api/types';
import { Card, PageHeader, Query } from '../../components/ui';
import { useGet } from '../../hooks/useApi';

export default function GuidesPage() {
  const guides = useGet<Guide[]>('/guides');
  const faqs = useGet<Faq[]>('/faqs');
  return (
    <>
      <PageHeader title="Qo'llanma" />
      <Query q={guides}>
        {(items) =>
          items.map((g) => (
            <Card key={g.id} title={g.title}>
              <p className="muted">
                {g.category} | {g.readMin} daqiqa
              </p>
              <p>{g.summary}</p>
              <details>
                <summary>To'liq o'qish</summary>
                <p>{g.body}</p>
              </details>
            </Card>
          ))
        }
      </Query>
      <Card title="Ko'p so'raladigan savollar">
        <Query q={faqs}>
          {(items) =>
            items.map((f) => (
              <details key={f.id}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))
          }
        </Query>
      </Card>
    </>
  );
}
