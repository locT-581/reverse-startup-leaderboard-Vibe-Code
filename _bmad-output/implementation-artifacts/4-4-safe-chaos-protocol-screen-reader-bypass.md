---
story_id: 4.4
story_key: 4-4-safe-chaos-protocol-screen-reader-bypass
epic_num: 4
story_num: 4
epic_title: Anti-Logic Moderation & Viral Sharing
story_title: Safe-Chaos Protocol & Screen Reader Bypass
status: done
---

# Story 4.4: Safe-Chaos Protocol & Screen Reader Bypass

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system administrator,
I want the platform to be safe and accessible despite the visual chaos,
so that we do not cause actual harm or exclude assistive technology users.

## Acceptance Criteria

1. **Given** the application is running:
   - **When** a user has OS-level `prefers-reduced-motion: reduce` active
   - **Then** all CSS vibrating, evading, and shaking animations must be disabled statically.
   - **And** the `EvasiveButton` proximity evasion is disabled, allowing direct voting in a single click without requiring combo clicks.
   - **And** the `AdCaptchaModal` "Skip Ad" button evasion is disabled, remaining stationary when hovered or focused.
2. **Given** a post is distorted by an active Sabotage Pack (e.g. `sabotage-blur`, `sabotage-comic-sans`, `sabotage-papyrus`):
   - **When** a screen reader parses the post row on the leaderboard
   - **Then** it must read out a clean, undistorted, visually hidden text block (using `.srOnly` CSS styles) containing full semantic text (Rank, Innovator username, logic penalties, post title, post snippet, and Wasted Calories).
   - **And** all distorted visual elements must be hidden from screen readers via `aria-hidden="true"`.
3. **Given** a keyboard user navigates the site using `Tab`, `Enter`, or `Space`:
   - **When** they focus on the `EvasiveButton`
   - **Then** the evasion logic is bypassed entirely, keeping the button in place.
   - **And** pressing `Enter` or `Space` immediately registers the vote in a single action.

## Tasks / Subtasks

- [x] **Task 1: Verify & Consolidate Safe-Chaos Protocol (prefers-reduced-motion)** (AC: 1)
  - [x] Audit CSS modules to ensure transitions, animations, and keyframes are disabled or set to static properties when `@media (prefers-reduced-motion: reduce)` is matching. Check:
    - [x] `apps/frontend/src/app/globals.css` (screen-shake)
    - [x] `apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css` (shakeBtn, panting)
    - [x] `apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css` (shake, scaleIn, fadeIn)
    - [x] `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css` (wiggle)
    - [x] `apps/frontend/src/domains/leaderboard/components/CommentSection.module.css` (wiggle)
    - [x] `apps/frontend/src/app/profile/profile.module.css` & `profile-public.module.css` (wiggle, pulse)
  - [x] Audit React state listeners and ensures JS-based evasion coordinates are immediately bypassed for reduced-motion users (using matchMedia checks) in `EvasiveButton.tsx` and `AdCaptchaModal.tsx`.
- [x] **Task 2: Verify & Consolidate Screen Reader Bypass** (AC: 2)
  - [x] Inspect `LeaderboardGrid.tsx` and verify that when a post is active-sabotaged (`isDistorted` is true):
    - [x] The clean text fallback `<div className={styles.srOnly}>` renders correct readable fields.
    - [x] All other row contents (Rank badge, Innovator column, Title snippet column, Score column, actionButtons) are wrapped in containers marked with `aria-hidden="true"`.
  - [x] Review comment sections and other elements to ensure no visual chaos overrides screen reader navigation.
- [x] **Task 3: Implement Automated E2E Accessibility Tests** (AC: 1, 2, 3)
  - [x] Create a new E2E test file `tests/e2e/accessibility-safe-chaos.spec.ts` using Playwright:
    - [x] **Test Case 1 (Reduced Motion Evasive Button):** Emulate `reducedMotion: 'reduce'`, hover the `EvasiveButton`, verify it does not translate, and verify clicking it once successfully casts a vote (increases score).
    - [x] **Test Case 2 (Reduced Motion Captcha Skip):** Emulate `reducedMotion: 'reduce'`, trigger the post creation captcha, hover/mouseMove the "Skip Ad" button, and verify it does not translate.
    - [x] **Test Case 3 (Screen Reader Bypass):** Register User A and create a post. Register User B, purchase a Sabotage Pack, and deploy it onto User A's post. Verify that User A's post row is distorted, that the visual elements have `aria-hidden="true"`, and that the `.srOnly` element is visible in the DOM containing the correct, readable text representation of the post.
    - [x] **Test Case 4 (Keyboard Bypass):** Register a user, focus on the `EvasiveButton` using keyboard navigation (`focus()`), hover it to verify it does not move, and press `Enter` to cast the vote instantly.

### Review Findings

- [x] [Review][Patch] Strict TypeScript violation using any type in E2E tests [tests/e2e/accessibility-safe-chaos.spec.ts:8]
- [x] [Review][Patch] Direct document reference without SSR safety check [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:88]
- [x] [Review][Patch] Unguarded skipBtnRef.current check in AdCaptchaModal [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:88]
- [x] [Review][Defer] Brittle class-name contains selectors in E2E tests [tests/e2e/accessibility-safe-chaos.spec.ts:54] — deferred, pre-existing

## Dev Notes

- **Reduced Motion Simulation in Playwright:**
  You can emulate OS-level reduced motion using:
  ```typescript
  await page.emulateMedia({ reducedMotion: 'reduce' });
  ```
- **Screen Reader Bypass Testing:**
  Ensure the elements targeted by the Screen Reader Bypass have `aria-hidden="true"` and that the screen-reader-only text element is present:
  ```typescript
  const postRow = page.locator('div[class*="postRowWrapper"]', { hasText: uniqueTitle });
  const srOnlyText = postRow.locator('[class*="srOnly"]');
  await expect(srOnlyText).toBeVisible();
  
  const rankCol = postRow.locator('[class*="colRank"]');
  await expect(rankCol).toHaveAttribute('aria-hidden', 'true');
  ```

### Project Structure Notes

- E2E tests are located in `tests/e2e/`.
- Ensure new test cases are fully isolated and clean up state/cookies properly using `beforeEach`.
- Do NOT use Tailwind CSS. Only use vanilla CSS variables.

### References

- [PRD - Accessibility (The Safe-Chaos Protocol)](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L308)
- [PRD - NFR-A1: prefers-reduced-motion](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L310)
- [PRD - NFR-A2: Screen Reader Bypass](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L311)
- [UX Design Specification - The \"Safe-Chaos\" Paradigm](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L404)
- [Leaderboard Grid Component](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx)
- [Evasive Button Component](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx)

## Dev Agent Record

### Agent Model Used

Antigravity (Gemini 3.5 Flash (High))

### Debug Log References

- Playwright E2E test task-171 log: `.system_generated/tasks/task-171.log`

### Completion Notes List

- Verified and consolidated prefers-reduced-motion CSS media query overrides in globals.css, EvasiveButton.module.css, AdCaptchaModal.module.css, LeaderboardGrid.module.css, and CommentSection.module.css.
- Added prefers-reduced-motion overrides in profile.module.css and profile-public.module.css to disable hover transformations, transitions, and text animations.
- Fixed keyboard navigation bypass in AdCaptchaModal.tsx by ensuring the "Skip Ad" button stays in place if it has focus.
- Implemented and passed all 4 Playwright E2E test cases in accessibility-safe-chaos.spec.ts covering reduced motion for EvasiveButton/AdCaptchaModal, Screen Reader Bypass markup (srOnly text visible and original elements aria-hidden), and Keyboard bypass for EvasiveButton.

### File List

- apps/frontend/src/app/profile/[username]/profile-public.module.css
- apps/frontend/src/app/profile/profile.module.css
- apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx
- tests/e2e/accessibility-safe-chaos.spec.ts

## Change Log

### [2026-05-22] Story Completed
- Resolved all code review patches (TypeScript strict type safety, SSR checks, and ref protection).
- Successfully validated 4/4 Playwright E2E tests and updated status to done.

### [2026-05-22] Story Completed & Under Review
- Implemented EvasiveButton/AdCaptchaModal keyboard focus bypass, consolidated prefers-reduced-motion CSS overrides, created E2E tests, and marked story as review.

### [2026-05-22] Story Created
- Created Story 4.4 to consolidate accessibility protocols, reduced-motion overrides, and automated E2E tests.
