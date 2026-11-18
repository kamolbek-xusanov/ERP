import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Empty, Loader, Select } from './ui';
import { useGet } from '../hooks/useApi';

interface Option {
  id: string;
  name: string;
}

export function useGroupParam(options: Option[] | undefined) {
  const [params, setParams] = useSearchParams();
  const current = params.get('group');
  const valid = options?.some((o) => o.id === current);
  useEffect(() => {
    if (options?.length && !valid) {
      const next = new URLSearchParams(params);
      next.set('group', options[0].id);
      setParams(next, { replace: true });
    }
  }, [options, valid, params, setParams]);
  const set = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('group', id);
    setParams(next, { replace: true });
  };
  return { groupId: valid ? current : options?.[0]?.id ?? null, setGroup: set };
}

export function GroupPicker({ endpoint, children }: { endpoint: string; children: (groupId: string) => React.ReactNode }) {
  const groups = useGet<Option[]>(endpoint);
  const { groupId, setGroup } = useGroupParam(groups.data);
  if (groups.isLoading) return <Loader />;
  if (!groups.data?.length || !groupId) return <Empty>Guruh topilmadi.</Empty>;
  return (
    <>
      <div className="toolbar">
        <Select value={groupId} onChange={(e) => setGroup(e.target.value)}>
          {groups.data.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      {children(groupId)}
    </>
  );
}
