import { apiFetch } from './api';
import type { Result } from '@/types';

const MOCK_RESULT: Result = {
  id: 'mock-result-001',
  recordingId: '',
  word: 'Wisdom',
  feedback: {
    fillerWords: {
      count: 2,
      examples: ['um', 'like'],
    },
    pace: {
      wpm: 128,
      rating: 'good',
    },
    clarity: {
      score: 74,
    },
    improvements: [
      'Take 10 to 15 seconds to outline your main points before speaking to avoid going blank mid-sentence.',
      'Practice utilizing silent pauses instead of verbalizing frustrations when you lose your train of thought, as this helps maintain a more professional flow.',
    ],
    summary:
      'The speaker attempts to define the topic but quickly encounters a mental block, leading to a loss of coherence. While the delivery is natural and thoughtful, the message lacks clarity because the primary thought is never completed.',
  },
  createdAt: new Date().toISOString(),
};

export async function fetchResult(recordingId: string): Promise<Result> {
  // Future: GET /results/:recordingId
  // return apiFetch<Result>(`/results/${recordingId}`);

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { ...MOCK_RESULT, recordingId };
}

export async function fetchRecentResults(): Promise<Result[]> {
  // Future: GET /results?limit=10
  // return apiFetch<Result[]>('/results?limit=10');
  return [];
}

void apiFetch; // keep import live for future use
