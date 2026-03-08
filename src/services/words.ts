import { apiFetch } from './api';
import { getDailyWord, PRACTICE_WORDS } from '@/constants/words';
import type { Word } from '@/types';

export async function fetchDailyWord(): Promise<Word> {
  return getDailyWord();
  // return apiFetch<Word>('/words/daily');
}

export async function fetchPracticeWords(): Promise<Word[]> {
  return PRACTICE_WORDS;
  // return apiFetch<Word[]>('/words/practice');
}

void apiFetch; // keep import live for future use
