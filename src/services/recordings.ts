import { apiFetch } from './api';
import type { Recording } from '@/types';

interface SubmitRecordingInput {
  wordId: string;
  word: string;
  mode: 'daily' | 'practice';
  durationMs: number;
  audioUri?: string;
}

export async function submitRecording(input: SubmitRecordingInput): Promise<Recording> {
  // Future: POST /recordings (multipart/form-data with audioUri)
  // return apiFetch<Recording>('/recordings', {
  //   method: 'POST',
  //   body: JSON.stringify(input),
  // });

  const recording: Recording = {
    id: Date.now().toString(),
    wordId: input.wordId,
    word: input.word,
    mode: input.mode,
    durationMs: input.durationMs,
    audioUri: input.audioUri,
    createdAt: new Date().toISOString(),
    status: 'processing',
  };
  return recording;
}

export async function fetchRecordings(): Promise<Recording[]> {
  // Future: GET /recordings
  // return apiFetch<Recording[]>('/recordings');
  return [];
}

void apiFetch; // keep import live for future use
