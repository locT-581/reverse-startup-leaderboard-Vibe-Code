---
story_id: 2.1
story_key: 2-1-hostile-input-content-creation
epic_num: 2
story_num: 1
epic_title: The Core Chaos - Posting, Voting & Mercy
story_title: Hostile Input & Content Creation
status: done
---

# Story 2.1: Hostile Input & Content Creation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Chaos Engineer (Poster),
I want to submit problems and solutions,
so that I can participate in the community, even though the system fights me.

## Acceptance Criteria

1. **Given** a user is creating a post or comment:
   - **When** they interact with the `HostileInput` text area or input field
   - **Then** the component validates input in real-time and rejects standard inputs, highlighting errors in "Penalty Red" (`#ef4444` or dynamic theme color).
2. **Given** a user is creating a post:
   - **When** the title has less than 10 characters OR does not contain at least 2 buzzwords/jargon words from the list: `['synergy', 'paradigm', 'bandwidth', 'leverage', 'monetize', 'disruptive', 'deliverables', 'kpi', 'okr', 'cloud-native', 'game-changer', 'circle back', 'touch base', 'low-hanging fruit', 'deep dive', 'microservices', 'ecosystem', 'scalability', 'scale', 'pivoting', 'pivot']` (case-insensitive)
   - **Then** the input displays a passive-aggressive error: `"Your title lacks sufficient synergy. Please leverage additional paradigms."` or similar.
3. **Given** a user is creating a post:
   - **When** the content has less than 50 characters OR does not contain at least 3 jargon words from the list
   - **Then** the input displays a passive-aggressive error: `"This explanation is dangerously legible. Inject more synergy."` or similar.
4. **Given** a user is submitting a solution comment to an existing post:
   - **When** the comment length (in characters) is less than or equal to the original post length
   - **Then** the form rejects the submission and displays a passive-aggressive error: `"Your solution has insufficient volume. It must strictly exceed the original post's length of [X] characters."`
5. **Given** the frontend client:
   - **When** a user clicks on a post in the leaderboard
   - **Then** the post row expands to show the full post content, the list of associated comments, and a comment creation form with a `HostileInput` component.
6. **Given** the backend:
   - **When** a new post is created via the `/posts` endpoint
   - **Then** the backend calculates the initial "Wasted Calories" score using the existing `calculateScoreHelper` and saves it.
   - **And** broadcasts the updated leaderboard list via WebSockets on room `leaderboard.updated`.
7. **Given** the backend:
   - **When** a new comment is created via the `/posts/:id/comments` endpoint
   - **Then** the backend calculates the "Wasted Calories" score for the comment, saves it, and broadcasts the updated leaderboard list (containing the post with comments) via WebSockets.

## Tasks / Subtasks

-- [x] Task 1: Database Schema & Relations Updates (AC: 6, 7)
  - [x] Add the `comments` table to `apps/backend/db/schema.ts` with columns: `id`, `postId` (cascade onDelete), `content`, `wastedCalories`, `authorId` (cascade onDelete), `createdAt`, and `updatedAt`.
  - [x] Configure `commentsRelations` in `schema.ts`.
  - [x] Update `usersRelations` and `postsRelations` in `schema.ts` to support many-to-one and one-to-many comment relationships.
  - [x] Run migration using `drizzle-kit push` (or backend script equivalent if configured) to sync the PostgreSQL database schema.
- [x] Task 2: Backend Posts & Comments Modules (AC: 6, 7)
  - [x] Create a `PostsModule` containing controllers and services to handle `POST /posts` (creating a post) and `POST /posts/:id/comments` (creating a comment).
  - [x] Protect these endpoints with the existing `JwtAuthGuard` to extract the authenticated user.
  - [x] In `PostsService`, use `calculateScoreHelper` to determine and store the score for both posts and comments.
  - [x] Inject `LeaderboardService` in `PostsService` to call `broadcastUpdate()` whenever a new post or comment is successfully saved.
  - [x] Update `LeaderboardService` to fetch and include comments (with author information) when constructing the leaderboard payload.
  - [x] Register `PostsModule` in `apps/backend/src/app.module.ts`.
- [x] Task 3: Frontend Server Actions & HostileInput Component (AC: 1, 2, 3, 4)
  - [x] Create `apps/frontend/src/domains/leaderboard/components/HostileInput.tsx` to handle custom textareas/inputs with real-time jargon and length validations.
  - [x] Implement style `HostileInput.module.css` using the project's CSS variables, showing the "Penalty Red" color theme for active validation errors.
  - [x] Create frontend Server Actions in `apps/frontend/src/app/actions/posts.ts`: `actionCreatePost` and `actionCreateComment`.
- [x] Task 4: Frontend UI Integration & Leaderboard Expansion (AC: 5)
  - [x] Create `apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx` containing the post creation form using the `HostileInput` components.
  - [x] Modify `apps/frontend/src/app/page.tsx` to display a "Propose Paradigm" button, which opens the `CreatePostModal` when clicked (requires authentication check).
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx` to enable clicking a row to expand it.
  - [x] Render the expanded view containing full content, comments list, and the comment form utilizing the `HostileInput` component.
- [x] Task 5: Testing & Verification (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Create backend unit tests in `tests/unit/backend/posts/posts.service.spec.ts` verifying posts/comments insertion and correct score calculations.
  - [x] Create Playwright E2E tests in `tests/e2e/hostile-input.spec.ts` validating interactive validations (jargon checks, length limits) and form submissions on the frontend.

### Review Findings

- [x] [Review][Decision] Deviation from modal-based post creation design specified in story subtasks — Story Task 4 specifies creating a `CreatePostModal.tsx` and displaying a "Propose Paradigm" button that opens this modal. Instead, the implementation renders a `ProposeParadigmForm.tsx` inline on the homepage.
- [x] [Review][Patch] Missing type validation in `countBuzzwords` on backend [apps/backend/src/posts/posts.service.ts:263]
- [x] [Review][Patch] WebSocket broadcast failure halts post/comment creation [apps/backend/src/posts/posts.service.ts:313]
- [x] [Review][Patch] Substring/overlapping match issues in buzzword counting logic [apps/backend/src/posts/posts.service.ts:263]
- [x] [Review][Patch] Whitespace-only strings can bypass min-length checks [apps/backend/src/posts/posts.service.ts:277]
- [x] [Review][Patch] CSS transitions/transforms do not respect prefers-reduced-motion in CommentSection.module.css [apps/frontend/src/domains/leaderboard/components/CommentSection.module.css:728]8]

## Dev Notes

- **Aesthetics & Styling**:
  - Keep the Hyper-Modern light theme look for forms, with borders shifting to Penalty Red (`#ef4444`) on validation error.
  - Passive-aggressive tooltip messages should appear directly below the fields.
  - STRICTLY NO Tailwind CSS. All frontend styling uses Vanilla CSS modules and CSS variables (Chaos Tokens).
- **Accessibility & Motion**:
  - Underlying HTML must be semantic and pass accessibility audits (WCAG AA).
  - Respect prefers-reduced-motion: No animations or transitions should fire if the setting is active.
  - Implement Screen Reader Bypass so visually hidden labels help screen readers parse the form logic easily.
- **Project Structure**:
  - Keep Next.js page components routing-only, moving custom UI components to `src/domains/leaderboard/components/`.
  - Backend modules reside in `apps/backend/src/`.
- **References**:
  - [PRD - Content Creation & Engagement](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#Content%20Creation%20&%20Engagement)
  - [UX Design - Color System](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#Color%20System)
  - [Architecture - API & Communication Patterns](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#API%20&%20Communication%20Patterns)
  - [Previous Story - Real-time Leaderboard View & Badges](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/1-4-real-time-leaderboard-view-badges.md)

## Dev Agent Record

### Agent Model Used

Gemini 1.5 Pro (Antigravity)

### Debug Log References

### Completion Notes List

### File List
