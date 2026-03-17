import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { ProcessingService } from '../processing/processing.service';
import { sessions } from '../db/schema';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  private readonly bucket: string;

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => ProcessingService))
    private readonly processingService: ProcessingService,
  ) {
    this.bucket = this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
  }

  async createWithPresign(userId: string, dto: CreateSessionDto) {
    if (dto.durationMs < 15000) {
      throw new BadRequestException('Duration must be at least 15 seconds');
    }

    const [session] = await this.drizzle.db
      .insert(sessions)
      .values({
        userId,
        wordId: dto.wordId,
        mode: dto.mode,
        durationMs: dto.durationMs,
        status: 'pending',
      })
      .returning();

    const audioKey = `audio/${userId}/${session.id}.webm`;

    // Build a presigned upload URL via Supabase Storage REST
    // We return the key and session so the client can upload directly
    const uploadUrl = `${this.config.getOrThrow<string>('SUPABASE_URL')}/storage/v1/object/${this.bucket}/${audioKey}`;

    return {
      sessionId: session.id,
      uploadUrl,
      audioKey,
    };
  }

  async confirm(sessionId: string, userId: string, audioUrl: string) {
    const session = await this.drizzle.db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new UnauthorizedException('Not your session');
    }

    const [updated] = await this.drizzle.db
      .update(sessions)
      .set({
        audioUrl,
        status: 'processing',
        processingStartedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    // Trigger async processing
    setImmediate(() => {
      void this.processingService.process(sessionId);
    });

    return updated;
  }

  async findByUser(userId: string) {
    return this.drizzle.db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }
}
