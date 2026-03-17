import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const wordCategoryEnum = pgEnum('word_category', ['daily', 'practice']);
export const wordDifficultyEnum = pgEnum('word_difficulty', [
  'beginner',
  'intermediate',
  'advanced',
]);
export const sessionModeEnum = pgEnum('session_mode', ['daily', 'practice']);
export const sessionStatusEnum = pgEnum('session_status', [
  'pending',
  'processing',
  'complete',
  'failed',
]);
export const paceRatingEnum = pgEnum('pace_rating', ['slow', 'good', 'fast']);
export const resultQualityEnum = pgEnum('result_quality', ['good', 'degraded']);

// users
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 255 }),
  timezone: varchar('timezone', { length: 100 }).default('UTC').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// refresh_tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 512 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// words
export const words = pgTable('words', {
  id: uuid('id').primaryKey().defaultRandom(),
  word: varchar('word', { length: 255 }).unique().notNull(),
  definition: text('definition').notNull(),
  exampleSentence: text('example_sentence').notNull(),
  category: wordCategoryEnum('category').notNull(),
  difficulty: wordDifficultyEnum('difficulty').default('intermediate'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// daily_schedule
export const dailySchedule = pgTable('daily_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  wordId: uuid('word_id')
    .notNull()
    .references(() => words.id),
  assignedDate: date('assigned_date').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  wordId: uuid('word_id')
    .notNull()
    .references(() => words.id),
  mode: sessionModeEnum('mode').notNull(),
  audioUrl: text('audio_url'),
  durationMs: integer('duration_ms').notNull(),
  status: sessionStatusEnum('status').default('pending').notNull(),
  processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
  failureReason: varchar('failure_reason', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// transcriptions
export const transcriptions = pgTable('transcriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  transcriptText: text('transcript_text').notNull(),
  whisperModel: varchar('whisper_model', { length: 100 })
    .default('whisper-1')
    .notNull(),
  confidenceScore: integer('confidence_score'),
  wordCount: integer('word_count').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// results
export const results = pgTable('results', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fillerWordCount: integer('filler_word_count').notNull(),
  fillerWordExamples: jsonb('filler_word_examples')
    .$type<string[]>()
    .notNull(),
  paceWpm: integer('pace_wpm').notNull(),
  paceRating: paceRatingEnum('pace_rating').notNull(),
  clarityScore: integer('clarity_score').notNull(),
  improvements: jsonb('improvements').$type<string[]>().notNull(),
  summary: text('summary').notNull(),
  rawSonnetResponse: jsonb('raw_sonnet_response'),
  isLatest: boolean('is_latest').default(true).notNull(),
  quality: resultQualityEnum('quality').default('good').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// user_word_history
export const userWordHistory = pgTable(
  'user_word_history',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id')
      .notNull()
      .references(() => words.id),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    timesPracticed: integer('times_practiced').default(1).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.wordId] })],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  results: many(results),
  refreshTokens: many(refreshTokens),
  wordHistory: many(userWordHistory),
}));

export const wordsRelations = relations(words, ({ many }) => ({
  sessions: many(sessions),
  schedule: many(dailySchedule),
  userHistory: many(userWordHistory),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  word: one(words, { fields: [sessions.wordId], references: [words.id] }),
  transcription: one(transcriptions, {
    fields: [sessions.id],
    references: [transcriptions.sessionId],
  }),
  result: one(results, {
    fields: [sessions.id],
    references: [results.sessionId],
  }),
}));

export const transcriptionsRelations = relations(transcriptions, ({ one }) => ({
  session: one(sessions, {
    fields: [transcriptions.sessionId],
    references: [sessions.id],
  }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  session: one(sessions, {
    fields: [results.sessionId],
    references: [sessions.id],
  }),
  user: one(users, { fields: [results.userId], references: [users.id] }),
}));

export const userWordHistoryRelations = relations(
  userWordHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [userWordHistory.userId],
      references: [users.id],
    }),
    word: one(words, {
      fields: [userWordHistory.wordId],
      references: [words.id],
    }),
  }),
);
