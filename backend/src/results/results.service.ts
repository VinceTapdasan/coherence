import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { results } from '../db/schema';

@Injectable()
export class ResultsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findBySession(sessionId: string, userId: string) {
    const result = await this.drizzle.db.query.results.findFirst({
      where: and(eq(results.sessionId, sessionId), eq(results.isLatest, true)),
    });

    if (!result) {
      throw new NotFoundException('Result not found or still processing');
    }

    if (result.userId !== userId) {
      throw new UnauthorizedException('Not your result');
    }

    return result;
  }

  async findRecent(userId: string, limit = 10) {
    return this.drizzle.db.query.results.findMany({
      where: and(eq(results.userId, userId), eq(results.isLatest, true)),
      orderBy: [desc(results.createdAt)],
      limit,
    });
  }
}
