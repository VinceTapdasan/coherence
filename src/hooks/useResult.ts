import { useQuery } from '@tanstack/react-query';
import { fetchResult } from '@/services/results';
import type { Result } from '@/types';

export function useResult(recordingId: string | undefined) {
  return useQuery<Result, Error>({
    queryKey: ['result', recordingId],
    queryFn: () => fetchResult(recordingId!),
    enabled: !!recordingId,
    retry: 3,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      return data.feedback ? false : 3000;
    },
  });
}
