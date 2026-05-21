# Deferred Work

## Deferred from: code review of 1-2-user-authentication-profile-management.md (2026-05-20)

- Bỏ qua chuyển hướng middleware bằng cookie ảo [apps/frontend/src/middleware.ts:1] — Kẻ tấn công hoặc người dùng có thể đặt cookie `token` giả để vượt qua middleware redirect truy cập trang `/profile`. Thiết kế hiện tại chỉ kiểm tra sự tồn tại của cookie.

## Deferred from: code review of 1-3-core-leaderboard-data-engine.md (2026-05-21)

- Lack of HTML Sanitization in Leaderboard Post Content [apps/backend/db/schema.ts:18] — The leaderboard schema registers raw user posts but does not sanitize HTML content. This could expose the frontend to XSS attacks in future features unless input is sanitized on insertion or output is sanitized in components.

## Deferred from: code review of 1-4-real-time-leaderboard-view-badges.md (2026-05-21)

- Missing transition animations for first-place badge status change [apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx:102] — When the leaderboard receives a WebSocket update that re-orders the rank, the Golden Raspberry badge immediately shifts position without transition styling or announcement.

## Deferred from: code review of 2-2-the-ad-captcha-challenge.md (2026-05-21)

- Persistent error message after Skip Ad click [apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx:436] — When clicking the "Skip Ad" button, a "Skip failed!" message is shown. This error remains visible even when the user types a matching string, until the form is submitted.


