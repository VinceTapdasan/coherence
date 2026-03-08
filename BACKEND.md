# Coherence Backend Architecture

## 1. Overview

The backend serves the Coherence mobile app — a daily speech coaching tool. It needs to handle:

- **Auth**: JWT-based user authentication with refresh token rotation, stored securely on device.
- **Word serving**: Daily and practice word content (can be seeded or managed via admin).
- **Audio upload**: Accept audio recordings from the mobile client, store them in object storage.
- **AI feedback generation**: Transcribe audio via Whisper, then analyze with GPT-4 to produce structured feedback (filler words, pace, clarity, improvement suggestions).
- **User data**: Persist recordings, results, and calendar/streak data per user.
- **Polling support**: The frontend polls `GET /results/:recordingId` until the result is ready. The backend processes feedback asynchronously via a job queue.

---

## 2. Tech Stack Recommendation

| Layer | Choice | Reason |
|---|---|---|
| Framework | NestJS (TypeScript) | Modular, decorator-based, built-in DI and validation |
| Database | PostgreSQL | Relational, strong typing, great for structured feedback data |
| ORM | Drizzle ORM | Lightweight, type-safe, migrations-first |
| Object Storage | S3-compatible (AWS S3 or Cloudflare R2) | Audio file storage with presigned URL support |
| Job Queue | BullMQ + Redis | Reliable async processing for AI pipeline |
| Transcription | OpenAI Whisper API | Best-in-class accuracy, direct audio file input |
| Feedback | OpenAI GPT-4o | Structured JSON output via `response_format: { type: 'json_object' }` |
| Auth | JWT (access + refresh) + bcrypt | Standard, stateless, secure |

---

## 3. API Endpoints

### Auth

| Method | Path | Request Body | Response Body |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` | `{ success: true }` |

### Words

| Method | Path | Request Body | Response Body |
|---|---|---|---|
| GET | `/words/daily` | — | `Word` |
| GET | `/words/practice` | — | `Word[]` |

### Recordings

| Method | Path | Request Body | Response Body |
|---|---|---|---|
| POST | `/recordings/presign` | `{ filename, contentType, wordId, mode }` | `{ uploadUrl, recordingId }` |
| POST | `/recordings` | `{ recordingId, wordId, word, mode, durationMs }` | `Recording` |
| GET | `/recordings` | — | `Recording[]` |
| GET | `/recordings/:id` | — | `Recording` |

Upload flow: client calls `/recordings/presign` to get a presigned URL, uploads directly to S3, then calls `POST /recordings` to register the recording and trigger the AI pipeline.

### Results

| Method | Path | Request Body | Response Body |
|---|---|---|---|
| GET | `/results/:recordingId` | — | `Result` or `{ status: 'processing' }` |
| GET | `/results` | query: `?limit=10` | `Result[]` |

### Calendar

| Method | Path | Request Body | Response Body |
|---|---|---|---|
| GET | `/calendar` | query: `?year=&month=` | `CalendarEntry[]` |
| GET | `/streak` | — | `Streak` |

---

## 4. Data Models (PostgreSQL / Drizzle)

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- refresh_tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- words
CREATE TABLE words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  example_sentence TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('daily', 'practice')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- recordings
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT REFERENCES words(id),
  word TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'practice')),
  duration_ms INTEGER NOT NULL,
  audio_uri TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  result_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- results
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  filler_count INTEGER NOT NULL DEFAULT 0,
  filler_examples JSONB NOT NULL DEFAULT '[]',
  pace_wpm INTEGER NOT NULL DEFAULT 0,
  pace_rating TEXT NOT NULL CHECK (pace_rating IN ('slow', 'good', 'fast')),
  clarity_score INTEGER NOT NULL DEFAULT 0,
  improvements JSONB NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- calendar_entries (one row per user per day with activity)
CREATE TABLE calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 0,
  recording_ids JSONB NOT NULL DEFAULT '[]',
  UNIQUE(user_id, date)
);
```

---

## 5. Auth Strategy

- **Access token**: JWT, short-lived (15 minutes), signed with `JWT_SECRET`.
- **Refresh token**: Opaque token stored as a hash in `refresh_tokens` table, long-lived (30 days).
- **Mobile storage**: Both tokens stored in Expo SecureStore on the device.
- **Token rotation**: Every refresh call issues a new access + refresh token pair and invalidates the old refresh token (hash comparison).
- **Guard**: NestJS `JwtAuthGuard` on all protected routes via `@UseGuards(JwtAuthGuard)`.
- **User extraction**: `@CurrentUser()` decorator to pull `userId` from JWT payload.

---

## 6. Audio Processing Pipeline

```
Client
  |
  | 1. POST /recordings/presign → { uploadUrl, recordingId }
  |
  | 2. PUT {uploadUrl} (audio file → S3 directly from client)
  |
  | 3. POST /recordings { recordingId, wordId, word, mode, durationMs }
  |
Server
  |
  | 4. Save Recording row with status = 'processing'
  | 5. Enqueue BullMQ job: { recordingId, audioUri, word }
  |
  | 6. Worker picks up job:
  |     a. Download audio from S3 (or pass URI directly to Whisper)
  |     b. POST to OpenAI Whisper API → transcript
  |     c. POST to OpenAI GPT-4o with transcript + word + prompt → structured JSON
  |     d. Save Result row
  |     e. Update Recording status = 'complete', set result_id
  |     f. Upsert calendar_entries for user + date
  |
  | 7. Client polling GET /results/:recordingId every 3s
  |     - Returns { status: 'processing' } until complete
  |     - Returns full Result once complete
```

For presigned URLs use `@aws-sdk/s3-request-presigner` with a 5-minute expiry and the `PutObjectCommand`.

---

## 7. AI Feedback Generation

### Whisper

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'en',
});
```

### GPT-4o Analysis Prompt

```
You are a speech coach analyzing a spoken response. The speaker was asked to talk about the concept: "{word}".

Transcript:
"{transcript}"

Duration: {durationSeconds} seconds

Analyze the speech and return a JSON object with exactly this structure:
{
  "fillerWords": {
    "count": number,
    "examples": string[]  // list of unique filler words used (e.g. ["um", "like", "you know"])
  },
  "pace": {
    "wpm": number,  // words per minute, calculated from word count and duration
    "rating": "slow" | "good" | "fast"  // slow < 100wpm, good 100-160wpm, fast > 160wpm
  },
  "clarity": {
    "score": number  // 0-100, how clearly and coherently the main idea was communicated
  },
  "improvements": string[],  // 2-3 specific, actionable suggestions
  "summary": string  // 2-3 sentence objective assessment of the response
}

Return only valid JSON. No markdown, no extra text.
```

Use `response_format: { type: 'json_object' }` with GPT-4o to ensure structured output.

---

## 8. Environment Variables

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/coherence

# Auth
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=30

# OpenAI
OPENAI_API_KEY=sk-...

# AWS S3 / Cloudflare R2
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=coherence-audio
S3_ENDPOINT=https://...r2.cloudflarestorage.com  # if using R2

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=http://localhost:8081,https://your-app-domain.com
```

---

## 9. Deployment

**Recommended: Railway**

Railway is the simplest option for a hobby-scale NestJS + PostgreSQL + Redis stack:

1. Connect GitHub repo → Railway auto-deploys on push.
2. Add a PostgreSQL plugin → `DATABASE_URL` is auto-injected.
3. Add a Redis plugin → `REDIS_URL` is auto-injected.
4. Set all other environment variables in the Railway dashboard.
5. Use a `Procfile` or Railway's start command: `node dist/main.js`.

**Estimated cost at hobby scale**: ~$5-10/month for a small dyno + managed Postgres + managed Redis.

**Alternative: Render** — similar simplicity, similar cost, slightly better free tier.

For S3, use **Cloudflare R2** — no egress fees, S3-compatible API, free tier covers most hobby usage.

### Build & Start

```bash
# Build
npm run build

# Migrate DB
npm run db:migrate

# Seed words
npm run db:seed

# Start
node dist/main.js
```
