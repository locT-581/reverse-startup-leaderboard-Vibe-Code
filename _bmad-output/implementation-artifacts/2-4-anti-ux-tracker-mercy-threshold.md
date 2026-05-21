---
story_id: 2.4
story_key: 2-4-anti-ux-tracker-mercy-threshold
epic_num: 2
story_num: 4
epic_title: The Core Chaos - Posting, Voting & Mercy
story_title: Anti-UX Tracker & Mercy Threshold
status: done
---

# Story 2.4: Anti-UX Tracker & Mercy Threshold

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a frustrated user,
I want the system to eventually take pity on me,
so that I don't churn completely when I fail repeatedly.

## Acceptance Criteria

1. **Given** a user is logged in:
   - **When** the user session loads (on mount in home or profile page)
   - **Then** the frontend must initialize the Zustand `useMercyStore` with the user's persisted mercy state (`mercyFailures` and `isMercyActive`) from the user profile data.
2. **Given** the user is interacting with Anti-UX components (e.g. triggering a combo reset on the `EvasiveButton`):
   - **When** they fail the interaction, incrementing the failures counter
   - **Then** the Zustand store must call the Server Action `actionSyncMercyState` to persist the updated failure count and active state to the database, ensuring persistence across page refreshes.
3. **Given** the failures count reaches a threshold of 10 consecutive/cumulative failures:
   - **When** the 10th failure is registered
   - **Then** the Zustand store sets `isMercyActive` to `true` and syncs with the database.
   - **And** displays a condescending modal/notification mocking the user's failure (e.g., "Activating toddler mode... Please enjoy this simplified interface since you clearly couldn't handle the basic version.").
4. **Given** Mercy Mode is active (`isMercyActive` is `true`):
   - **Then** all Anti-UX evasion logic on the `EvasiveButton` is disabled, allowing a single standard click/tap to submit votes.
   - **And** the "Ad Captcha" modal is bypassed (calling `onSuccess` and closing immediately).
   - **And** a public humiliation badge (emoji "👶" and text "Toddler Mode Active") is displayed on the user's profile page and next to their name in header navigation and post/comment authors on the leaderboard.
5. **Given** the user is on the Profile Page:
   - **When** they have accumulated at least 10 failures
   - **Then** they see a toggle option to turn Mercy Mode ON or OFF.
   - **And** toggling it OFF restores the Anti-UX evasion/captcha logic immediately and hides the humiliation badge (but retains their failure count in the database), while toggling it back ON returns the toddler mode benefits and badge.

## Tasks / Subtasks

- [x] Task 1: Database Migration & Schema Update (AC: 1, 2)
  - [x] Update the `users` table in `apps/backend/db/schema.ts` to include:
    - `mercyFailures: integer("mercy_failures").default(0).notNull()`
    - `isMercyActive: boolean("is_mercy_active").default(false).notNull()`
  - [x] Generate and run database migration to add these columns.
- [x] Task 2: Backend Endpoints for Mercy Sync (AC: 1, 2)
  - [x] Add `@Put('mercy')` endpoint protected by `JwtAuthGuard` in `apps/backend/src/auth/auth.controller.ts`.
  - [x] Expose `updateMercy(userId: string, failures: number, isMercyActive: boolean)` in `apps/backend/src/auth/auth.service.ts` to update the user in the database.
  - [x] Update `getLeaderboard` query in `apps/backend/src/leaderboard/leaderboard.service.ts` to include `isMercyActive` in the author details returned for posts and comments.
- [x] Task 3: Frontend Server Actions & State (AC: 1, 2)
  - [x] Update `UserProfile` interface in `apps/frontend/src/app/actions/auth.ts` to include `mercyFailures: number` and `isMercyActive: boolean`.
  - [x] Implement Server Action `actionSyncMercyState(failures: number, isMercyActive: boolean)` in `apps/frontend/src/app/actions/auth.ts` to sync frontend store changes with the backend.
  - [x] Update `useMercyStore.ts` Zustand store at `apps/frontend/src/core/store/useMercyStore.ts` to:
    - Support a `setMercyState(failures: number, isMercyActive: boolean)` action to initialize the store from backend profile.
    - Call `actionSyncMercyState` asynchronously whenever `failures` or `isMercyActive` updates.
  - [x] Initialize the store state on application mount. For example, in `apps/frontend/src/app/page.tsx` and `apps/frontend/src/app/profile/page.tsx`, when `actionGetMe()` or auth state resolves, call `setMercyState` with user's profile values.
- [x] Task 4: UI Integration (AC: 3, 4, 5)
  - [x] Create a condescending Modal dialog in `apps/frontend/src/domains/anti-ux/components/MercyActivationModal.tsx` that triggers when `isMercyActive` becomes true for the first time.
  - [x] Update `AdCaptchaModal.tsx` to read `bypass` prop correctly (it is already wired to bypass, but make sure to pass the `mercyActive` store value to it in `CreatePostModal.tsx` and `CommentSection.tsx`).
  - [x] Display the "Humiliation Badge" (emoji `👶` or custom style) on:
    - User's navigation button in `apps/frontend/src/app/page.tsx`
    - Post row author name in `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`
    - Comment row author name in `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx`
  - [x] Add the Mercy Mode Toggle to the Profile Page (`apps/frontend/src/app/profile/page.tsx`):
    - Only display/enable the toggle if the user has accumulated at least 10 failures.
    - Implement the toggle state change, which updates the Zustand store and dispatches `actionSyncMercyState` to persist the setting.
    - Display the Humiliation Badge prominently on the profile page when active.
- [x] Task 5: Testing & Verification (AC: 1-5)
  - [x] Create E2E test file `tests/e2e/mercy-threshold.spec.ts` using Playwright.
  - [x] Verify that:
    - Missing the button 10 times increments the failures, pops up the mock modal, and persists active state.
    - A page refresh maintains Mercy Mode active.
    - Captchas are bypassed and Evasive Button evasion is turned off.
    - Toggling Mercy Mode off on the Profile Page restores evasion logic and captcha, and removes the humiliation badges.

## Dev Notes

### Syncing Zustand with Server Actions

When updating store failures, call the server action in a debounced or direct async action inside `useMercyStore.ts`:
```typescript
import { actionSyncMercyState } from '@/app/actions/auth';

// ...
incrementFailures: async () => {
  const state = get();
  const nextFailures = state.failures + 1;
  const shouldActivate = nextFailures >= 10;
  const nextMercyActive = state.isMercyActive || shouldActivate;

  set({ failures: nextFailures, isMercyActive: nextMercyActive });
  await actionSyncMercyState(nextFailures, nextMercyActive);
}
```

### References

- [PRD - Fallback (The Mercy Threshold)](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L161)
- [UX Spec - The Mercy Threshold Prompt](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L380)
- [Architecture - Zustand Local State vs Server sync](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L150)
- [Previous Story - Evasive Vote Button](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/2-3-the-evasive-vote-button.md)

## Review Findings

### decision-needed

### patch

- [x] [Review][Patch] Reset failures to 0 when disabling Mercy Mode (User Decision) — When the user turns Mercy Mode OFF, we should reset their failure count (mercy_failures) to 0 in the database and store to prevent instant reactivation on the next single failure.
- [x] [Review][Patch] Zustand Store Out-Of-Sync on Sync API Failures [apps/frontend/src/core/store/useMercyStore.ts:35]
- [x] [Review][Patch] Concurrency Race Condition in Sync State Requests [apps/frontend/src/core/store/useMercyStore.ts:35]
- [x] [Review][Patch] Unused and Hacky Local Store Dependency [apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx:14]
- [x] [Review][Patch] Captcha Bypass Immediately Blocks AdCaptchaModal UI Render [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:147]
- [x] [Review][Patch] Missing Humiliation Badge in Nav Button during Auth/Logout transition [apps/frontend/src/app/page.tsx:46]
- [x] [Review][Patch] Lack of loading state indicator during Mercy state toggle [apps/frontend/src/app/profile/page.tsx:185]
- [x] [Review][Patch] Unused resetFailures function in Zustand store [apps/frontend/src/core/store/useMercyStore.ts:40]

### defer

- [x] [Review][Defer] Client-side Cookie Manipulation during Register/Login [apps/frontend/src/app/actions/auth.ts:51] — deferred, pre-existing
