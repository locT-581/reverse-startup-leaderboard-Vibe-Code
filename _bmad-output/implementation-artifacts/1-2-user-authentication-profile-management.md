---
story_id: 1.2
story_key: 1-2-user-authentication-profile-management
epic_num: 1
story_num: 2
epic_title: The Foundation - Identity & Leaderboard
story_title: User Authentication & Profile Management
status: done
---

# Story 1.2: User Authentication & Profile Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to create an account and manage my profile,
so that my identity and ranking can be tracked on the platform.

## Acceptance Criteria

1. **Given** an unauthenticated user on the auth page
   - **When** they submit valid registration credentials (username and password)
   - **Then** a new user is created in the database with a hashed password, and they are authenticated securely via JWT.
2. **Given** an unauthenticated user on the auth page
   - **When** they submit valid login credentials
   - **Then** they should be authenticated securely via JWT and redirected to the home/leaderboard page.
3. **Given** an authenticated user
   - **When** they access the profile page
   - **Then** they can view their username and current avatar.
   - **And** they can update their basic profile details (username, avatar) in the database.
4. **Given** an authenticated user
   - **When** they request to update their username to an already existing username
   - **Then** they should see a passive-aggressive validation error and the change should be rejected.

## Tasks / Subtasks

- [ ] Task 1: Database Schema Expansion (AC: 1, 3, 4)
  - [ ] Add the `users` table definition to `apps/backend/db/schema.ts` using Drizzle ORM.
  - [ ] Map `snake_case` database column names to `camelCase` TypeScript properties.
  - [ ] Create and run migration to apply changes to the PostgreSQL database.
- [ ] Task 2: Backend Auth Module (AC: 1, 2, 3, 4)
  - [ ] Install dependencies in the backend: `pnpm --filter backend add @nestjs/jwt bcrypt` and devDependencies: `pnpm --filter backend add -D @types/bcrypt`.
  - [ ] Implement `AuthModule`, `AuthService`, and `AuthController` in `apps/backend/src/auth/`.
  - [ ] Inject the database connection into `AuthService` using `@Inject(DRIZZLE)` (from globally exported `DatabaseModule`) instead of statically importing `db` from `db/index.ts` to follow the NestJS Dependency Injection pattern from Story 1.1.
  - [ ] Setup password hashing with `bcrypt` (10 salt rounds).
  - [ ] Define endpoints:
    - `POST /auth/register` (registers a new user, returns JWT and user profile)
    - `POST /auth/login` (verifies credentials, returns JWT and user profile)
    - `GET /auth/me` (uses JWT Guard to return current authenticated user profile)
    - `PUT /auth/profile` (uses JWT Guard to update username and avatar)
- [ ] Task 3: Next.js Server Actions & Session Management (AC: 1, 2, 3, 4)
  - [ ] Create `apps/frontend/src/app/actions/auth.ts` (or `apps/frontend/src/app/actions.ts`).
  - [ ] Implement typed actions: `actionRegister`, `actionLogin`, `actionUpdateProfile`, `actionLogout`.
  - [ ] Server actions must strictly return `ActionResponse<T>`: `{ success: boolean; data?: T; error?: { message: string; code?: string } }`.
  - [ ] Manage authentication session using HTTP-only cookies (`token`) set/cleared during Server Actions.
  - [ ] Return passive-aggressive, humorous error messages in the `error` object on failure instead of throwing raw exceptions.
- [ ] Task 4: Zustand Auth Store (AC: 1, 2, 3)
  - [ ] Create `apps/frontend/src/core/store/useAuthStore.ts`.
  - [ ] Group state (`user`, `isAuthenticated`) and actions (`setUser`, `logout`) inside the same store.
- [ ] Task 5: Auth & Profile Frontend Pages (AC: 1, 2, 3, 4)
  - [ ] Create a client component auth page at `apps/frontend/src/app/auth/page.tsx` with a clean Vanilla CSS layout (`auth.module.css`).
  - [ ] Auth page must toggle between Login and Register modes, utilizing `useFormStatus` or `useTransition` for loading states.
  - [ ] Create a client component profile page at `apps/frontend/src/app/profile/page.tsx` with form fields for username and avatar selector, styled with CSS modules (`profile.module.css`).
  - [ ] Highlight validation errors in "Penalty Red" and render passive-aggressive error states.
- [ ] Task 6: Authentication Guard Middleware (AC: 3)
  - [ ] Update Next.js middleware in `apps/frontend/src/middleware.ts` to protect the `/profile` route (redirect to `/auth` if no valid token cookie is present).
- [ ] Task 7: Unit & E2E Verification (AC: 1, 2, 3, 4)
  - [ ] Create unit tests for backend `AuthService` in `tests/unit/backend/auth/auth.service.spec.ts`.
  - [ ] Create a Playwright E2E test in `tests/e2e/auth.spec.ts` to verify the full register, login, profile view, profile update, and logout flows.

### Review Findings

- [x] [Review][Decision] Bỏ qua chuyển hướng middleware bằng cookie ảo — Kẻ tấn công hoặc người dùng có thể đặt cookie `token` giả để vượt qua middleware redirect truy cập trang `/profile`. Thiết kế hiện tại chỉ kiểm tra sự tồn tại của cookie. Ta có nên triển khai xác thực chữ ký JWT đầy đủ ở middleware không? Điều này sẽ yêu cầu một thư viện runtime-compatible như `jose` vì Next.js middleware chạy trên Edge runtime.
- [x] [Review][Patch] Bỏ qua thuộc tính media prefers-reduced-motion đối với hiệu ứng rung của thông báo lỗi [apps/frontend/src/app/auth/auth.module.css:159]
- [x] [Review][Patch] Khóa JWT bí mật mặc định (Hardcoded fallback secret) trong môi trường production [apps/backend/src/auth/auth.module.ts:12]
- [x] [Review][Patch] Lỗi database chưa được xử lý (Unhandled unique constraint violation) khi đăng ký trùng username [apps/backend/src/auth/auth.service.ts:37]
- [x] [Review][Patch] Thiếu kiểm tra độ dài/độ mạnh mật khẩu ở phía backend [apps/backend/src/auth/auth.service.ts:13]
- [x] [Review][Patch] Hiện tượng màn hình trắng (flash) khi tải lại trang Profile [apps/frontend/src/app/profile/page.tsx:99]
- [x] [Review][Patch] Kiểu ActionResponse không khớp hoàn toàn với thiết kế trong Spec [apps/frontend/src/app/actions/auth.ts:15]
- [x] [Review][Defer] Bỏ qua chuyển hướng middleware bằng cookie ảo [apps/frontend/src/middleware.ts:1] — deferred, pre-existing

## Dev Notes

### Unified Project Structure & Naming Conventions

- **Database Mapping:** Use `snake_case` for database tables/columns (e.g., `users`, `password_hash`) but MUST map to `camelCase` in TypeScript/Drizzle (e.g., `passwordHash`).
- **File/Folder Naming:** Use `kebab-case` for all folders and files (e.g., `use-auth-store.ts`, `app/auth/page.tsx`), EXCEPT for React Component files which MUST use `PascalCase`.
- **Import Aliases:** Use path aliases `@/*` for absolute imports in Next.js.
- **Styling Solution:** Strict use of Vanilla CSS variables and CSS modules. **Absolutely NO Tailwind CSS**.

### Database schema details to add in `apps/backend/db/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar").default("default_avatar"),
  wastedCalories: integer("wasted_calories").default(0).notNull(),
  logicViolations: integer("logic_violations").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Next.js Server Action Responses

All Next.js Server Actions MUST return a typed object matching:

```typescript
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
};
```

DO NOT throw exceptions in Server Actions. Return them inside the response object.

### Zustand State management

Store files must be named `use[Feature]Store.ts` (e.g., `useAuthStore.ts`). Keep mutations inside the store definition.

### React Loading States

Avoid manual `isLoading` boolean states. Utilize React's `useFormStatus` or `useTransition` for forms and mutations.

### References

- [Source: planning-artifacts/architecture.md#Naming Naming Patterns]
- [Source: planning-artifacts/architecture.md#Structure Project Organization]
- [Source: planning-artifacts/architecture.md#Format API Response Formats]
- [Source: project-context.md#Language-Specific Rules]
- [Source: project-context.md#Framework-Specific Rules]

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

### Completion Notes List

### File List
