---
story_id: 2.3
story_key: 2-3-the-evasive-vote-button
epic_num: 2
story_num: 3
epic_title: The Core Chaos - Posting, Voting & Mercy
story_title: The Evasive Vote Button
status: done
---

# Story 2.3: The Evasive Vote Button

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to cast a vote on a post or comment,
so that I can negatively impact its rank.

## Acceptance Criteria

1. **Given** a user is viewing the leaderboard or comment list:
   - **Then** a "Vote" button (with an upvote-like icon representing "Wasted Calories") is displayed next to each post and comment.
2. **Given** a pointer device (mouse) is used:
   - **When** the cursor enters a predefined proximity (< 50px radius) of the vote button
   - **Then** the `EvasiveButton` must translate its X/Y coordinates to evade the cursor, making it impossible to click.
3. **Given** a touch device (mobile/tablet) is used:
   - **When** the user taps near or on the button
   - **Then** the button must relocates to a new random position (with touch latency < 50ms to ensure evasion feel).
4. **Given** the button has successfully dodged the user's cursor exactly 3 times:
   - **Then** it stops evading and enters a "Vibrating" state where it shakes rapidly/violently using a CSS animation.
   - **And** the user must click/tap the shaking button exactly 5 times in rapid succession (within a 2-second combo window) to register the vote.
   - **And** if they click outside or fail to click 5 times within 2 seconds, the combo resets, a mocking tooltip appears ("Too slow, grandpa" or "Synergy levels too low"), and the button resumes evading from 0 dodges.
5. **Given** the user successfully clicks the vibrating button 5 times:
   - **Then** the button calls the frontend Server Action `actionSubmitVote` and enters a "Cooldown" state for 5 seconds (disabled, running a CSS panting/breathing animation).
   - **And** the UI triggers premium success feedback: screen shake, a loud airhorn sound effect, and an explosion of confetti.
   - **And** the post/comment's wasted calories score in the database increases by 50 kcal, which triggers a WebSocket broadcast updating all active clients.
6. **Given** accessibility overrides are triggered:
   - **When** `prefers-reduced-motion: reduce` is active OR the user utilizes keyboard navigation (`Tab` to focus and `Enter`/`Space` to activate) OR Mercy Mode is active (Story 2.4)
   - **Then** the button must NOT evade, vibrate, or require combo clicks, allowing a single click/press to successfully submit the vote.

## Tasks / Subtasks

- [x] Task 1: Backend Endpoint & Score Calculation Correction (AC: 5)
  - [x] Add the database update logic in `apps/backend/src/posts/posts.service.ts`:
    - Create `vote(userId: string, targetId: string, targetType: 'post' | 'comment')` method.
    - Fetch the post or comment. Verify existence.
    - Increment `wastedCalories` by 50.
    - Call `this.leaderboardService.broadcastUpdate()` to notify all clients via WebSocket.
  - [x] Add endpoint in `apps/backend/src/posts/posts.controller.ts`:
    - `@Post('vote')` protected by `JwtAuthGuard`.
    - Accept DTO `{ targetId: string; targetType: 'post' | 'comment' }`.
    - Return success state and new score.
  - [x] **Critical Bug Fix** in `apps/backend/src/leaderboard/leaderboard.service.ts`:
    - Modify the query in `getLeaderboard()` to select `schema.posts.wastedCalories` from the database.
    - Stop calculating `wastedCalories` dynamically from content on fetch (remove `this.calculateScore(post.content)` overwrite). Ensure database-mutated scores are accurately returned to clients.
- [x] Task 2: Frontend API Connection & State (AC: 5, 6)
  - [x] Implement Server Action `actionSubmitVote(targetId: string, targetType: 'post' | 'comment')` in `apps/frontend/src/app/actions/posts.ts` to call backend endpoint.
  - [x] Create basic `useMercyStore.ts` Zustand store at `apps/frontend/src/core/store/useMercyStore.ts` with `failures`, `isMercyActive`, and helper functions (setting foundation for Story 2.4).
- [x] Task 3: Reusable EvasiveButton Component (AC: 1, 2, 3, 4, 5, 6)
  - [x] Create `apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx`.
  - [x] Implement mouse proximity detection (< 50px radius) using a global `mousemove` event listener on mount, tracking coordinates against the button's center point.
  - [x] Implement mobile touch support with quick-relocation (`onTouchStart`) and latency < 50ms.
  - [x] Style the button in `apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css` using Vanilla CSS. Add animations:
    - `.vibrating` class using rapid CSS keyframe translation offsets.
    - `.cooldown` class running a smooth panting/breathing scale/opacity transition.
  - [x] Implement combo click logic:
    - Counter up to 5 click attempts.
    - 2-second timer starting on first click.
    - Reset logic with tooltip popup on timeout or click-away.
  - [x] Implement visual and audio feedback:
    - Add a synth airhorn generator using the HTML5 Web Audio API (creating oscillators to mimic an airhorn sound, preventing local asset 404s).
    - Add fullscreen canvas-based confetti explosion or CSS particles.
    - Add temporary screen-shake class on the layout wrapper.
  - [x] Add bypass checks:
    - Read `prefers-reduced-motion` media query state.
    - Check keyboard activation via keydowns (`Enter`, `Space`) bypassing evasion.
    - Check Mercy Mode store state.
- [x] Task 4: UI Integration (AC: 1)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx` to include `EvasiveButton` in each row.
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx` to include `EvasiveButton` for each comment.
- [x] Task 5: Testing & Verification (AC: 1-6)
  - [x] Create E2E test file `tests/e2e/evasive-vote.spec.ts` using Playwright.
  - [x] Verify proximity evasion, mobile touch jumps, combo limits, keyboard bypass, and visual success/cooldown states.

### Review Findings

- [x] [Review][Decision] Backend Cooldown and Rate Limiting Enforcement — frontend-only restriction is sufficient
- [x] [Review][Patch] Restriction on Self-Voting [apps/backend/src/posts/posts.service.ts:78]
- [x] [Review][Patch] Lost Update/SQL Race Condition in Vote Increment [apps/backend/src/posts/posts.service.ts:94]
- [x] [Review][Patch] AudioContext Initialization Blocked by Autoplay Policy [apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx:200]
- [x] [Review][Patch] Cumulative Failures Instead of Consecutive Failures [apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx:310]
- [x] [Review][Patch] Malformed UUID targetId Crash [apps/backend/src/posts/posts.controller.ts:50]
- [x] [Review][Patch] Duplicate Server Action Dispatches on Rapid Clicks [apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx:374]
- [x] [Review][Defer] Missing E2E Test coverage for Touch Relocation Latency [tests/e2e/evasive-vote.spec.ts:1] — deferred, pre-existing

## Dev Notes

### Proximity Evasion Math

Calculate proximity dynamically on cursor moves to optimize performance (running logic only on coordinate changes, avoiding heavy state updates).
```typescript
const dx = mouseX - buttonCenterX;
const dy = mouseY - buttonCenterY;
const distance = Math.sqrt(dx * dx + dy * dy);
if (distance < 50) {
  // Translate button in opposite direction using CSS variables
  button.style.setProperty('--offset-x', `${newX}px`);
  button.style.setProperty('--offset-y', `${newY}px`);
}
```

### Web Audio Synth Airhorn

To make the sound reliable, generate a synthesizer-driven sound using Web Audio API:
```typescript
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'sawtooth';
osc.frequency.setValueAtTime(220, ctx.currentTime); // Airhorn baseline frequency
osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
osc.stop(ctx.currentTime + 1.0);
```

### References

- [PRD - FR7 & FR8 (Post & Comment Voting)](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L255)
- [PRD - DDoS Mitigation](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L124)
- [UX Spec - Proximity & Dodging Mechanics](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L210)
- [UX Spec - Button Hierarchy](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L357)
- [Architecture - Anti-UX Execution & Perf](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L55)
- [Architecture - Consistent File Structure](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L313)
- [Previous Story - Ad Captcha Cooldown](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/2-2-the-ad-captcha-challenge.md#L73)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

- Fixed E2E test race condition where hover action on the button was resetting the keyboard user state, by ensuring correct focus sequencing.
- Removed click post-focus Tab keypress in `tests/e2e/evasive-vote.spec.ts` which was causing the focused element to shift.

### Completion Notes List

- Implemented standard proximity evasion, mobile relocation, combo-click validation, and accessible bypass mechanisms for voting.
- Created `EvasiveButton` and integrated it in both `LeaderboardGrid` and `CommentSection`.
- Verified passing behavior for all unit and integration/E2E test files.

### File List

- `apps/backend/src/posts/posts.service.ts`
- `apps/backend/src/posts/posts.controller.ts`
- `apps/backend/src/leaderboard/leaderboard.service.ts`
- `apps/frontend/src/app/actions/posts.ts`
- `apps/frontend/src/app/globals.css`
- `apps/frontend/src/core/store/useMercyStore.ts`
- `apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx`
- `apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css`
- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`
- `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx`
- `tests/unit/backend/posts/posts.service.spec.ts`
- `tests/unit/backend/leaderboard/leaderboard.service.spec.ts`
- `tests/e2e/evasive-vote.spec.ts`
