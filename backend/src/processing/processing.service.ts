import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { results, sessions, transcriptions } from '../db/schema';

interface SonnetAnalysis {
  fillerWordCount: number;
  fillerWordExamples: string[];
  paceWpm: number;
  paceRating: 'slow' | 'good' | 'fast';
  clarityScore: number;
  improvements: string[];
  summary: string;
}

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private readonly openai: OpenAI;
  private readonly anthropic: Anthropic;

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async process(sessionId: string): Promise<void> {
    try {
      // 1. Fetch session + word
      const session = await this.drizzle.db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
        with: { word: true },
      });

      if (!session) {
        this.logger.error(`Session ${sessionId} not found`);
        return;
      }

      if (!session.audioUrl) {
        await this.markFailed(sessionId, 'missing_audio_url');
        return;
      }

      // 2. Download audio
      const audioResponse = await fetch(session.audioUrl);
      if (!audioResponse.ok) {
        await this.markFailed(sessionId, 'audio_download_failed');
        return;
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioFile = new File([audioBuffer], 'audio.webm', {
        type: 'audio/webm',
      });

      // 3. Transcribe via Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      const transcriptText = transcription.text;
      const wordCount = transcriptText.trim().split(/\s+/).filter(Boolean).length;

      // 4. Check minimum word count
      if (wordCount < 20) {
        await this.markFailed(sessionId, 'insufficient_speech');
        return;
      }

      // 5. Analyze with Claude Sonnet
      const durationSeconds = session.durationMs / 1000;
      const prompt = `You are a speech coach analyzing a spoken recording about the word "${session.word?.word}".

The speaker talked for approximately ${durationSeconds} seconds.

Here is the transcript:
---
${transcriptText}
---

Analyze the speech and return a JSON object with exactly these fields:
- fillerWordCount: number of filler words (um, uh, like, you know, basically, literally, right, etc.)
- fillerWordExamples: array of up to 5 example filler words found (as strings)
- paceWpm: estimated words per minute (calculate from ${wordCount} words over ${durationSeconds} seconds)
- paceRating: "slow" (< 100 wpm), "good" (100-160 wpm), or "fast" (> 160 wpm)
- clarityScore: 0-100 score for overall clarity and coherence
- improvements: array of 3-5 specific, actionable improvement suggestions
- summary: 2-3 sentence summary of the speech quality

Return only valid JSON, no markdown or extra text.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = message.content[0];
      if (rawContent.type !== 'text') {
        await this.markFailed(sessionId, 'invalid_sonnet_response');
        return;
      }

      let analysis: SonnetAnalysis;
      try {
        analysis = JSON.parse(rawContent.text) as SonnetAnalysis;
      } catch {
        await this.markFailed(sessionId, 'sonnet_parse_error');
        return;
      }

      // 6. Validate required fields
      if (
        typeof analysis.fillerWordCount !== 'number' ||
        !Array.isArray(analysis.fillerWordExamples) ||
        typeof analysis.paceWpm !== 'number' ||
        !['slow', 'good', 'fast'].includes(analysis.paceRating) ||
        typeof analysis.clarityScore !== 'number' ||
        !Array.isArray(analysis.improvements) ||
        typeof analysis.summary !== 'string'
      ) {
        await this.markFailed(sessionId, 'sonnet_validation_error');
        return;
      }

      // 7. Write transcription row
      await this.drizzle.db
        .insert(transcriptions)
        .values({
          sessionId,
          transcriptText,
          whisperModel: 'whisper-1',
          wordCount,
        })
        .returning();

      // 8. Mark previous results as not latest
      await this.drizzle.db
        .update(results)
        .set({ isLatest: false })
        .where(eq(results.sessionId, sessionId));

      // Write new result
      await this.drizzle.db
        .insert(results)
        .values({
          sessionId,
          userId: session.userId,
          fillerWordCount: analysis.fillerWordCount,
          fillerWordExamples: analysis.fillerWordExamples,
          paceWpm: analysis.paceWpm,
          paceRating: analysis.paceRating,
          clarityScore: Math.min(100, Math.max(0, analysis.clarityScore)),
          improvements: analysis.improvements,
          summary: analysis.summary,
          rawSonnetResponse: message as unknown as Record<string, unknown>,
          isLatest: true,
          quality: 'good',
        })
        .returning();

      // 9. Update session to complete
      await this.drizzle.db
        .update(sessions)
        .set({ status: 'complete' })
        .where(eq(sessions.id, sessionId));

      this.logger.log(`Session ${sessionId} processed successfully`);
    } catch (err) {
      this.logger.error(`Processing failed for session ${sessionId}`, err);
      await this.markFailed(
        sessionId,
        err instanceof Error ? err.message.slice(0, 255) : 'unknown_error',
      );
    }
  }

  private async markFailed(sessionId: string, reason: string): Promise<void> {
    try {
      await this.drizzle.db
        .update(sessions)
        .set({ status: 'failed', failureReason: reason })
        .where(eq(sessions.id, sessionId));
    } catch (err) {
      this.logger.error(`Failed to mark session ${sessionId} as failed`, err);
    }
  }
}
