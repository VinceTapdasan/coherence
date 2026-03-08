# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Coherence is a React Native (Expo) speech practice app. Users receive a daily topic or roll a random word via a slot-machine reel, then record themselves speaking about it for 30–60 seconds. After recording, the session is analyzed and feedback is displayed (filler word count, pace, suggestions). A calendar tab tracks streaks and session history.

The app is in early development — auth and API integration are stubbed out, results use mock data, and no actual audio recording/playback is wired up yet.

## Commands

- `npx expo start` — start the Expo dev server (or `npm start`)
- `npx expo start --ios` / `--android` / `--web` — target a specific platform
- `npm run lint` — ESLint for `.ts` and `.tsx` files
- `eas build --profile development` — create a dev client build
- `npx tsc --noEmit` — typecheck without emitting

There is no test runner configured.

## Architecture

### Routing (Expo Router, file-based)

- `app/_layout.tsx` — root layout; wraps the app in `QueryProvider > ThemeProvider > RecordingProvider`; loads custom fonts (Instrument Serif + DM Sans) and controls the splash screen.
- `app/index.tsx` — redirects to `/(tabs)`.
- `app/(tabs)/` — bottom tab navigator with three tabs: Home (`index`), Results, Calendar.
- `app/completion.tsx` — modal screen shown after a recording finishes; navigates to Results.

### Path alias

`@/*` maps to `./src/*` (configured in `tsconfig.json` `paths`). All source imports use this alias.

### Source layout (`src/`)

- **`providers/`** — React context providers composed in the root layout:
  - `QueryProvider` — TanStack React Query with AsyncStorage-based offline persistence and NetInfo-based online status.
  - `ThemeProvider` — exposes `colors` and `isDark` based on system color scheme. Consumed via `useTheme()` hook.
  - `AuthProvider` — token-based auth with `expo-secure-store`; currently stubbed (not mounted in layout yet).
- **`contexts/RecordingContext`** — shares `isRecording` state globally so the tab bar can restyle during recording.
- **`constants/theme.ts`** — design tokens: light/dark color palettes, spacing scale, border radii, font family constants. This is the single source of truth for all visual tokens.
- **`constants/topics.ts`** — daily topic list and practice word pool, plus deterministic `getTodaysTopic()` and random `getRandomPracticeWord()`.
- **`services/`** — thin wrappers around native APIs (haptics, biometrics, notifications) and a stubbed `api.ts` HTTP client.
- **`components/ui/`** — reusable primitives (`Button`, `RecordButton`).
- **`components/features/home/`** — Home screen–specific components: `DailyTopicTab`, `PracticeModeTab`, `SlotMachineWord` (reel logic + view), `Waveform` (animated recording visualizer).

### Key patterns

- **Styling**: React Native `StyleSheet.create` — no external styling library. All colors come from `useTheme().colors`; all spacing/radius/font constants come from `@/constants/theme`.
- **Animation**: `react-native-reanimated` is used throughout (shared values, `withSpring`/`withTiming`, animated styles). The Reanimated Babel plugin is required (`babel.config.js`).
- **Icons**: `phosphor-react-native` — use `weight="light"` for inactive states and `weight="fill"` for active.
- **Recording state machine**: The Home screen manages a local `'idle' | 'recording' | 'completed'` state that drives the UI (topic display, timer, waveform, record button). On completion it navigates to `/completion` which then replaces to `/(tabs)/results`.
- **Offline-first data**: TanStack Query is configured with `networkMode: 'offlineFirst'`, 24h garbage collection, and AsyncStorage persistence.

### Environment

A single env var `API_URL` (defaults to `http://localhost:3001`) is read in `src/services/api.ts` via `process.env.API_URL`. Copy `.env.example` to `.env` to configure.
