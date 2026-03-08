import { useQuery } from '@tanstack/react-query';
import { fetchCalendarEntries, fetchStreak } from '@/services/calendar';
import type { CalendarEntry, Streak } from '@/types';

const MS_5MIN = 1000 * 60 * 5;

export function useCalendar(year: number, month: number) {
  return useQuery<CalendarEntry[], Error>({
    queryKey: ['calendar', year, month],
    queryFn: () => fetchCalendarEntries(year, month),
    staleTime: MS_5MIN,
  });
}

export function useStreak() {
  return useQuery<Streak, Error>({
    queryKey: ['streak'],
    queryFn: fetchStreak,
    staleTime: MS_5MIN,
  });
}
