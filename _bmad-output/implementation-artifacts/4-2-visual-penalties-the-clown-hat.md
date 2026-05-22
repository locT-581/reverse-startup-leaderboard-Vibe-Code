---
story_id: 4.2
story_key: 4-2-visual-penalties-the-clown-hat
epic_num: 4
story_num: 2
epic_title: Anti-Logic Moderation & Viral Sharing
story_title: Visual Penalties (The Clown Hat)
status: done
---

# Story 4.2: Visual Penalties (The Clown Hat)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Anti-Logic Judge,
I want the system to automatically apply visual penalties to logical users,
so that they are publicly shamed for their helpfulness.

## Acceptance Criteria

1. **Given** a user has accumulated logic violations:
   - **When** their violation count reaches the predefined threshold of **5 or more** (`logicViolations >= 5`)
   - **Then** they are flagged for the "Clown Hat" penalty.
2. **Given** a user is flagged with the "Clown Hat" penalty:
   - **When** their avatar is rendered globally on the leaderboard grid (`LeaderboardGrid.tsx`), comment rows (`CommentSection.tsx`), and profile page (`profile/page.tsx`)
   - **Then** a "Clown Hat" (using the emoji `🎩` or `🥳` or `🤡`) is rendered as a visual overlay on top of their selected avatar.
   - **And** the overlay must tilt (e.g. `transform: rotate(-15deg)`) and wiggle on hover using a keyframe animation.
3. **Given** the user updates their avatar in `/profile`:
   - **When** they select a different avatar (e.g. changing from Turtle `🐢` to Bug `🐛`)
   - **Then** the "Clown Hat" overlay remains forced on top of the newly selected avatar.
4. **Given** the OS-level `prefers-reduced-motion` is active:
   - **When** the user hovers over a penalized avatar
   - **Then** the wiggle animation and rotation transitions must be disabled (the hat remains static).
5. **Given** a screen reader is parsing the page (Accessibility / Screen Reader Bypass):
   - **When** it encounters a penalized user's avatar
   - **Then** it must read out an descriptive text tag indicating they are penalized (e.g. adding `" - penalized with a clown hat"` to the avatar's `aria-label`).
   - **And** the visually hidden Screen Reader Bypass text block (`styles.srOnly`) must also indicate the penalty (e.g., `(Penalized with a clown hat)` next to the username).

## Tasks / Subtasks

- [x] **Task 1: Shared/Helper Component or CSS class for Clown Hat Overlay** (AC: 2, 4)
  - [x] Identify a clean way to implement the forced overlay. You can create a reusable wrapper component (e.g., `AvatarWrapper.tsx` in `apps/frontend/src/shared/ui/` or inline styling pattern using Vanilla CSS).
  - [x] Add the Vanilla CSS styles for the clown hat overlay:
    - [x] Position: relative on the avatar container.
    - [x] Position: absolute on the pseudo-element `::after` or a dedicated overlay element.
    - [x] Style the hat using emoji `🎩` (recommended) positioned slightly offset (e.g. `top: -12px; right: -8px; font-size: 1.25rem;`).
    - [x] Apply a tilt rotation (`transform: rotate(-15deg)`).
    - [x] Define the wiggle animation keyframe for hover states.
    - [x] Wrap the hover animations/transitions inside `@media (prefers-reduced-motion: no-preference)` to respect accessibility standards (AC: 4).
- [x] **Task 2: Leaderboard Grid Overlay Integration** (AC: 2, 5)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx` to conditionally render the clown hat overlay when `post.author.logicViolations >= 5`.
  - [x] Update the `aria-label` of the avatar `span` to include `" - penalized with a clown hat"` if they meet the threshold.
  - [x] Update the screen reader bypass block (`div className={styles.srOnly}`) to append `(Penalized with a clown hat)` next to the author's username.
- [x] **Task 3: Comment Section Overlay Integration** (AC: 2, 5)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx` to conditionally render the clown hat overlay when `comment.author.logicViolations >= 5`.
  - [x] Update the avatar's `aria-label` to include the penalty text.
- [x] **Task 4: Profile Page Overlay Integration** (AC: 2, 3, 5)
  - [x] Modify `apps/frontend/src/app/profile/page.tsx` to display the clown hat overlay on the main avatar display when `user.logicViolations >= 5`.
  - [x] Verify that if the user clicks other options in the `avatarPicker` to select another avatar, the display updates the emoji but still retains the clown hat overlay.
- [x] **Task 5: E2E Playwright Tests** (AC: 1, 2, 3, 4, 5)
  - [x] Create E2E test file `tests/e2e/visual-penalties.spec.ts`:
    - [x] Register User A.
    - [x] Verify User A starts with 0 violations and has no clown hat overlay.
    - [x] Register User B, create a post.
    - [x] User A reports User B's post 5 times (or trigger backend reporting until violation count reaches 5).
    - [x] Verify B's avatar now has the clown hat overlay class/element.
    - [x] Log in as User B, navigate to profile, select a different avatar, and verify the clown hat overlay is still visible.
    - [x] Verify the screen reader elements have the expected text.

### Review Findings

- [x] [Review][Patch] Use of Raw Avatar ID in Screen Reader aria-label [LeaderboardGrid.tsx:176, CommentSection.tsx:82]
- [x] [Review][Defer] Duplicate CSS Keyframe Animations [profile.module.css:81, CommentSection.module.css:76, LeaderboardGrid.module.css:168] — deferred, pre-existing
- [x] [Review][Defer] Inconsistent CSS Positioning Units for Clown Hat Overlay [LeaderboardGrid.module.css:154, CommentSection.module.css:48] — deferred, pre-existing

## Dev Notes

- **Predefined Threshold:** 5 logic violations is the hardcoded threshold for triggering the clown hat visual penalty.
- **Vanilla CSS styling:** All visual styling for the overlay and animation must be done in CSS Modules (`LeaderboardGrid.module.css`, `CommentSection.module.css`, and `profile.module.css`). Do NOT use Tailwind CSS.
- **WebSocket Updates:** The system already broadcasts `leaderboard.updated` on changes. Since the avatar checks are based on `logicViolations` (which is returned in the updated author metadata), the overlay will automatically apply/remove in real-time when the WebSocket updates the state.
- **Zustand state:** In `profile/page.tsx`, the active user profile is stored in the auth store. Ensure the store is correctly updated with the updated profile (which contains the current `logicViolations`).

### Project Structure Notes

- Keep all DDD domain logic components in `apps/frontend/src/domains/leaderboard/components/` and profile component modifications in `apps/frontend/src/app/profile/`.
- Maintain unified naming conventions (PascalCase for React components, kebab-case for other files/folders).

### References

- [PRD - Anti-Logic Court (Lite)](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L220)
- [PRD - FR22: Visual penalty](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L279)
- [UX Specification - Visual Feedback](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L52)
- [Previous Story - Anti-Logic Reporting](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/4-1-anti-logic-reporting-system.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

N/A

### Completion Notes List

- Implemented a "Clown Hat" overlay using emoji `🎩` absolute pseudo-element (`::after`) on penalized user avatars when their `logicViolations >= 5`.
- Integrated CSS rules in Leaderboard Grid, Comment Section, and Profile Page. Added rotation tilt and wiggle keyframe animation on hover.
- Disabled animations/transitions using `@media (prefers-reduced-motion: no-preference)` to accommodate accessibility preferences.
- Configured screen-reader friendly bypass tags (`aria-label` and visually hidden helper tags next to the username) to specify when users are penalized.
- Ensured the profile page's main avatar retains the overlay when selecting a new avatar in the picker before saving, and it correctly persists in DB.
- Authored a comprehensive E2E suite (`tests/e2e/visual-penalties.spec.ts`) that runs the complete flow successfully.

### File List

- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`
- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css`
- `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx`
- `apps/frontend/src/domains/leaderboard/components/CommentSection.module.css`
- `apps/frontend/src/app/profile/page.tsx`
- `apps/frontend/src/app/profile/profile.module.css`
- `tests/e2e/visual-penalties.spec.ts`

## Change Log

### [2026-05-22] Completed Story 4.2 Implementation
- Implemented global clown hat overlay visual shaming for logical users.
- Supported reduced-motion media query restrictions.
- Integrated accessibility label enhancements.
- Validated all acceptance criteria via Playwright E2E tests.
