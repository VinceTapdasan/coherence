export class CreateSessionDto {
  wordId: string;
  mode: 'daily' | 'practice';
  durationMs: number;
}
