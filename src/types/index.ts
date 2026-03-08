export interface User {
  id: string;
  email?: string;
  phone?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Word {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  category: 'daily' | 'practice';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Recording {
  id: string;
  wordId: string;
  word: string;
  mode: 'daily' | 'practice';
  durationMs: number;
  audioUri?: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  resultId?: string;
}

export interface ResultFeedback {
  fillerWords: { count: number; examples: string[] };
  pace: { wpm: number; rating: 'slow' | 'good' | 'fast' };
  clarity: { score: number };
  improvements: string[];
  summary: string;
}

export interface Result {
  id: string;
  recordingId: string;
  word: string;
  feedback: ResultFeedback;
  createdAt: string;
}

export interface CalendarEntry {
  date: string;
  completed: boolean;
  sessionCount: number;
  recordingIds: string[];
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveDate: string;
}
