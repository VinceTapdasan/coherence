import { Injectable } from '@nestjs/common';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { sessions, users } from '../db/schema';

export interface CalendarEntry {
  date: string;
  sessionCount: number;
  hasSession: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

@Injectable()
export class CalendarService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMonthEntries(
    userId: string,
    year: number,
    month: number,
  ): Promise<CalendarEntry[]> {
    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { timezone: true },
    });

    const timezone = user?.timezone ?? 'UTC';

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const rows = await this.drizzle.db
      .select({
        date: sql<string>`DATE(${sessions.createdAt} AT TIME ZONE ${timezone})`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          gte(sessions.createdAt, startDate),
          lt(sessions.createdAt, endDate),
        ),
      )
      .groupBy(sql`DATE(${sessions.createdAt} AT TIME ZONE ${timezone})`);

    const daysInMonth = new Date(year, month, 0).getDate();
    const entries: CalendarEntry[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const row = rows.find((r) => r.date === dateStr);
      entries.push({
        date: dateStr,
        sessionCount: row?.count ?? 0,
        hasSession: (row?.count ?? 0) > 0,
      });
    }

    return entries;
  }

  async getStreak(userId: string): Promise<StreakInfo> {
    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { timezone: true },
    });

    const timezone = user?.timezone ?? 'UTC';

    const rows = await this.drizzle.db
      .selectDistinct({
        date: sql<string>`DATE(${sessions.createdAt} AT TIME ZONE ${timezone})`,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(
        sql`DATE(${sessions.createdAt} AT TIME ZONE ${timezone}) DESC`,
      );

    if (!rows.length) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = rows.map((r) => r.date).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Compute current streak
    const firstDate = dates[0];
    if (firstDate === today || firstDate === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff =
          (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Compute longest streak
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }
}
