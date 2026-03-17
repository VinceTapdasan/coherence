import { useQuery } from '@tanstack/react-query';
import { fetchPracticeWords } from '@/services/words';

export function usePracticeWords() {
  return useQuery({
    queryKey: ['words', 'practice', 'v2'],
    queryFn: fetchPracticeWords,
    staleTime: Infinity,
  });
}
