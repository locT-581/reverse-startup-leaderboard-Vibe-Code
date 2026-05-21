---
story_id: 2.2
story_key: 2-2-the-ad-captcha-challenge
epic_num: 2
story_num: 2
epic_title: The Core Chaos - Posting, Voting & Mercy
story_title: The Ad Captcha Challenge
status: done
---

# Story 2.2: The Ad Captcha Challenge

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to submit my completed form,
so that my content is published to the leaderboard.

## Acceptance Criteria

1. **Given** a user has successfully passed the Hostile Input validation:
   - **When** they click to finally submit a post (in `CreatePostModal.tsx`) or comment (in `CommentSection.tsx`)
   - **Then** an "Ad Captcha" modal (`AdCaptchaModal.tsx`) appears, intercepting the form submission.
2. **Given** the "Ad Captcha" modal is open:
   - **Then** it displays a randomized/sequential sponsored message (from a pre-defined list of at least 3 funny, corporate buzzword-heavy ad lines).
   - **And** it displays a text input area for the user to manually type out the sponsored message.
   - **And** it displays a "Skip Ad" button that evades the user's cursor on hover/approach, making it mathematically impossible to click via normal mouse movement.
3. **Given** the "Skip Ad" button is focused or clicked:
   - **When** the user clicks "Skip Ad" (e.g., via keyboard navigation or a simulated click event)
   - **Then** it displays a new, different sponsored message, forcing the user into a recursive loop of ad captchas.
4. **Given** the user is typing the sponsored message:
   - **When** the user's input does not exactly match the sponsored message (case-sensitive, matching spaces and punctuation)
   - **Then** the "Verify & Submit" button remains disabled, and an error indicator is shown.
5. **Given** the user's input matches the sponsored message exactly:
   - **When** they click the "Verify & Submit" button
   - **Then** the modal closes, the actual form submission is fired (calling `actionCreatePost` or `actionCreateComment`), and the parent form's state is reset.
6. **Given** the frontend client:
   - **When** `prefers-reduced-motion` is active
   - **Then** the "Skip Ad" button must NOT move or evade the cursor, to comply with accessibility rules (Safe-Chaos).

## Tasks / Subtasks

- [x] Task 1: Create the Ad Captcha Component & Styling (AC: 1, 2, 3, 4, 6)
  - [x] Create `apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx` as a Client Component (`"use client"`).
  - [x] Implement a list of funny corporate sponsor ads (e.g., SynergyCoin, Paradigmer.io, MoonScale.io).
  - [x] Create styling in `apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css` using Vanilla CSS (strict separation of concerns, absolute positioning, responsive modal layout).
  - [x] Add the text validation matching logic (exact string matching, trim whitespace).
  - [x] Implement the "Skip Ad" button evasion physics using `onMouseEnter` or `onMouseMove` events. Adjust position variables using inline styles/CSS variables (`--skip-x`, `--skip-y`) to avoid React re-renders and maintain 60fps performance.
  - [x] Implement recursive ad cycling when "Skip Ad" is successfully clicked.
  - [x] Integrate accessibility fallback using `@media (prefers-reduced-motion: reduce)` to disable evasion.
- [x] Task 2: Integrate Ad Captcha into Post Creation (AC: 1, 5)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx` to import and render `AdCaptchaModal`.
  - [x] Add state tracking to defer the `actionCreatePost` execution until the captcha is successfully solved.
  - [x] Ensure that when the captcha is completed, the modal is hidden, the Server Action is fired, and any server errors/successes are displayed correctly.
- [x] Task 3: Integrate Ad Captcha into Comment Submission (AC: 1, 5)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx` to import and render `AdCaptchaModal`.
  - [x] Defer the `actionCreateComment` call until the captcha is successfully solved.
- [x] Task 4: Testing & Verification (AC: 1, 2, 3, 4, 5, 6)
  - [x] Create Playwright E2E tests in `tests/e2e/ad-captcha.spec.ts`.
  - [x] Verify form submission interception, exact match checking, evasion on hover, recursive ad looping, and reduced motion accessibility.

### Review Findings

- [x] [Review][Patch] Hydration Mismatch in AdCaptchaModal [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:351]
- [x] [Review][Patch] Missing input whitespace trimming [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:360]
- [x] [Review][Defer] Persistent error message after Skip Ad click [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:436] — deferred, pre-existing

## Dev Notes

- **Anti-UX Isolation**:
  - Keep all evasion logic and modal complexity within `apps/frontend/src/domains/anti-ux/components/`. Do not pollute shared UI components with this logic.
- **Aesthetics & Theme**:
  - Style the captcha modal as a premium modern card (border-radius: 12px, soft drop shadow, clean typography) to make the subsequent frustration even more jarring.
  - Use Penalty Red `#ef4444` for match errors or warning indicators.
- **Performance**:
  - Do not trigger state changes on every pixel movement of the cursor. Use inline CSS Custom Properties for offsets.
- **Future Hookability**:
  - Make sure `AdCaptchaModal` accepts a bypass prop or check. When Story 2.4 (Mercy Threshold) is implemented, it will need to disable or simplify the captcha if the Mercy Mode toggle is active.
- **References**:
  - [PRD - FR6](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L254)
  - [UX Spec - Interstitial Labor](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L206)
  - [UX Spec - The Ad Captcha Interstitial](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L373)
  - [Architecture - Consistency Rules](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L175)
  - [Previous Story - Hostile Input](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/2-1-hostile-input-content-creation.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

None

### Completion Notes List

- Designed and implemented the `AdCaptchaModal` containing randomized ads, text verification, recursive loop cycling, and inline CSS custom property-based evasive buttons.
- Integrated the modal into post and comment creation forms to properly intercept submissions.
- Fixed a race condition where randomizing the ad index on open caused the text to fluctuate and fail E2E tests by shifting randomization to the close trigger.
- Authored a comprehensive E2E suite verifying validation constraints, skip button evasion mechanics, recursive cycling, and accessibility overrides.

### File List

- [AdCaptchaModal.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx)
- [AdCaptchaModal.module.css](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css)
- [CreatePostModal.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx)
- [CommentSection.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx)
- [ad-captcha.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/e2e/ad-captcha.spec.ts)
- [posts.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/e2e/posts.spec.ts)
