import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';

export function useGet<T>(path: string | null, options: { refetchInterval?: number; enabled?: boolean } = {}) {
  return useQuery<T, ApiError>({
    queryKey: [path],
    queryFn: () => api.get<T>(path as string),
    enabled: !!path && options.enabled !== false,
    refetchInterval: options.refetchInterval,
  });
}

export function useAction<V, R = unknown>(
  fn: (value: V) => Promise<R>,
  invalidate: string[] = [],
  onSuccess?: (result: R, value: V) => void,
) {
  const qc = useQueryClient();
  return useMutation<R, ApiError, V>({
    mutationFn: fn,
    onSuccess: (result, value) => {
      invalidate.forEach((prefix) =>
        qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0] ?? '').startsWith(prefix) }),
      );
      onSuccess?.(result, value);
    },
  });
}
