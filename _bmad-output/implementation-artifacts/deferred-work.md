# Deferred Work

## Deferred from: code review of 1-2-user-authentication-profile-management.md (2026-05-20)

- Bỏ qua chuyển hướng middleware bằng cookie ảo [apps/frontend/src/middleware.ts:1] — Kẻ tấn công hoặc người dùng có thể đặt cookie `token` giả để vượt qua middleware redirect truy cập trang `/profile`. Thiết kế hiện tại chỉ kiểm tra sự tồn tại của cookie.
