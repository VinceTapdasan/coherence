import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lt, sql } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { sessions } from '../db/schema';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStuckSessions() {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const stuck = await this.drizzle.db
      .update(sessions)
      .set({ status: 'failed', failureReason: 'job_timeout' })
      .where(
        and(
          eq(sessions.status, 'processing'),
          lt(sessions.processingStartedAt, threeMinutesAgo),
        ),
      )
      .returning({ id: sessions.id });

    if (stuck.length > 0) {
      this.logger.warn(`Marked ${stuck.length} stuck session(s) as failed`);
    }
  }
}
