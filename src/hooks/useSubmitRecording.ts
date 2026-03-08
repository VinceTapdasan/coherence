import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRecording } from '@/services/recordings';
import type { Recording } from '@/types';

interface SubmitRecordingInput {
  wordId: string;
  word: string;
  mode: 'daily' | 'practice';
  durationMs: number;
  audioUri?: string;
}

export function useSubmitRecording() {
  const queryClient = useQueryClient();

  return useMutation<Recording, Error, SubmitRecordingInput>({
    mutationFn: submitRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}
