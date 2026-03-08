import { useQuery } from '@tanstack/react-query';
import { fetchDailyWord } from '@/services/words';

const MS_24H = 1000 * 60 * 60 * 24;

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useDailyWord() {
  return useQuery({
    queryKey: ['word', 'daily', getTodayDateString()],
    queryFn: fetchDailyWord,
    staleTime: MS_24H,
  });
}
