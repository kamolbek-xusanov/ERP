import { CareerVideo } from '../../api/types';
import { Card, Empty, PageHeader, Query } from '../../components/ui';
import { useGet } from '../../hooks/useApi';

export default function CareerPage() {
  const q = useGet<CareerVideo[]>('/career-videos');
  return (
    <>
      <PageHeader title="Karyera videolari" />
      <Query q={q}>
        {(items) =>
          items.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid-2">
              {items.map((v) => (
                <Card key={v.id} title={v.title}>
                  <p className="muted">
                    {v.topic} | {v.durationMin} daqiqa
                  </p>
                  <p>{v.description}</p>
                  <a href={v.url} target="_blank" rel="noreferrer">
                    Videoni ochish
                  </a>
                </Card>
              ))}
            </div>
          )
        }
      </Query>
    </>
  );
}
