---
story_id: 1.4
story_key: 1-4-real-time-leaderboard-view-badges
epic_num: 1
story_num: 4
epic_title: The Foundation - Identity & Leaderboard
story_title: Real-time Leaderboard View & Badges
status: done
---

# Story 1.4: Real-time Leaderboard View & Badges

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to view the active leaderboard and see special badges,
so that I know who currently holds the most "Wasted Calories".

## Acceptance Criteria

1. **Given** the leaderboard page is loaded:
   - **When** the data is rendered on the client
   - **Then** the `LeaderboardGrid` component displays the ranked posts in descending order of their "Wasted Calories" scores.
2. **Given** the leaderboard page is loaded:
   - **When** the data is rendered on the client
   - **Then** the post in the #1 position automatically displays the "Golden Raspberry" badge (styled in "Golden Raspberry Yellow").
3. **Given** the leaderboard page is loaded:
   - **When** new posts are created or scores are updated on the backend
   - **Then** the backend broadcasts a WebSocket event containing the updated leaderboard data
   - **And** the `LeaderboardGrid` component updates the displayed ranked posts in real-time (< 100ms latency) without a full page reload.

## Tasks / Subtasks

- [x] Task 1: Package Dependencies Setup (AC: 3)
  - [x] Add `@nestjs/websockets` and `@nestjs/platform-socket.io` dependencies to `apps/backend/package.json`.
  - [x] Add `socket.io-client` dependency to `apps/frontend/package.json`.
  - [x] Run dependency installation (e.g. `pnpm install`).
- [x] Task 2: Backend WebSocket Gateway (AC: 3)
  - [x] Create `apps/backend/src/leaderboard/leaderboard.gateway.ts` defining a `LeaderboardGateway` to handle socket connections.
  - [x] Inject `LeaderboardService` in `LeaderboardGateway` to fetch initial data on connection if needed, and setup a broadcast namespace.
  - [x] Register `LeaderboardGateway` in `apps/backend/src/leaderboard/leaderboard.module.ts`.
  - [x] Implement a method inside `LeaderboardService` or `LeaderboardGateway` to broadcast the updated leaderboard list on the `leaderboard.updated` event room/channel whenever scores or posts are modified.
- [x] Task 3: Frontend WebSocket Client Singleton (AC: 3)
  - [x] Create `apps/frontend/src/core/api/socket.client.ts` to export a singleton socket client instance.
  - [x] Configure it to connect only on the client side (`typeof window !== 'undefined'`) and point to the NestJS backend WebSocket url.
- [x] Task 4: Leaderboard Components and Page (AC: 1, 2, 3)
  - [x] Create `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx` (`"use client"`) to fetch initial leaderboard data using `actionGetLeaderboard` Server Action.
  - [x] Subscribe to the `leaderboard.updated` socket event in a `useEffect` hook, replacing the local state with the received list of posts to achieve real-time rendering.
  - [x] Create `apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.tsx` displaying the badge with a premium "Golden Raspberry Yellow" style.
  - [x] Modify `apps/frontend/src/app/page.tsx` to render the `LeaderboardGrid` component inside a structured, clean container.
  - [x] Modify `apps/frontend/src/app/globals.css` with the polished light theme layout rules (no Tailwind), supporting responsive columns.
- [x] Task 5: Testing & Verification (AC: 1, 2, 3)
  - [x] Create a unit test `tests/unit/backend/leaderboard/leaderboard.gateway.spec.ts` to test client connections and event broadcasting logic.
  - [x] Create Playwright E2E test `tests/e2e/leaderboard.spec.ts` verifying layout, badge rendering, and real-time updates when socket messages are received.

## Dev Notes

- **Aesthetics & Styling**:
  - Main Leaderboard is a highly polished light-theme facade (stark whites, slate grays, and Action Blue: HSL 220, 90%, 50%).
  - The Golden Raspberry badge must use "Golden Raspberry Yellow" (`#f59e0b` or HSL Hsl 38, 92%, 50%) as a prominent semantic color.
  - Use Vanilla CSS for maximum performance and compatibility.
- **Accessibility & Motion**:
  - Underlying HTML must be semantic and pass accessibility audits (WCAG AA).
  - Keyboard navigation (Tab, Enter, Space) must not be affected. Focus states must remain stable and visible.
  - Respect prefers-reduced-motion: No animations or transitions should fire if the setting is active.
- **Project Structure**:
  - Keep Next.js page components routing-only, moving custom UI components to `src/domains/leaderboard/components/`.
  - Frontend websocket client goes to `src/core/api/socket.client.ts`.
  - Backend websocket gateway goes to `apps/backend/src/leaderboard/leaderboard.gateway.ts`.
- **References**:
  - [PRD - Core Leaderboard & Gamification](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#Core%20Leaderboard%20&%20Gamification)
  - [UX Design - Color System](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#Color%20System)
  - [Architecture - API & Communication Patterns](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#API%20&%20Communication%20Patterns)
  - [Previous Story - Core Leaderboard Data Engine](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/1-3-core-leaderboard-data-engine.md)

## Dev Agent Record

### Agent Model Used

Gemini 1.5 Pro (Antigravity)

### Debug Log References

### Completion Notes List
- Implemented real-time WebSocket communication utilizing NestJS gateway on backend and socket.io-client on frontend.
- Created premium light-theme LeaderboardGrid component featuring responsive layout and accessibility support.
- Added animated Golden Raspberry Badge for the first-place item.
- Verified everything with comprehensive backend gateway unit tests and Playwright E2E integration tests.

### File List
- [leaderboard.gateway.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.gateway.ts) [NEW]
- [leaderboard.gateway.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/unit/backend/leaderboard/leaderboard.gateway.spec.ts) [NEW]
- [socket.client.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/core/api/socket.client.ts) [NEW]
- [GoldenRaspberryBadge.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.tsx) [NEW]
- [GoldenRaspberryBadge.module.css](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.module.css) [NEW]
- [LeaderboardGrid.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx) [NEW]
- [LeaderboardGrid.module.css](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css) [NEW]
- [leaderboard.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/e2e/leaderboard.spec.ts) [NEW]
- [package.json](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/package.json) [MODIFY]
- [leaderboard.service.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.service.ts) [MODIFY]
- [leaderboard.module.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.module.ts) [MODIFY]
- [leaderboard.service.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/unit/backend/leaderboard/leaderboard.service.spec.ts) [MODIFY]
- [package.json](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/package.json) [MODIFY]
- [page.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/app/page.tsx) [MODIFY]
- [page.module.css](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/app/page.module.css) [NEW]
- [globals.css](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/app/globals.css) [MODIFY]

### Review Findings

- [x] [Review][Patch] Seed User Avatars Inconsistent with Frontend Allowed Avatars [apps/backend/db/seed.ts:104]
- [x] [Review][Patch] Eager WebSocket Connection on Import [apps/frontend/src/core/api/socket.client.ts:792]
- [x] [Review][Patch] Silent Connection Error in Gateway connection handler [apps/backend/src/leaderboard/leaderboard.gateway.ts:25]
- [x] [Review][Patch] Fragile Sorting on createdAt.getTime() [apps/backend/src/leaderboard/leaderboard.service.ts:121]
- [x] [Review][Patch] WebSocket updates do not clear initial load errors [apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx:20]
- [x] [Review][Patch] Wildcard CORS origin on WebSocket gateway [apps/backend/src/leaderboard/leaderboard.gateway.ts:11]
- [x] [Review][Patch] Next.js Server Action using NEXT_PUBLIC_ environment variable prefix [apps/frontend/src/app/actions/leaderboard.ts:409]
- [x] [Review][Patch] Potential memory leak with Socket listener in useEffect hook [apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx:42]
- [x] [Review][Defer] Missing transition animations for first-place badge status change [apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx:102] — deferred, pre-existing
