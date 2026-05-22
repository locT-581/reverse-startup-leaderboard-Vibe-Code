---
story_id: 4.1
story_key: 4-1-anti-logic-reporting-system
epic_num: 4
story_num: 1
epic_title: Anti-Logic Moderation & Viral Sharing
story_title: Anti-Logic Reporting System
status: done
---

# Story 4.1: Anti-Logic Reporting System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to report posts that are "too logical" or "too helpful",
so that we can maintain the platform's chaotic standard.

## Acceptance Criteria

1. **Given** a logged-in user on the Leaderboard page:
   - **When** they view any post on the `LeaderboardGrid`
   - **Then** they see a "Report Logic 🚨" button next to "Sabotage 😈" on each post row.
   - **And** each post author's active `logicViolations` count is displayed in their author metadata row (e.g. "Logic Violations: X" or next to the username).
2. **Given** the user clicks the "Report Logic 🚨" button:
   - **When** they are the author of the post (self-reporting)
   - **Then** the client-side/server action blocks the action and renders a sarcastic error message: `"Why are you reporting yourself? That's too logical, stop it!"`.
   - **And** no backend database changes are committed.
3. **Given** the user reports another user's post:
   - **When** they click "Report Logic 🚨"
   - **Then** the interface displays a pending state (disabling the button and/or showing a loading spinner) using React's `useTransition`.
   - **And** calls the Server Action `actionReportPost(postId)` to submit the report.
4. **Given** a report post request is processed on the backend:
   - **When** the backend receives the request at `POST /posts/:id/report`
   - **Then** it transactionally:
     - Verifies the post exists; throws `NotFoundException` if it doesn't.
     - Validates that the reporter (`req.user.sub`) is not the author of the post. If they are, throws a `BadRequestException` with the sarcastic message: `"Why are you reporting yourself? That's too logical, stop it!"`.
     - Increments the `logicViolations` count of the post author in the `users` table by 1.
     - Saves the updated record in the database.
   - **And** broadcasts the updated leaderboard to all clients via the Socket.io event `leaderboard.updated`.
5. **Given** the leaderboard selection query runs on the backend:
   - **When** `LeaderboardService.getLeaderboard()` is executed
   - **Then** the query must select `schema.users.logicViolations` for the post author and comment author.
6. **Given** the client is connected to Socket.io:
   - **When** a `leaderboard.updated` event is received
   - **Then** the leaderboard is updated instantly and the new `logicViolations` counts are reflected on the UI without manual page refresh.

## Tasks / Subtasks

- [x] **Task 1: Backend Database & Query Support** (AC: 5)
  - [x] Update `LeaderboardPost` type/interface in `apps/backend/src/leaderboard/leaderboard.service.ts` to include `logicViolations: number` under the `author` object.
  - [x] Modify the Drizzle query in `LeaderboardService.getLeaderboard()` to select `logicViolations: schema.users.logicViolations` in the `author` selection for both posts and comments.
- [x] **Task 2: Backend Report Endpoint & Controller** (AC: 4)
  - [x] Add `@Post(':id/report')` endpoint in `PostsController` (`apps/backend/src/posts/posts.controller.ts`) guarded by `JwtAuthGuard`.
  - [x] Implement `reportPost(userId: string, postId: string)` in `PostsService` (`apps/backend/src/posts/posts.service.ts`):
    - [x] Retrieve the target post. Throw `NotFoundException` if it doesn't exist.
    - [x] Assert that `post.authorId !== userId`. If they are the same, throw a `BadRequestException` with the payload `{ success: false, error: { message: "Why are you reporting yourself? That's too logical, stop it!" } }`.
    - [x] Transactionally increment the `logicViolations` of the author in the `users` table (`schema.users`).
    - [x] Call `this.leaderboardService.broadcastUpdate()` to broadcast the updated leaderboard to all connected Socket.io clients.
    - [x] Return `{ success: true, data: { postId, authorId: post.authorId, logicViolations: newViolationCount } }`.
- [x] **Task 3: Frontend Server Action** (AC: 3)
  - [x] Update frontend `LeaderboardPost` interface in `apps/frontend/src/app/actions/leaderboard.ts` to include `logicViolations: number` in the `author` details.
  - [x] Add `actionReportPost(postId: string): Promise<ActionResponse<any>>` in `apps/frontend/src/app/actions/posts.ts`:
    - [x] Retrieve jwt token from cookies. If missing, return error: `"You must be authenticated to report a post. Log in first!"`.
    - [x] Send `POST /posts/${postId}/report` fetch call.
    - [x] Parse and return standard `ActionResponse` object.
- [x] **Task 4: UI Changes & Styling** (AC: 1, 2, 3, 6)
  - [x] Update `LeaderboardGrid.tsx` (`apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`):
    - [x] Next to the "Sabotage 😈" button on each row, add a "Report Logic 🚨" button.
    - [x] Style the button using vanilla CSS in `LeaderboardGrid.module.css`. Strictly DO NOT use Tailwind CSS.
    - [x] Render the `logicViolations` count on the user metadata row (e.g. "🚨 X" or "Logic Violations: X") so users can see active count.
    - [x] Implement a click handler for "Report Logic 🚨":
      - [x] Use `useTransition` to capture the pending state.
      - [x] Call `actionReportPost(postId)`.
      - [x] If self-reporting is blocked or backend returns an error, set an error state on the row/grid to render the sarcastic error message.
- [x] **Task 5: E2E Playwright Tests** (AC: 1-6)
  - [x] Create E2E test file `tests/e2e/anti-logic-reporting.spec.ts`:
    - [x] Register User A and User B.
    - [x] User A submits a synergy-rich post.
    - [x] User B logs in, goes to leaderboard, clicks "Report Logic 🚨" on User A's post.
    - [x] Verify that User A's logic violations count updates dynamically in the UI.
    - [x] Log in as User A and attempt to report User A's own post. Verify that the self-reporting is blocked and the sarcastic error message is displayed.

### Review Findings

- [x] [Review][Patch] Race Condition on Reporting Status in LeaderboardGrid [apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx:486]
- [x] [Review][Patch] Unhandled Empty Result in Transaction Return [apps/backend/src/posts/posts.service.ts:261]
- [x] [Review][Patch] Fragile JWT Error Parsing for Unauthorized Requests [apps/frontend/src/app/actions/posts.ts:350]

## Dev Notes

- **Database schema**: The `logicViolations` column is already defined in the `users` table of `schema.ts`. We only need to fetch and increment it.
- **Vanilla CSS Variable compliance**: Ensure styling of the new button matches the Troll Capitalist/Hyper-Modern themes.
- **WebSocket updates**: When a report goes through, calling `leaderboardService.broadcastUpdate()` will cause `LeaderboardGateway.broadcastLeaderboard()` to emit the `leaderboard.updated` event containing the freshly sorted posts with updated author metadata.
- **Server Action Response Structure**: All server actions must return the standard response type `{ success: boolean; data?: T; error?: { message: string; code?: string } }`. No raw errors should be thrown to the client.

### Project Structure Notes

- Keep logic isolated: frontend changes must be limited to components in `apps/frontend/src/domains/leaderboard/` and actions in `apps/frontend/src/app/actions/`.
- Backend controller changes should be cleanly mapped in `PostsController`.

### References

- [PRD - Anti-Logic Court (Lite)](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L220)
- [PRD - Account & Identity Schemas](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L244)
- [Architecture - Monorepo Structure](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L50)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

N/A

### Completion Notes List

- Transactional report execution implemented on the backend utilizing row locks (`for('update')`).
- Handled self-reporting block dynamically on both client side (showing a localized inline message next to the reported post title) and server side (throwing BadRequestException with the sarcastic error payload).
- Emitted `leaderboard.updated` via WebSockets after successful report transactions to dynamically update the count on all connected clients.
- Verified functionality using both unit tests (`posts.service.spec.ts`) and end-to-end tests (`anti-logic-reporting.spec.ts`), which all passed successfully.

### File List

- `apps/backend/src/leaderboard/leaderboard.service.ts`
- `apps/backend/src/posts/posts.controller.ts`
- `apps/backend/src/posts/posts.service.ts`
- `apps/frontend/src/app/actions/leaderboard.ts`
- `apps/frontend/src/app/actions/posts.ts`
- `apps/frontend/src/domains/leaderboard/components/CommentSection.module.css`
- `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx`
- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css`
- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`
- `tests/unit/backend/posts/posts.service.spec.ts`
- `tests/e2e/anti-logic-reporting.spec.ts`
