# Edge Case Hunter Prompt

You are a pure path tracer acting as the **Edge Case Hunter**. Your goal is to review the following diff and identify missing error handling, control flow gaps, and unguarded edge cases directly reachable from the changed lines.
You receive this diff and read access to the project.

Follow the `bmad-review-edge-case-hunter` skill guidelines exactly:
- Never comment on whether code is good or bad.
- Only list boundaries and paths that lack explicit handling or guards in the diff/changed files.
- Walk all control flow (conditionals, loops, error handlers, early returns) and domain boundaries (transitions of state/values).
- Do NOT editorialize or add filler.

## Output Format
Return **ONLY** a valid JSON array of objects. Do not wrap in markdown blocks, do not explain anything. Each object must contain exactly these four fields and nothing else:
```json
[
  {
    "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
    "trigger_condition": "one-line description (max 15 words)",
    "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
    "potential_consequence": "what could actually go wrong (max 15 words)"
  }
]
```
If no unhandled paths are found, return `[]`.

## Diff Content to Review

```diff
diff --git a/_bmad-output/implementation-artifacts/4-1-anti-logic-reporting-system.md b/_bmad-output/implementation-artifacts/4-1-anti-logic-reporting-system.md
new file mode 100644
index 0000000..6601cf5
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/4-1-anti-logic-reporting-system.md
@@ -0,0 +1,135 @@
+---
+story_id: 4.1
+story_key: 4-1-anti-logic-reporting-system
+epic_num: 4
+story_num: 1
+epic_title: Anti-Logic Moderation & Viral Sharing
+story_title: Anti-Logic Reporting System
+status: review
+---
+
+# Story 4.1: Anti-Logic Reporting System
+
+Status: review
+
+<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
+
+## Story
+
+As a user,
+I want to report posts that are "too logical" or "too helpful",
+so that we can maintain the platform's chaotic standard.
+
+## Acceptance Criteria
+
+1. **Given** a logged-in user on the Leaderboard page:
+   - **When** they view any post on the `LeaderboardGrid`
+   - **Then** they see a "Report Logic 🚨" button next to "Sabotage 😈" on each post row.
+   - **And** each post author's active `logicViolations` count is displayed in their author metadata row (e.g. "Logic Violations: X" or next to the username).
+2. **Given** the user clicks the "Report Logic 🚨" button:
+   - **When** they are the author of the post (self-reporting)
+   - **Then** the client-side/server action blocks the action and renders a sarcastic error message: `"Why are you reporting yourself? That's too logical, stop it!"`.
+   - **And** no backend database changes are committed.
+3. **Given** the user reports another user's post:
+   - **When** they click "Report Logic 🚨"
+   - **Then** the interface displays a pending state (disabling the button and/or showing a loading spinner) using React's `useTransition`.
+   - **And** calls the Server Action `actionReportPost(postId)` to submit the report.
+4. **Given** a report post request is processed on the backend:
+   - **When** the backend receives the request at `POST /posts/:id/report`
+   - **Then** it transactionally:
+     - Verifies the post exists; throws `NotFoundException` if it doesn't.
+     - Validates that the reporter (`req.user.sub`) is not the author of the post. If they are, throws a `BadRequestException` with the sarcastic message: `"Why are you reporting yourself? That's too logical, stop it!"`.
+     - Increments the `logicViolations` count of the post author in the `users` table by 1.
+     - Saves the updated record in the database.
+   - **And** broadcasts the updated leaderboard to all clients via the Socket.io event `leaderboard.updated`.
+5. **Given** the leaderboard selection query runs on the backend:
+   - **When** `LeaderboardService.getLeaderboard()` is executed
+   - **Then** the query must select `schema.users.logicViolations` for the post author and comment author.
+6. **Given** the client is connected to Socket.io:
+   - **When** a `leaderboard.updated` event is received
+   - **Then** the leaderboard is updated instantly and the new `logicViolations` counts are reflected on the UI without manual page refresh.
+
+## Tasks / Subtasks
+
+- [x] **Task 1: Backend Database & Query Support** (AC: 5)
+  - [x] Update `LeaderboardPost` type/interface in `apps/backend/src/leaderboard/leaderboard.service.ts` to include `logicViolations: number` under the `author` object.
+  - [x] Modify the Drizzle query in `LeaderboardService.getLeaderboard()` to select `logicViolations: schema.users.logicViolations` in the `author` selection for both posts and comments.
+- [x] **Task 2: Backend Report Endpoint & Controller** (AC: 4)
+  - [x] Add `@Post(':id/report')` endpoint in `PostsController` (`apps/backend/src/posts/posts.controller.ts`) guarded by `JwtAuthGuard`.
+  - [x] Implement `reportPost(userId: string, postId: string)` in `PostsService` (`apps/backend/src/posts/posts.service.ts`):
+    - [x] Retrieve the target post. Throw `NotFoundException` if it doesn't exist.
+    - [x] Assert that `post.authorId !== userId`. If they are the same, throw a `BadRequestException` with the payload `{ success: false, error: { message: "Why are you reporting yourself? That's too logical, stop it!" } }`.
+    - [x] Transactionally increment the `logicViolations` of the author in the `users` table (`schema.users`).
+    - [x] Call `this.leaderboardService.broadcastUpdate()` to broadcast the updated leaderboard to all connected Socket.io clients.
+    - [x] Return `{ success: true, data: { postId, authorId: post.authorId, logicViolations: newViolationCount } }`.
+- [x] **Task 3: Frontend Server Action** (AC: 3)
+  - [x] Update frontend `LeaderboardPost` interface in `apps/frontend/src/app/actions/leaderboard.ts` to include `logicViolations: number` in the `author` details.
+  - [x] Add `actionReportPost(postId: string): Promise<ActionResponse<any>>` in `apps/frontend/src/app/actions/posts.ts`:
+    - [x] Retrieve jwt token from cookies. If missing, return error: `"You must be authenticated to report a post. Log in first!"`.
+    - [x] Send `POST /posts/${postId}/report` fetch call.
+    - [x] Parse and return standard `ActionResponse` object.
+- [x] **Task 4: UI Changes & Styling** (AC: 1, 2, 3, 6)
+  - [x] Update `LeaderboardGrid.tsx` (`apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`):
+    - [x] Next to the "Sabotage 😈" button on each row, add a "Report Logic 🚨" button.
+    - [x] Style the button using vanilla CSS in `LeaderboardGrid.module.css`. Strictly DO NOT use Tailwind CSS.
+    - [x] Render the `logicViolations` count on the user metadata row (e.g. "🚨 X" or "Logic Violations: X") so users can see active count.
+    - [x] Implement a click handler for "Report Logic 🚨":
+      - [x] Use `useTransition` to capture the pending state.
+      - [x] Call `actionReportPost(postId)`.
+      - [x] If self-reporting is blocked or backend returns an error, set an error state on the row/grid to render the sarcastic error message.
+- [x] **Task 5: E2E Playwright Tests** (AC: 1-6)
+  - [x] Create E2E test file `tests/e2e/anti-logic-reporting.spec.ts`:
+    - [x] Register User A and User B.
+    - [x] User A submits a synergy-rich post.
+    - [x] User B logs in, goes to leaderboard, clicks "Report Logic 🚨" on User A's post.
+    - [x] Verify that User A's logic violations count updates dynamically in the UI.
+    - [x] Log in as User A and attempt to report User A's own post. Verify that the self-reporting is blocked and the sarcastic error message is displayed.
+
+## Dev Notes
+
+- **Database schema**: The `logicViolations` column is already defined in the `users` table of `schema.ts`. We only need to fetch and increment it.
+- **Vanilla CSS Variable compliance**: Ensure styling of the new button matches the Troll Capitalist/Hyper-Modern themes.
+- **WebSocket updates**: When a report goes through, calling `leaderboardService.broadcastUpdate()` will cause `LeaderboardGateway.broadcastLeaderboard()` to emit the `leaderboard.updated` event containing the freshly sorted posts with updated author metadata.
+- **Server Action Response Structure**: All server actions must return the standard response type `{ success: boolean; data?: T; error?: { message: string; code?: string } }`. No raw errors should be thrown to the client.
+
+### Project Structure Notes
+
+- Keep logic isolated: frontend changes must be limited to components in `apps/frontend/src/domains/leaderboard/` and actions in `apps/frontend/src/app/actions/`.
+- Backend controller changes should be cleanly mapped in `PostsController`.
+
+### References
+
+- [PRD - Anti-Logic Court (Lite)](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L220)
+- [PRD - Account & Identity Schemas](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L244)
+- [Architecture - Monorepo Structure](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L50)
+
+## Dev Agent Record
+
+### Agent Model Used
+
+Gemini 3.5 Flash (High)
+
+### Debug Log References
+
+N/A
+
+### Completion Notes List
+
+- Transactional report execution implemented on the backend utilizing row locks (`for('update')`).
+- Handled self-reporting block dynamically on both client side (showing a localized inline message next to the reported post title) and server side (throwing BadRequestException with the sarcastic error payload).
+- Emitted `leaderboard.updated` via WebSockets after successful report transactions to dynamically update the count on all connected clients.
+- Verified functionality using both unit tests (`posts.service.spec.ts`) and end-to-end tests (`anti-logic-reporting.spec.ts`), which all passed successfully.
+
+### File List
+
+- `apps/backend/src/leaderboard/leaderboard.service.ts`
+- `apps/backend/src/posts/posts.controller.ts`
+- `apps/backend/src/posts/posts.service.ts`
+- `apps/frontend/src/app/actions/leaderboard.ts`
+- `apps/frontend/src/app/actions/posts.ts`
+- `apps/frontend/src/domains/leaderboard/components/CommentSection.module.css`
+- `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx`
+- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css`
+- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`
+- `tests/unit/backend/posts/posts.service.spec.ts`
+- `tests/e2e/anti-logic-reporting.spec.ts`
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index 4069dbc..7ce9392 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -1,5 +1,5 @@
 # generated: 2026-05-18T09:50:34Z
-# last_updated: 2026-05-21T23:42:00+07:00
+# last_updated: 2026-05-22T14:17:30+07:00
 # project: Reverse Startup Leaderboard
 # project_key: NOKEY
 # tracking_system: file-system
@@ -35,7 +35,7 @@
 # - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
 
 generated: 2026-05-18T09:50:34Z
-last_updated: 2026-05-21T23:42:00+07:00
+last_updated: 2026-05-22T14:17:30+07:00
 project: Reverse Startup Leaderboard
 project_key: NOKEY
 tracking_system: file-system
@@ -59,8 +59,8 @@ development_status:
   3-2-seamless-checkout-integration: done
   3-3-real-time-sabotage-broadcast: done
   epic-3-retrospective: optional
-  epic-4: backlog
-  4-1-anti-logic-reporting-system: backlog
+  epic-4: in-progress
+  4-1-anti-logic-reporting-system: review
   4-2-visual-penalties-the-clown-hat: backlog
   4-3-viral-sharing-dynamic-previews: backlog
   4-4-safe-chaos-protocol-screen-reader-bypass: backlog
diff --git a/apps/backend/src/leaderboard/leaderboard.service.ts b/apps/backend/src/leaderboard/leaderboard.service.ts
index f86de51..cb2b962 100644
--- a/apps/backend/src/leaderboard/leaderboard.service.ts
+++ b/apps/backend/src/leaderboard/leaderboard.service.ts
@@ -17,6 +17,7 @@ export interface LeaderboardPost {
     username: string;
     avatar: string;
     isMercyActive: boolean;
+    logicViolations: number;
   };
 }
 
@@ -105,6 +106,7 @@ export class LeaderboardService {
           username: schema.users.username,
           avatar: schema.users.avatar,
           isMercyActive: schema.users.isMercyActive,
+          logicViolations: schema.users.logicViolations,
         },
       })
       .from(schema.posts)
@@ -126,6 +128,7 @@ export class LeaderboardService {
             username: schema.users.username,
             avatar: schema.users.avatar,
             isMercyActive: schema.users.isMercyActive,
+            logicViolations: schema.users.logicViolations,
           },
         })
         .from(schema.comments)
diff --git a/apps/backend/src/posts/posts.controller.ts b/apps/backend/src/posts/posts.controller.ts
index 3e22f16..63b1b0a 100644
--- a/apps/backend/src/posts/posts.controller.ts
+++ b/apps/backend/src/posts/posts.controller.ts
@@ -54,4 +54,10 @@ export class PostsController {
     }
     return this.postsService.vote(req.user.sub, body.targetId, body.targetType);
   }
+
+  @UseGuards(JwtAuthGuard)
+  @Post(':id/report')
+  async reportPost(@Request() req: any, @Param('id') postId: string) {
+    return this.postsService.reportPost(req.user.sub, postId);
+  }
 }
diff --git a/apps/backend/src/posts/posts.service.ts b/apps/backend/src/posts/posts.service.ts
index 7626b1c..d09c3ce 100644
--- a/apps/backend/src/posts/posts.service.ts
+++ b/apps/backend/src/posts/posts.service.ts
@@ -210,4 +210,73 @@ export class PostsService {
       };
     }
   }
+
+  async reportPost(userId: string, postId: string) {
+    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
+    if (!uuidRegex.test(postId)) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Invalid postId format. Must be a valid UUID.' },
+      });
+    }
+
+    const result = await this.db.transaction(async (tx) => {
+      // 1. Retrieve the target post with row lock
+      const postRes = await tx
+        .select()
+        .from(schema.posts)
+        .where(eq(schema.posts.id, postId))
+        .for('update')
+        .limit(1);
+
+      if (postRes.length === 0) {
+        throw new NotFoundException({
+          success: false,
+          error: { message: 'Post not found.' },
+        });
+      }
+
+      const post = postRes[0];
+
+      // 2. Validate that the reporter is not the author of the post
+      if (post.authorId === userId) {
+        throw new BadRequestException({
+          success: false,
+          error: { message: "Why are you reporting yourself? That's too logical, stop it!" },
+        });
+      }
+
+      // 3. Transactionally increment the logicViolations of the author in the users table
+      const [updatedUser] = await tx
+        .update(schema.users)
+        .set({
+          logicViolations: sql`${schema.users.logicViolations} + 1`,
+          updatedAt: new Date(),
+        })
+        .where(eq(schema.users.id, post.authorId))
+        .returning();
+
+      return {
+        post,
+        updatedUser,
+      };
+    });
+
+    // 4. Call broadcastUpdate to broadcast the updated leaderboard to all connected Socket.io clients
+    try {
+      await this.leaderboardService.broadcastUpdate();
+    } catch (e) {
+      console.error('Failed to broadcast leaderboard update after post report:', e);
+    }
+
+    // 5. Return success payload
+    return {
+      success: true,
+      data: {
+        postId: result.post.id,
+        authorId: result.post.authorId,
+        logicViolations: result.updatedUser.logicViolations,
+      },
+    };
+  }
 }
diff --git a/apps/frontend/src/app/actions/leaderboard.ts b/apps/frontend/src/app/actions/leaderboard.ts
index aa5aedc..5fb9377 100644
--- a/apps/frontend/src/app/actions/leaderboard.ts
+++ b/apps/frontend/src/app/actions/leaderboard.ts
@@ -12,6 +12,7 @@ export interface LeaderboardPost {
     username: string;
     avatar: string;
     isMercyActive: boolean;
+    logicViolations: number;
   };
   comments?: Array<{
     id: string;
@@ -25,6 +26,7 @@ export interface LeaderboardPost {
       username: string;
       avatar: string;
       isMercyActive: boolean;
+      logicViolations: number;
     };
   }>;
 }
diff --git a/apps/frontend/src/app/actions/posts.ts b/apps/frontend/src/app/actions/posts.ts
index 525f5cf..2744ac6 100644
--- a/apps/frontend/src/app/actions/posts.ts
+++ b/apps/frontend/src/app/actions/posts.ts
@@ -130,3 +130,43 @@ export async function actionSubmitVote(
     };
   }
 }
+
+export async function actionReportPost(
+  postId: string
+): Promise<ActionResponse<any>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'You must be authenticated to report a post. Log in first!' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/posts/${postId}/report`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Failed to submit report.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Network error occurred while submitting report.' },
+    };
+  }
+}
diff --git a/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css b/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css
index 4bd293d..0a25b93 100644
--- a/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css
+++ b/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css
@@ -152,6 +152,20 @@
   text-decoration: underline;
 }
 
+.violationsBadge {
+  display: inline-flex;
+  align-items: center;
+  background: #fee2e2;
+  color: #ef4444;
+  border: 1px solid #fecaca;
+  padding: 0.15rem 0.4rem;
+  border-radius: 6px;
+  font-size: 0.75rem;
+  font-weight: 700;
+  margin-left: 6px;
+  vertical-align: middle;
+}
+
 @media (prefers-reduced-motion: reduce) {
   .submitBtn {
     transition: none !important;
diff --git a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
index ceaf265..c0bd37c 100644
--- a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
@@ -86,6 +86,9 @@ export default function CommentSection({ post, currentUser }: CommentSectionProp
                     {comment.author.isMercyActive && (
                       <span className={styles.mercyBadge} title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>
                     )}
+                    <span className={styles.violationsBadge} title={`Logic Violations: ${comment.author.logicViolations || 0}`}>
+                      🚨 {comment.author.logicViolations || 0}
+                    </span>
                   </span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <span className={styles.commentCalories}>{comment.wastedCalories} kcal wasted</span>
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
index 624ca86..edd2e54 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
@@ -233,6 +233,64 @@
   transform: translateY(0);
 }
 
+.reportLogicBtn {
+  background: #f97316;
+  color: #ffffff;
+  border: 1px solid #ea580c;
+  border-radius: 8px;
+  padding: 0.5rem 1rem;
+  font-family: var(--font-heading);
+  font-size: 0.85rem;
+  font-weight: 700;
+  cursor: pointer;
+  display: inline-flex;
+  align-items: center;
+  gap: 0.25rem;
+  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
+  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.1);
+}
+
+.reportLogicBtn:hover:not(:disabled) {
+  background: #ea580c;
+  transform: translateY(-1px);
+  box-shadow: 0 4px 6px rgba(249, 115, 22, 0.2);
+}
+
+.reportLogicBtn:active:not(:disabled) {
+  transform: translateY(0);
+}
+
+.reportLogicBtn:disabled {
+  background: #cbd5e1;
+  border-color: #cbd5e1;
+  color: #94a3b8;
+  cursor: not-allowed;
+  transform: none;
+  box-shadow: none;
+}
+
+.violationsBadge {
+  display: inline-flex;
+  align-items: center;
+  background: #fee2e2;
+  color: #ef4444;
+  border: 1px solid #fecaca;
+  padding: 0.15rem 0.4rem;
+  border-radius: 6px;
+  font-size: 0.75rem;
+  font-weight: 700;
+  margin-left: 6px;
+  vertical-align: middle;
+}
+
+.reportErrorMsg {
+  color: #ef4444;
+  font-size: 0.8rem;
+  margin-top: 0.5rem;
+  font-weight: 600;
+  display: block;
+}
+
 .srOnly {
   position: absolute;
   width: 1px;
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
index 547002c..eca5e8a 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
@@ -2,6 +2,7 @@
 
 import React, { useState, useEffect, useTransition } from 'react';
 import { actionGetLeaderboard, LeaderboardPost } from '../../../app/actions/leaderboard';
+import { actionReportPost } from '../../../app/actions/posts';
 import { socket } from '../../../core/api/socket.client';
 import GoldenRaspberryBadge from './GoldenRaspberryBadge';
 import CommentSection from './CommentSection';
@@ -33,6 +34,33 @@ export default function LeaderboardGrid() {
     title: string;
     authorId: string;
   } | null>(null);
+  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
+  const [reportingError, setReportingError] = useState<{ [postId: string]: string | null }>({});
+  const [isReporting, startReportTransition] = useTransition();
+
+  const handleReport = (postId: string, authorId: string) => {
+    if (currentUser?.id === authorId) {
+      setReportingError((prev) => ({
+        ...prev,
+        [postId]: "Why are you reporting yourself? That's too logical, stop it!",
+      }));
+      return;
+    }
+
+    setReportingError((prev) => ({ ...prev, [postId]: null }));
+    setReportingPostId(postId);
+
+    startReportTransition(async () => {
+      const response = await actionReportPost(postId);
+      if (!response.success) {
+        setReportingError((prev) => ({
+          ...prev,
+          [postId]: response.error?.message || 'Failed to report logic.',
+        }));
+      }
+      setReportingPostId(null);
+    });
+  };
 
   useEffect(() => {
     // 1. Fetch initial leaderboard data
@@ -147,11 +175,22 @@ export default function LeaderboardGrid() {
                     {post.author.isMercyActive && (
                       <span className={styles.mercyBadge} title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>
                     )}
+                    <span className={styles.violationsBadge} title={`Logic Violations: ${post.author.logicViolations || 0}`}>
+                      🚨 {post.author.logicViolations || 0}
+                    </span>
                   </span>
                 </div>
                 <div className={styles.colTitle} aria-hidden={isDistorted ? "true" : undefined}>
                   <div className={styles.postTitleText}>{post.title}</div>
                   <p className={styles.postSnippet}>{post.content}</p>
+                  {reportingError[post.id] && (
+                    <span
+                      className={styles.reportErrorMsg}
+                      onClick={(e) => e.stopPropagation()}
+                    >
+                      ⚠️ {reportingError[post.id]}
+                    </span>
+                  )}
                 </div>
                 <div className={styles.colScore}>
                   <div className={styles.scoreContainer}>
@@ -168,22 +207,34 @@ export default function LeaderboardGrid() {
                         <EvasiveButton targetId={post.id} targetType="post" />
                       </div>
                       {currentUser && (
-                        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
-                          <button
-                            className={styles.sabotageBtn}
-                            onClick={() => {
-                              setSelectedSabotagePost({
-                                id: post.id,
-                                title: post.title,
-                                authorId: post.author.id,
-                              });
-                              setIsModalOpen(true);
-                            }}
-                            aria-label={`Sabotage post by ${post.author.username}`}
-                          >
-                            Sabotage 😈
-                          </button>
-                        </div>
+                        <>
+                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
+                            <button
+                              className={styles.sabotageBtn}
+                              onClick={() => {
+                                setSelectedSabotagePost({
+                                  id: post.id,
+                                  title: post.title,
+                                  authorId: post.author.id,
+                                });
+                                setIsModalOpen(true);
+                              }}
+                              aria-label={`Sabotage post by ${post.author.username}`}
+                            >
+                              Sabotage 😈
+                            </button>
+                          </div>
+                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
+                            <button
+                              className={styles.reportLogicBtn}
+                              onClick={() => handleReport(post.id, post.author.id)}
+                              disabled={isReporting && reportingPostId === post.id}
+                              aria-label={`Report logic in post by ${post.author.username}`}
+                            >
+                              {isReporting && reportingPostId === post.id ? 'Reporting... ⏳' : 'Report Logic 🚨'}
+                            </button>
+                          </div>
+                        </>
                       )}
                     </div>
                   </div>
diff --git a/tests/e2e/anti-logic-reporting.spec.ts b/tests/e2e/anti-logic-reporting.spec.ts
new file mode 100644
index 0000000..0be14af
--- /dev/null
+++ b/tests/e2e/anti-logic-reporting.spec.ts
@@ -0,0 +1,85 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Anti-Logic Reporting E2E Flow', () => {
+  test('should allow user B to report user A post, update counts, and block user A self-reporting', async ({ browser }) => {
+    // 1. Setup User A context and page
+    const contextA = await browser.newContext();
+    const pageA = await contextA.newPage();
+    await pageA.goto('/auth');
+    await pageA.click('button:has-text("Register now")');
+    const userA = `userA_${Date.now()}`;
+    await pageA.fill('#username', userA);
+    await pageA.fill('#password', 'password123');
+    await pageA.click('button[type="submit"]');
+    await expect(pageA).toHaveURL(/\/profile/);
+
+    // 2. User A creates a post
+    await pageA.goto('/');
+    await pageA.click('button:has-text("Propose a Paradigm")');
+    await pageA.fill('#post-title-input', `Synergy Paradigm Title ${Date.now()}`);
+    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
+    await pageA.fill('#post-content-input', validContent);
+    await pageA.click('button:has-text("Propose Paradigm")');
+
+    // Solve Ad Captcha
+    await expect(pageA.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const adText = await pageA.locator('#sponsor-ad-text').textContent();
+    await pageA.fill('#ad-verification-input', adText!);
+    await pageA.click('button:has-text("Verify & Submit")');
+
+    // Wait for modal to close
+    await expect(pageA.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });
+
+    // 3. Setup User B context and page
+    const contextB = await browser.newContext();
+    const pageB = await contextB.newPage();
+    await pageB.goto('/auth');
+    await pageB.click('button:has-text("Register now")');
+    const userB = `userB_${Date.now()}`;
+    await pageB.fill('#username', userB);
+    await pageB.fill('#password', 'password123');
+    await pageB.click('button[type="submit"]');
+    await expect(pageB).toHaveURL(/\/profile/);
+
+    // 4. User B goes to home and reports User A's post
+    await pageB.goto('/');
+
+    // Locate User A's row in leaderboard
+    const row = pageB.locator(`div[class*="postRowWrapper"]:has-text("${userA}")`);
+    await expect(row).toBeVisible();
+
+    // Verify initial violations count is 🚨 0
+    const violationsBadge = row.locator('span[class*="violationsBadge"]');
+    await expect(violationsBadge).toHaveText('🚨 0');
+
+    // Click "Report Logic 🚨" on User A's post
+    const reportBtn = row.locator('button:has-text("Report Logic 🚨")');
+    await expect(reportBtn).toBeVisible();
+    await reportBtn.click();
+
+    // Verify dynamic update of the badge to 🚨 1 in User B's UI via WebSocket broadcast
+    await expect(violationsBadge).toHaveText('🚨 1');
+
+    // 5. In User A's session, verify the count is also updated to 🚨 1 dynamically
+    const rowA = pageA.locator(`div[class*="postRowWrapper"]:has-text("${userA}")`);
+    const violationsBadgeA = rowA.locator('span[class*="violationsBadge"]');
+    await expect(violationsBadgeA).toHaveText('🚨 1');
+
+    // 6. User A attempts to self-report
+    const reportBtnA = rowA.locator('button:has-text("Report Logic 🚨")');
+    await expect(reportBtnA).toBeVisible();
+    await reportBtnA.click();
+
+    // Verify error message is rendered
+    const errorMsg = rowA.locator('span[class*="reportErrorMsg"]');
+    await expect(errorMsg).toBeVisible();
+    await expect(errorMsg).toHaveText("⚠️ Why are you reporting yourself? That's too logical, stop it!");
+
+    // Verify count did not increment (remains 🚨 1)
+    await expect(violationsBadgeA).toHaveText('🚨 1');
+
+    // Clean up
+    await contextA.close();
+    await contextB.close();
+  });
+});
diff --git a/tests/unit/backend/posts/posts.service.spec.ts b/tests/unit/backend/posts/posts.service.spec.ts
index 921cfe0..e8e4d73 100644
--- a/tests/unit/backend/posts/posts.service.spec.ts
+++ b/tests/unit/backend/posts/posts.service.spec.ts
@@ -16,9 +16,12 @@ describe('PostsService', () => {
       returning: jest.fn(),
       select: jest.fn().mockReturnThis(),
       from: jest.fn().mockReturnThis(),
-      where: jest.fn(),
+      where: jest.fn().mockReturnThis(),
       update: jest.fn().mockReturnThis(),
       set: jest.fn().mockReturnThis(),
+      transaction: jest.fn((cb) => cb(dbMock)),
+      for: jest.fn().mockReturnThis(),
+      limit: jest.fn().mockReturnThis(),
     };
 
     leaderboardServiceMock = {
@@ -259,4 +262,66 @@ describe('PostsService', () => {
       ).rejects.toThrow(NotFoundException);
     });
   });
+
+  describe('reportPost', () => {
+    const userId = '11111111-1111-1111-1111-111111111111';
+    const authorId = '22222222-2222-2222-2222-222222222222';
+    const postId = '33333333-3333-3333-3333-333333333333';
+
+    it('should successfully report a post, incrementing author logicViolations by 1', async () => {
+      const mockPost = {
+        id: postId,
+        title: 'Leverage synergy paradigm',
+        authorId: authorId,
+      };
+      const mockUpdatedUser = {
+        id: authorId,
+        username: 'alice',
+        logicViolations: 5,
+      };
+
+      // Mock select post
+      dbMock.limit.mockResolvedValueOnce([mockPost]);
+      // Mock update user chain
+      dbMock.returning.mockResolvedValueOnce([mockUpdatedUser]);
+
+      const result = await service.reportPost(userId, postId);
+
+      expect(dbMock.select).toHaveBeenCalled();
+      expect(dbMock.update).toHaveBeenCalled();
+      expect(dbMock.set).toHaveBeenCalledWith({
+        logicViolations: expect.any(Object),
+        updatedAt: expect.any(Date),
+      });
+      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data).toEqual({
+        postId,
+        authorId: authorId,
+        logicViolations: 5,
+      });
+    });
+
+    it('should throw NotFoundException if post does not exist', async () => {
+      dbMock.limit.mockResolvedValueOnce([]);
+
+      await expect(
+        service.reportPost(userId, postId)
+      ).rejects.toThrow(NotFoundException);
+    });
+
+    it('should throw BadRequestException if user tries to report their own post', async () => {
+      const mockPost = {
+        id: postId,
+        title: 'Mock Post',
+        authorId: userId, // self
+      };
+
+      dbMock.limit.mockResolvedValueOnce([mockPost]);
+
+      await expect(
+        service.reportPost(userId, postId)
+      ).rejects.toThrow(BadRequestException);
+    });
+  });
 });
```
