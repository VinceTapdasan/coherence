import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { dailySchedule, userWordHistory, words } from '../db/schema';

@Injectable()
export class WordsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getDailyWord(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    // Check daily_schedule first
    const scheduled = await this.drizzle.db.query.dailySchedule.findFirst({
      where: eq(dailySchedule.assignedDate, today),
      with: { word: true },
    });

    if (scheduled) {
      return scheduled.word;
    }

    // Fallback: select word by day-of-year algorithm
    const allWords = await this.drizzle.db.query.words.findMany({
      where: and(
        eq(words.category, 'daily'),
        eq(words.isActive, true),
      ),
    });

    if (!allWords.length) {
      throw new NotFoundException('No daily words available');
    }

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000,
    );

    return allWords[dayOfYear % allWords.length];
  }

  async getPracticeWords(userId: string, limit = 10) {
    // Get words the user has seen before
    const seenHistory = await this.drizzle.db.query.userWordHistory.findMany({
      where: eq(userWordHistory.userId, userId),
      columns: { wordId: true, lastSeenAt: true },
    });

    const seenWordIds = seenHistory.map((h) => h.wordId);

    // Get active practice words
    const conditions = [
      eq(words.category, 'practice'),
      eq(words.isActive, true),
    ];

    const practiceWords = await this.drizzle.db.query.words.findMany({
      where: and(...conditions),
    });

    if (!practiceWords.length) {
      return [];
    }

    // Sort: unseen words first, then by last_seen_at ASC
    const unseenWords = practiceWords.filter(
      (w) => !seenWordIds.includes(w.id),
    );
    const seenWords = practiceWords
      .filter((w) => seenWordIds.includes(w.id))
      .sort((a, b) => {
        const aHistory = seenHistory.find((h) => h.wordId === a.id);
        const bHistory = seenHistory.find((h) => h.wordId === b.id);
        if (!aHistory || !bHistory) return 0;
        return (
          new Date(aHistory.lastSeenAt).getTime() -
          new Date(bHistory.lastSeenAt).getTime()
        );
      });

    return [...unseenWords, ...seenWords].slice(0, limit);
  }
}
