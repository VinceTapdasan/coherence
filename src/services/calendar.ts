import { apiFetch } from './api';
import type { CalendarEntry, Streak } from '@/types';

export async function fetchCalendarEntries(year: number, month: number): Promise<CalendarEntry[]> {
  // Future: GET /calendar?year=&month=
  // return apiFetch<CalendarEntry[]>(`/calendar?year=${year}&month=${month}`);

  const monthStr = String(month + 1).padStart(2, '0');
  const entries: CalendarEntry[] = [
    {
      date: `${year}-${monthStr}-01`,
      completed: true,
      sessionCount: 1,
      recordingIds: ['rec-001'],
    },
    {
      date: `${year}-${monthStr}-02`,
      completed: true,
      sessionCount: 1,
      recordingIds: ['rec-002'],
    },
    {
      date: `${year}-${monthStr}-03`,
      completed: true,
      sessionCount: 2,
      recordingIds: ['rec-003', 'rec-004'],
    },
  ];

  // only return mock data for 2026-03 to match the seeded dates
  if (year === 2026 && month === 2) {
    return entries;
  }
  return [];
}

export async function fetchStreak(): Promise<Streak> {
  // Future: GET /streak
  // return apiFetch<Streak>('/streak');

  return {
    current: 3,
    longest: 7,
    lastActiveDate: '2026-03-03',
  };
}

void apiFetch; // keep import live for future use
