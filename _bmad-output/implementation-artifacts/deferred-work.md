# Deferred Work

## Deferred from: code review of 1-2-user-authentication-profile-management.md (2026-05-20)

- Bỏ qua chuyển hướng middleware bằng cookie ảo [apps/frontend/src/middleware.ts:1] — Kẻ tấn công hoặc người dùng có thể đặt cookie `token` giả để vượt qua middleware redirect truy cập trang `/profile`. Thiết kế hiện tại chỉ kiểm tra sự tồn tại của cookie.

## Deferred from: code review of 1-3-core-leaderboard-data-engine.md (2026-05-21)

- Lack of HTML Sanitization in Leaderboard Post Content [apps/backend/db/schema.ts:18] — The leaderboard schema registers raw user posts but does not sanitize HTML content. This could expose the frontend to XSS attacks in future features unless input is sanitized on insertion or output is sanitized in components.

## Deferred from: code review of 1-4-real-time-leaderboard-view-badges.md (2026-05-21)

- Missing transition animations for first-place badge status change [apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx:102] — When the leaderboard receives a WebSocket update that re-orders the rank, the Golden Raspberry badge immediately shifts position without transition styling or announcement.

## Deferred from: code review of 2-2-the-ad-captcha-challenge.md (2026-05-21)

- Persistent error message after Skip Ad click [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:436] — When clicking the "Skip Ad" button, a "Skip failed!" message is shown. This error remains visible even when the user types a matching string, until the form is submitted.

## Deferred from: code review of 2-3-the-evasive-vote-button.md (2026-05-21)

- Missing E2E Test coverage for Touch Relocation Latency [tests/e2e/evasive-vote.spec.ts:1] — The Playwright test does not assert that touch-based evasion occurs with latency < 50ms, nor does it emulate touch relocations. (Deferred as it's a test quality enhancement rather than a functional bug).

## Deferred from: code review of 2-4-anti-ux-tracker-mercy-threshold.md (2026-05-21)

- Client-side Cookie Manipulation during Register/Login [apps/frontend/src/app/actions/auth.ts:51] — Server Action sets cookies correctly, but client router cache needs a hard refresh or sync for instant auth visibility. Deferred as authentication functionality works as intended.

## Deferred from: code review of 3-3-real-time-sabotage-broadcast.md (2026-05-22)

- NestJS Circular Dependency between Leaderboard and Sabotage [apps/backend/src/sabotage/sabotage.module.ts:80] — resolved via forwardRef, pre-existing
- No Backend Persistence of Active Sabotage Effects [apps/backend/src/sabotage/sabotage.service.ts:190] — Visual distortion active state is not persisted on the backend database, meaning effects do not survive page reloads. This meets acceptance criteria but could be improved, pre-existing

## Deferred from: code review of 4-2-visual-penalties-the-clown-hat.md (2026-05-22)

- Duplicate CSS Keyframe Animations [profile.module.css:81, CommentSection.module.css:76, LeaderboardGrid.module.css:168] — `@keyframes wiggle` is duplicated verbatim in profile.module.css, CommentSection.module.css, and LeaderboardGrid.module.css, pre-existing
- Inconsistent CSS Positioning Units for Clown Hat Overlay [LeaderboardGrid.module.css:154, CommentSection.module.css:48] — The clown hat positioning offsets use pixel values (top, right), but the size (font-size) is defined in rem. This could lead to misalignment when browser text zoom scales, pre-existing
