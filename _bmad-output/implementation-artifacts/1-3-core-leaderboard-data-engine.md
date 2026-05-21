---
story_id: 1.3
story_key: 1-3-core-leaderboard-data-engine
epic_num: 1
story_num: 3
epic_title: The Foundation - Identity & Leaderboard
story_title: Core Leaderboard Data Engine
status: done
---

# Story 1.3: Core Leaderboard Data Engine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a backend developer,
I want to implement the database tables, score calculation engine, and leaderboard fetching API,
so that the core reverse startup leaderboard logic works correctly under the hood.

## Acceptance Criteria

1. **Given** multiple posts exist in the database with different attributes:
   - **When** the leaderboard data is fetched via Server Action
   - **Then** the backend must return the posts sorted descending by their calculated "Wasted Calories" score.
   - **And** the score calculation must follow the predefined static rules exactly.
2. **Given** the database schema is updated:
   - **When** migration files are generated and applied
   - **Then** a `posts` table is created containing `id` (uuid, PK), `title` (text, not null), `content` (text, not null), `wasted_calories` (integer, default 0, not null), `author_id` (uuid, FK, not null, cascading delete), `created_at` (timestamp, not null), and `updated_at` (timestamp, not null).
3. **Given** a seed script is executed:
   - **When** run
   - **Then** mock users and posts (exhibiting diverse formatting, length, and content features to produce distinct scores) are successfully populated in the database.

## Tasks / Subtasks

- [x] Task 1: Database Schema Expansion (AC: 2)
  - [x] Add the `posts` table definition and Drizzle relations (e.g. `postsRelations`, `usersRelations`) to `apps/backend/db/schema.ts`.
  - [x] Map `snake_case` database column names to `camelCase` TypeScript properties in the Drizzle schema definition.
  - [x] Generate migrations using `pnpm --filter backend drizzle-kit generate` or `npx drizzle-kit generate`.
  - [x] Run migration or use `pnpm --filter backend drizzle-kit push` to synchronize changes with the local PostgreSQL database.
- [x] Task 2: Database Seed Script (AC: 1, 3)
  - [x] Create `apps/backend/db/seed.ts` using Drizzle ORM to insert at least 3 mock users and 5 mock posts with varied characters (e.g., code snippets, lowercase scream, long texts).
  - [x] Add a `"db:seed"` script to `apps/backend/package.json` that runs the seed script (e.g. using `ts-node` or `npx ts-node db/seed.ts`).
  - [x] Execute the seed script and verify the populated data in the database.
- [x] Task 3: Backend Leaderboard Module (AC: 1)
  - [x] Implement `LeaderboardModule`, `LeaderboardService`, and `LeaderboardController` inside `apps/backend/src/leaderboard/`.
  - [x] Inject the database connection using `@Inject(DRIZZLE)` (from the global `DatabaseModule`) in `LeaderboardService`.
  - [x] Register `LeaderboardModule` in `apps/backend/src/app.module.ts`.
  - [x] Implement the static rule-based score calculation logic:
    - **Word Count**: `+5` wasted calories per word (whitespace-separated) in the post content.
    - **Capitalization Scream**: If `> 30%` of alphabetic characters in the content are uppercase, add `+50` wasted calories.
    - **Over-engineering Penalty**: If the content contains markdown code blocks (using ` ``` ` delimiters), add `+100` wasted calories.
    - **Length Modifier**:
      - If character length is `> 1000` characters: add `+150` wasted calories.
      - If character length is `< 100` characters: subtract `50` wasted calories (encourages verbose, bloated writing).
    - **Frustration Punctuation**: Count total occurrences of `!`, `?`, or `...` in the content. Add `+5` wasted calories per occurrence (capped at a maximum of `+50` total).
  - [x] Implement endpoint `GET /leaderboard` to fetch posts joined with their author details (username and avatar), sorted descending by `wastedCalories`.
- [x] Task 4: Frontend Leaderboard Server Action (AC: 1)
  - [x] Create `apps/frontend/src/app/actions/leaderboard.ts`.
  - [x] Implement a typed `actionGetLeaderboard` action using Next.js Server Actions.
  - [x] The action must fetch the leaderboard data from the backend `GET /leaderboard` endpoint and return an `ActionResponse<LeaderboardPost[]>` typed object matching:
    ```typescript
    export type ActionResponse<T> = {
      success: boolean;
      data?: T;
      error?: { message: string; code?: string };
    };
    ```
  - [x] Handle backend network/http errors gracefully, returning a passive-aggressive error response (e.g., `'Failed to contact the leaderboard engine. The server is probably taking a coffee break.'`) rather than throwing an exception.
- [x] Task 5: Testing & Verification (AC: 1, 3)
  - [x] Create unit tests for `LeaderboardService` in `tests/unit/backend/leaderboard/leaderboard.service.spec.ts` to test all scoring rules and the ordering logic.
  - [x] Ensure that mock posts can be correctly calculated, sorted, and returned under test conditions.

### Review Findings

- [x] [Review][Patch] Duplicated Score Calculation Logic (DRY Violation) [apps/backend/db/seed.ts:127]
- [x] [Review][Patch] Potential Crash on Null or Undefined Post Content [apps/backend/src/leaderboard/leaderboard.service.ts:259]
- [x] [Review][Patch] Redundant String Copying and Replacement in Punctuation Scoring [apps/backend/src/leaderboard/leaderboard.service.ts:291]
- [x] [Review][Patch] Unstable Leaderboard Sorting [apps/backend/src/leaderboard/leaderboard.service.ts:337]
- [x] [Review][Defer] Lack of HTML Sanitization in Leaderboard Post Content [apps/backend/db/schema.ts:18] — deferred, pre-existing

## Dev Notes


- **Language-Specific Rules**:
  - Map `snake_case` columns (e.g. `wasted_calories`, `author_id`) to `camelCase` in Drizzle.
  - Keep Next.js server actions strictly typed with `ActionResponse<T>`.
- **Framework-Specific Rules**:
  - Do not use Next.js standard API routes (`app/api/...`) for frontend fetching; use Server Actions wrappers around the NestJS REST calls.
  - Follow the dependency injection pattern in NestJS. Always inject the database pool via `@Inject(DRIZZLE)`.
- **Styling Solution**:
  - Vanilla CSS only. No styling is required for this story since it's backend/logic engine, but future visual components must strictly follow Vanilla CSS modules.
- **Testing Standards**:
  - Unit tests go in `tests/unit/backend/leaderboard/`.
  - Ensure all mock endpoints/services are properly typed.

### Project Structure Notes

- Add `posts` definition to `apps/backend/db/schema.ts`.
- Backend source code goes in `apps/backend/src/leaderboard/`.
- Frontend Server Actions go in `apps/frontend/src/app/actions/leaderboard.ts`.

### References

- [Source: apps/backend/db/schema.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/db/schema.ts)
- [Source: _bmad-output/project-context.md#Language-Specific Rules](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/project-context.md#Language-Specific%20Rules)
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: The Foundation - Identity & Leaderboard](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/epics.md#Epic%201:%20The%20Foundation%20-%20Identity%20&%20Leaderboard)

## Dev Agent Record

### Agent Model Used

Gemini 1.5 Pro (Antigravity)

### Debug Log References

- Encountered an issue starting NestJS watch task using `node --env-file=.env node_modules/.bin/nest start` due to script execution format. Solved by exporting variables via `export $(cat .env | xargs)` in shell before launching.

### Completion Notes List

- Database schema extended with `posts` table and Drizzle one-to-many/many-to-one relations, successfully generated and applied migration.
- Executed `seed.ts` inserting 3 mock users and 5 mock posts representing various scoring modifiers.
- Coded NestJS `LeaderboardService` scoring engine covering all rules (word count, screaming, code blocks, length modifiers, frustration punctuation with cap).
- Built `GET /leaderboard` REST API sorting posts dynamically by score.
- Built Next.js Server Action `actionGetLeaderboard` on the frontend with network error safety.
- Created 15 Jest tests covering every detail of the score calculator.

### File List

- [apps/backend/db/schema.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/db/schema.ts)
- [apps/backend/db/seed.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/db/seed.ts)
- [apps/backend/package.json](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/package.json)
- [apps/backend/src/leaderboard/leaderboard.service.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.service.ts)
- [apps/backend/src/leaderboard/leaderboard.controller.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.controller.ts)
- [apps/backend/src/leaderboard/leaderboard.module.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.module.ts)
- [apps/backend/src/app.module.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/app.module.ts)
- [apps/frontend/src/app/actions/leaderboard.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/app/actions/leaderboard.ts)
- [tests/unit/backend/leaderboard/leaderboard.service.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/unit/backend/leaderboard/leaderboard.service.spec.ts)

