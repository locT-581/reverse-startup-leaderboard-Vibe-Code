# Acceptance Auditor Prompt

Please paste the following instructions, diff, spec, and project context into a new session (ideally using a different LLM model) to perform the Acceptance Auditor review.

---

## System / Role Instructions

You are an Acceptance Auditor. Review the diff content against the spec and project context provided below.

Check for:
- Violations of acceptance criteria
- Deviations from spec intent
- Missing implementation of specified behavior
- Contradictions between spec constraints and actual code

Output findings as a Markdown list. Each finding must include:
- A one-line title
- Which AC/constraint it violates
- Evidence from the diff

---

## Spec File: Story 3.3: Real-Time Sabotage Broadcast

```markdown
story_id: 3.3
story_key: 3-3-real-time-sabotage-broadcast
epic_num: 3
story_num: 3
epic_title: Troll Capitalism - The Sabotage Store
story_title: Real-Time Sabotage Broadcast
status: review

# Story 3.3: Real-Time Sabotage Broadcast

Status: review

## Story

As a Troll Capitalist,
I want to deploy my Sabotage Pack against a specific post,
so that the target's screen instantly distorts and their score drops.

## Acceptance Criteria

1. **Given** a logged-in user is on the Leaderboard page:
   - **When** they click the "Sabotage 😈" button on a post row
   - **Then** a `SabotageSelectionModal` modal opens, showing their active inventory of Sabotage Packs (Blur, Comic Sans, Papyrus, Calories Deduction) fetched via `actionGetUserInventory`.
2. **Given** the user selects an available Sabotage Pack (inventory count > 0) and confirms deployment:
   - **When** they click the "Deploy" button
   - **Then** the interface displays a loading state (e.g. "Deploying...") using `useTransition` or `isPending` state.
   - **And** calls the Server Action `actionDeploySabotage(postId, effectType)` to process the deployment.
3. **Given** a Sabotage Pack deployment is triggered on the backend:
   - **When** the backend verifies the user has at least 1 token of the selected `effectType` in their inventory
   - **Then** it transactionally:
     - Decrements the user's inventory count by 1 in `user_sabotages`.
     - Deducts the specified calories from the target post's `wastedCalories`:
       - `blur` deducts 100 Wasted Calories.
       - `comic_sans` deducts 150 Wasted Calories.
       - `papyrus` deducts 150 Wasted Calories.
       - `deduct_calories` deducts 500 Wasted Calories.
       - The score is capped at a minimum of 0 (points cannot go below 0).
     - Updates the post record in the database.
   - **And** broadcasts the updated leaderboard to all clients via the WebSocket event `leaderboard.updated`.
   - **And** broadcasts the custom event `sabotage.deployed` with payload `{ targetId, effectType, authorId }` where `targetId` is the post's UUID, `effectType` is the visual distortion name, and `authorId` is the post author's UUID.
4. **Given** a client is connected to the real-time WebSocket:
   - **When** the client receives the `sabotage.deployed` event
   - **Then** it adds the sabotage event to the Zustand store `useChaosStore` with a 15-second duration.
5. **Given** an active visual sabotage in `useChaosStore`:
   - **When** the logged-in user is the author of the targeted post (`authorId === currentUser.id`)
   - **Then** the frontend applies the visual distortion class globally to `document.body` for 15 seconds:
     - `blur` applies class `.sabotage-blur` which blurs the entire viewport (`filter: blur(2px)`).
     - `comic_sans` applies class `.sabotage-comic-sans` which overrides all elements to use Comic Sans (`font-family: 'Comic Sans MS', 'Comic Sans', cursive !important`).
     - `papyrus` applies class `.sabotage-papyrus` which overrides all elements to use Papyrus (`font-family: 'Papyrus', fantasy !important`).
6. **Given** an active visual sabotage in `useChaosStore`:
   - **When** the logged-in user is NOT the author of the targeted post
   - **Then** the frontend applies the row-level class to the specific post row matching `targetId` inside `LeaderboardGrid` for 15 seconds:
     - `blur` applies `.post-blur` (`filter: blur(4px)`).
     - `comic_sans` applies `.post-comic-sans` (`font-family: 'Comic Sans MS', 'Comic Sans', cursive !important`).
     - `papyrus` applies `.post-papyrus` (`font-family: 'Papyrus', fantasy !important`).
7. **Given** any active visual sabotage in the client state:
   - **When** the 15-second timer expires
   - **Then** the class is removed from `document.body` or the leaderboard post row, restoring the original styling.
8. **Given** a user has OS-level `prefers-reduced-motion: reduce` enabled:
   - **When** a visual sabotage is active
   - **Then** any vibrating, screen shaking, or flashing animations associated with the sabotage are automatically disabled.
   - **And** the "Screen Reader Bypass" ensures that visually hidden, clean text is readable by assistive technologies, ignoring the visual blurs/distortions.

## Tasks / Subtasks

- [ ] **Task 1: Backend WebSocket Gateway Integration** (AC: 3)
  - [ ] Add `emitSabotage(targetId: string, effectType: string, authorId: string)` in `LeaderboardGateway` (`apps/backend/src/leaderboard/leaderboard.gateway.ts`) to emit `sabotage.deployed` events.
  - [ ] In `apps/backend/src/sabotage/sabotage.module.ts`, import `forwardRef(() => LeaderboardModule)` to resolve circular dependencies and gain access to the gateway.
- [ ] **Task 2: Backend Deploy Endpoint & Service Logic** (AC: 3)
  - [ ] Create `@Post('deploy')` in `SabotageController` (`apps/backend/src/sabotage/sabotage.controller.ts`), guarded by `JwtAuthGuard`.
  - [ ] Implement `deploySabotage(userId: string, postId: string, effectType: string)` in `SabotageService` (`apps/backend/src/sabotage/sabotage.service.ts`):
    - [ ] Retrieve the user's inventory count for `effectType`. If <= 0, throw a `BadRequestException` with a sarcastic error message (e.g. "Nice try, but your arsenal is empty. Visit the store to buy some power first!").
    - [ ] Retrieve the target post. Throw `NotFoundException` if it doesn't exist.
    - [ ] Update the database in a transaction:
      - [ ] Decrement `user_sabotages.count` by 1.
      - [ ] Calculate score deduction: `blur` (-100), `comic_sans` (-150), `papyrus` (-150), `deduct_calories` (-500).
      - [ ] Update the post's `wastedCalories` (ensure a lower bound of 0).
    - [ ] Call `LeaderboardGateway.broadcastLeaderboard()` to update everyone's scores.
    - [ ] Call `LeaderboardGateway.emitSabotage(postId, effectType, post.authorId)` to broadcast the visual effect.
- [ ] **Task 3: Frontend Server Actions & State Management** (AC: 2, 4, 5, 7)
  - [ ] Implement `actionDeploySabotage(postId: string, effectType: string)` Server Action in `apps/frontend/src/app/actions/sabotage.ts`.
  - [ ] Create `useChaosStore.ts` Zustand store in `apps/frontend/src/core/store/useChaosStore.ts`:
    - [ ] State: `activeSabotages` as `{ id: string; targetId: string; effectType: string; authorId: string; expiresAt: number }[]`.
    - [ ] Actions: `addSabotage`, `removeSabotage`, `clearExpired`.
  - [ ] Create a client-side component `ChaosListener.tsx` (rendered in the root layout or root page):
    - [ ] Connect to the Socket and listen for `sabotage.deployed`.
    - [ ] Upon receiving the event, compute `expiresAt` (15 seconds from now) and call `addSabotage`.
    - [ ] Periodically or via timeout clear expired sabotages.
    - [ ] Monitor active sabotages: if any active sabotage matches `currentUser.id` as the `authorId`, dynamically add classes to `document.body` (e.g., `sabotage-blur`, `sabotage-comic-sans`, `sabotage-papyrus`). Remove them when no active matching sabotages remain.
- [ ] **Task 4: UI Components & Styles** (AC: 1, 2, 5, 6, 8)
  - [ ] Add class definitions to `apps/frontend/src/app/globals.css`:
    - [ ] Body-level: `.sabotage-blur` (`filter: blur(2px)`), `.sabotage-comic-sans` (`font-family: 'Comic Sans MS', 'Comic Sans', cursive !important`), `.sabotage-papyrus` (`font-family: 'Papyrus', fantasy !important`).
    - [ ] Row-level: `.post-blur` (`filter: blur(4px)`), `.post-comic-sans` (Comic Sans font), `.post-papyrus` (Papyrus font).
    - [ ] Implement accessibility safety: ensure no motion-intensive animations run under `@media (prefers-reduced-motion: reduce)`.
  - [ ] Create `SabotageSelectionModal.tsx` in `apps/frontend/src/domains/sabotage/components/`:
    - [ ] Show count of each Sabotage type currently owned.
    - [ ] Enable "Deploy" button if inventory count > 0.
    - [ ] If inventory count is 0, show a link to the storefront: "Restock at the Sabotage Storefront".
    - [ ] Wrap deployment in a standard transition spinner or loading text.
  - [ ] Update `LeaderboardGrid.tsx` to:
    - [ ] Add the "Sabotage 😈" trigger button to each post row.
    - [ ] Wire it up to open `SabotageSelectionModal` with the post's ID.
    - [ ] Read from `useChaosStore` to conditionally apply row-level classes (`.post-blur`, etc.) when the post is targeted.
    - [ ] Ensure that for visual distortion, there is alternative descriptive hidden text so screen readers bypass the CSS sabotage effect.
- [ ] **Task 5: E2E Playwright Testing** (AC: 1-8)
  - [ ] Create `tests/e2e/sabotage-broadcast.spec.ts`:
    - [ ] Register User A and create a post.
    - [ ] Register User B, navigate to storefront, and buy a Blur Pack (inventory becomes 1).
    - [ ] User B goes back to Leaderboard, clicks "Sabotage" on User A's post, opens modal, and clicks deploy.
    - [ ] Verify User B's inventory is now 0.
    - [ ] Verify User A's post score is decremented by 100 kcal on the leaderboard.
    - [ ] Verify User A's post row has `.post-blur` or blur style applied.
    - [ ] Authenticate as User A and verify that User A's screen body has `.sabotage-blur` class applied.
    - [ ] Fast-forward or wait 15 seconds and verify the class is removed.
```

---

## Project Context Rules

```markdown
- Frontend: Next.js (App Router), TypeScript, Vanilla CSS (Strictly NO Tailwind)
- State Management: Zustand v5.0.13
- Backend: NestJS, PostgreSQL, Drizzle ORM v0.45.2
- Monorepo Package Manager: pnpm workspaces
- Component Boundaries: Standard UI elements MUST NOT contain any Anti-UX or hostile logic. All intentional UI chaos MUST be strictly isolated within src/domains/anti-ux/components/.
- Vanilla CSS: CSS classes for layout/styling must be written in Vanilla CSS (via CSS Modules or Global CSS). DO NOT use Tailwind CSS.
- Accessibility (Safe-Chaos): ALWAYS wrap intense Sabotage UI animations (like screen shakes) with CSS `@media (prefers-reduced-motion: no-preference)`. Never bypass this guardrail.
- Server Action Responses: All Next.js Server Actions MUST return a typed object: `{ success: boolean; data?: T; error?: { message: string; code?: string } }`.
- Error Handling: DO NOT throw raw exceptions in Server Actions. Return passive-aggressive error messages inside the `error` object.
```

---

## Diff Content to Review

```diff

```
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index c78107c..6f7d7cf 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -1,5 +1,5 @@
 # generated: 2026-05-18T09:50:34Z
-# last_updated: 2026-05-21T17:06:21+07:00
+# last_updated: 2026-05-21T23:41:43+07:00
 # project: Reverse Startup Leaderboard
 # project_key: NOKEY
 # tracking_system: file-system
@@ -35,7 +35,7 @@
 # - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
 
 generated: 2026-05-18T09:50:34Z
-last_updated: 2026-05-21T22:10:00+07:00
+last_updated: 2026-05-21T23:41:43+07:00
 project: Reverse Startup Leaderboard
 project_key: NOKEY
 tracking_system: file-system
@@ -57,7 +57,7 @@ development_status:
   epic-3: in-progress
   3-1-the-sabotage-storefront: done
   3-2-seamless-checkout-integration: done
-  3-3-real-time-sabotage-broadcast: backlog
+  3-3-real-time-sabotage-broadcast: review
   epic-3-retrospective: optional
   epic-4: backlog
   4-1-anti-logic-reporting-system: backlog
diff --git a/apps/backend/src/leaderboard/leaderboard.gateway.ts b/apps/backend/src/leaderboard/leaderboard.gateway.ts
index 47622cd..1fb0731 100644
--- a/apps/backend/src/leaderboard/leaderboard.gateway.ts
+++ b/apps/backend/src/leaderboard/leaderboard.gateway.ts
@@ -45,4 +45,9 @@ export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconn
       this.logger.error(`Error broadcasting leaderboard: ${err.message}`, err.stack);
     }
   }
+
+  emitSabotage(targetId: string, effectType: string, authorId: string) {
+    if (!this.server) return;
+    this.server.emit('sabotage.deployed', { targetId, effectType, authorId });
+  }
 }
diff --git a/apps/backend/src/sabotage/sabotage.controller.ts b/apps/backend/src/sabotage/sabotage.controller.ts
index 3121244..2fb8ba7 100644
--- a/apps/backend/src/sabotage/sabotage.controller.ts
+++ b/apps/backend/src/sabotage/sabotage.controller.ts
@@ -45,4 +45,15 @@ export class SabotageController {
     const userId = req.user.sub;
     return this.sabotageService.getUserInventory(userId);
   }
+
+  @UseGuards(JwtAuthGuard)
+  @Post('deploy')
+  async deploySabotage(
+    @Req() req: any,
+    @Body('postId') postId: string,
+    @Body('effectType') effectType: string,
+  ) {
+    const userId = req.user.sub;
+    return this.sabotageService.deploySabotage(userId, postId, effectType);
+  }
 }
diff --git a/apps/backend/src/sabotage/sabotage.module.ts b/apps/backend/src/sabotage/sabotage.module.ts
index 6e8e9ef..9a5b9b3 100644
--- a/apps/backend/src/sabotage/sabotage.module.ts
+++ b/apps/backend/src/sabotage/sabotage.module.ts
@@ -1,11 +1,12 @@
-import { Module } from '@nestjs/common';
+import { Module, forwardRef } from '@nestjs/common';
 import { DatabaseModule } from '../database/database.module';
 import { SabotageController } from './sabotage.controller';
 import { SabotageService } from './sabotage.service';
 import { StripeService } from './stripe.service';
+import { LeaderboardModule } from '../leaderboard/leaderboard.module';
 
 @Module({
-  imports: [DatabaseModule],
+  imports: [DatabaseModule, forwardRef(() => LeaderboardModule)],
   controllers: [SabotageController],
   providers: [SabotageService, StripeService],
   exports: [SabotageService, StripeService],
diff --git a/apps/backend/src/sabotage/sabotage.service.ts b/apps/backend/src/sabotage/sabotage.service.ts
index 086e0c6..f824639 100644
--- a/apps/backend/src/sabotage/sabotage.service.ts
+++ b/apps/backend/src/sabotage/sabotage.service.ts
@@ -1,9 +1,10 @@
-import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
+import { Injectable, Inject, NotFoundException, Logger, BadRequestException, forwardRef } from '@nestjs/common';
 import { DRIZZLE } from '../database/database.module';
 import { NodePgDatabase } from 'drizzle-orm/node-postgres';
 import * as schema from '../../db/schema';
 import { eq, and } from 'drizzle-orm';
 import { StripeService } from './stripe.service';
+import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';
 
 @Injectable()
 export class SabotageService {
@@ -12,6 +13,8 @@ export class SabotageService {
   constructor(
     @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
     private readonly stripeService: StripeService,
+    @Inject(forwardRef(() => LeaderboardGateway))
+    private readonly leaderboardGateway: LeaderboardGateway,
   ) {}
 
   async getAvailablePacks() {
@@ -184,4 +187,91 @@ export class SabotageService {
       })),
     };
   }
+
+  async deploySabotage(userId: string, postId: string, effectType: string) {
+    // 1. Retrieve the user's inventory count for effectType
+    const userInventory = await this.db
+      .select()
+      .from(schema.userSabotages)
+      .where(
+        and(
+          eq(schema.userSabotages.userId, userId),
+          eq(schema.userSabotages.effectType, effectType),
+        ),
+      )
+      .limit(1);
+
+    if (userInventory.length === 0 || userInventory[0].count <= 0) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Nice try, but your arsenal is empty. Visit the store to buy some power first!' },
+      });
+    }
+
+    const inventoryRecord = userInventory[0];
+
+    // 2. Retrieve the target post
+    const postRes = await this.db
+      .select()
+      .from(schema.posts)
+      .where(eq(schema.posts.id, postId))
+      .limit(1);
+
+    if (postRes.length === 0) {
+      throw new NotFoundException({
+        success: false,
+        error: { message: 'Post not found.' },
+      });
+    }
+
+    const post = postRes[0];
+
+    // 3. Calculate score deduction
+    let deduction = 0;
+    if (effectType === 'blur') {
+      deduction = 100;
+    } else if (effectType === 'comic_sans') {
+      deduction = 150;
+    } else if (effectType === 'papyrus') {
+      deduction = 150;
+    } else if (effectType === 'deduct_calories') {
+      deduction = 500;
+    }
+
+    const newWastedCalories = Math.max(0, post.wastedCalories - deduction);
+
+    // 4. Update the database in a transaction
+    await this.db.transaction(async (tx) => {
+      // Decrement count
+      await tx
+        .update(schema.userSabotages)
+        .set({
+          count: inventoryRecord.count - 1,
+          updatedAt: new Date(),
+        })
+        .where(eq(schema.userSabotages.id, inventoryRecord.id));
+
+      // Update post's wasted calories
+      await tx
+        .update(schema.posts)
+        .set({
+          wastedCalories: newWastedCalories,
+          updatedAt: new Date(),
+        })
+        .where(eq(schema.posts.id, post.id));
+    });
+
+    // 5. Broadcast updated leaderboard
+    await this.leaderboardGateway.broadcastLeaderboard();
+
+    // 6. Broadcast custom event sabotage.deployed
+    this.leaderboardGateway.emitSabotage(post.id, effectType, post.authorId);
+
+    return {
+      success: true,
+      data: {
+        newWastedCalories,
+      },
+    };
+  }
 }
diff --git a/apps/frontend/src/app/actions/sabotage.ts b/apps/frontend/src/app/actions/sabotage.ts
index 9e6642d..3be7f42 100644
--- a/apps/frontend/src/app/actions/sabotage.ts
+++ b/apps/frontend/src/app/actions/sabotage.ts
@@ -139,3 +139,45 @@ export async function actionGetUserInventory(): Promise<ActionResponse<UserInven
     };
   }
 }
+
+export async function actionDeploySabotage(
+  postId: string,
+  effectType: string
+): Promise<ActionResponse<{ newWastedCalories: number }>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'You must be authenticated to deploy sabotage.' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/sabotage/deploy`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+      body: JSON.stringify({ postId, effectType }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || data.message || 'Failed to deploy sabotage.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Network error occurred while deploying sabotage.' },
+    };
+  }
+}
diff --git a/apps/frontend/src/app/globals.css b/apps/frontend/src/app/globals.css
index 96850a9..da1063c 100644
--- a/apps/frontend/src/app/globals.css
+++ b/apps/frontend/src/app/globals.css
@@ -80,4 +80,26 @@ h6 {
   body.screen-shake {
     animation: global-screen-shake 0.5s ease-in-out;
   }
+}
+
+/* Sabotage Body-level Distortions */
+body.sabotage-blur {
+  filter: blur(2px);
+}
+body.sabotage-comic-sans * {
+  font-family: 'Comic Sans MS', 'Comic Sans', cursive !important;
+}
+body.sabotage-papyrus * {
+  font-family: 'Papyrus', fantasy !important;
+}
+
+/* Sabotage Row-level Distortions */
+.post-blur {
+  filter: blur(4px);
+}
+.post-comic-sans * {
+  font-family: 'Comic Sans MS', 'Comic Sans', cursive !important;
+}
+.post-papyrus * {
+  font-family: 'Papyrus', fantasy !important;
 }
\ No newline at end of file
diff --git a/apps/frontend/src/app/layout.tsx b/apps/frontend/src/app/layout.tsx
index c1aa3d9..f4ca976 100644
--- a/apps/frontend/src/app/layout.tsx
+++ b/apps/frontend/src/app/layout.tsx
@@ -1,5 +1,6 @@
 import type { Metadata } from 'next';
 import { Inter, Outfit } from 'next/font/google';
+import ChaosListener from '@/domains/sabotage/components/ChaosListener';
 import './globals.css';
 
 const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
@@ -18,6 +19,7 @@ export default function RootLayout({
   return (
     <html lang="en">
       <body className={`${inter.variable} ${outfit.variable}`}>
+        <ChaosListener />
         {children}
       </body>
     </html>
diff --git a/apps/frontend/src/core/store/useChaosStore.ts b/apps/frontend/src/core/store/useChaosStore.ts
new file mode 100644
index 0000000..4425533
--- /dev/null
+++ b/apps/frontend/src/core/store/useChaosStore.ts
@@ -0,0 +1,35 @@
+import { create } from 'zustand';
+
+export interface ActiveSabotage {
+  id: string;
+  targetId: string;
+  effectType: string;
+  authorId: string;
+  expiresAt: number;
+}
+
+interface ChaosState {
+  activeSabotages: ActiveSabotage[];
+  addSabotage: (sabotage: ActiveSabotage) => void;
+  removeSabotage: (id: string) => void;
+  clearExpired: () => void;
+}
+
+export const useChaosStore = create<ChaosState>((set) => ({
+  activeSabotages: [],
+  addSabotage: (sabotage) =>
+    set((state) => ({
+      activeSabotages: [...state.activeSabotages.filter((s) => s.id !== sabotage.id), sabotage],
+    })),
+  removeSabotage: (id) =>
+    set((state) => ({
+      activeSabotages: state.activeSabotages.filter((s) => s.id !== id),
+    })),
+  clearExpired: () =>
+    set((state) => {
+      const now = Date.now();
+      return {
+        activeSabotages: state.activeSabotages.filter((s) => s.expiresAt > now),
+      };
+    }),
+}));
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
index 9019beb..624ca86 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
@@ -200,6 +200,51 @@
   display: flex;
 }
 
+.actionButtons {
+  display: flex;
+  gap: 0.5rem;
+  align-items: center;
+}
+
+.sabotageBtn {
+  background: #dc2626;
+  color: #ffffff;
+  border: 1px solid #b91c1c;
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
+  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
+}
+
+.sabotageBtn:hover {
+  background: #b91c1c;
+  transform: translateY(-1px);
+  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
+}
+
+.sabotageBtn:active {
+  transform: translateY(0);
+}
+
+.srOnly {
+  position: absolute;
+  width: 1px;
+  height: 1px;
+  padding: 0;
+  margin: -1px;
+  overflow: hidden;
+  clip: rect(0, 0, 0, 0);
+  white-space: nowrap;
+  border: 0;
+}
+
 @media (max-width: 768px) {
   .headerRow {
     display: none;
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
index b0c5af6..547002c 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
@@ -7,6 +7,8 @@ import GoldenRaspberryBadge from './GoldenRaspberryBadge';
 import CommentSection from './CommentSection';
 import { useAuthStore } from '../../../core/store/useAuthStore';
 import EvasiveButton from '../../anti-ux/components/EvasiveButton';
+import SabotageSelectionModal from '../../sabotage/components/SabotageSelectionModal';
+import { useChaosStore } from '../../../core/store/useChaosStore';
 import styles from './LeaderboardGrid.module.css';
 
 const AVATAR_MAP: Record<string, string> = {
@@ -24,6 +26,13 @@ export default function LeaderboardGrid() {
   const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const currentUser = useAuthStore((state) => state.user);
+  const activeSabotages = useChaosStore((state) => state.activeSabotages);
+  const [isModalOpen, setIsModalOpen] = useState(false);
+  const [selectedSabotagePost, setSelectedSabotagePost] = useState<{
+    id: string;
+    title: string;
+    authorId: string;
+  } | null>(null);
 
   useEffect(() => {
     // 1. Fetch initial leaderboard data
@@ -93,13 +102,21 @@ export default function LeaderboardGrid() {
         {posts.map((post, index) => {
           const isFirst = index === 0;
           const isExpanded = expandedPostId === post.id;
+
+          // Check if this post is targeted by active sabotages where current user is NOT the author
+          const postSabotages = activeSabotages.filter(
+            (s) => s.targetId === post.id && s.authorId !== currentUser?.id && s.effectType !== 'deduct_calories'
+          );
+          const isDistorted = postSabotages.length > 0;
+          const rowDistortionClasses = postSabotages.map((s) => `post-${s.effectType}`).join(' ');
+
           return (
             <div
               key={post.id}
               className={`${styles.postRowWrapper} ${isFirst ? styles.firstPlace : ''}`}
             >
               <div
-                className={styles.postRow}
+                className={`${styles.postRow} ${rowDistortionClasses}`}
                 onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                 role="button"
                 aria-expanded={isExpanded}
@@ -111,10 +128,17 @@ export default function LeaderboardGrid() {
                   }
                 }}
               >
-                <div className={styles.colRank}>
+                {/* Screen Reader Bypass - read clean text block if distorted */}
+                {isDistorted && (
+                  <div className={styles.srOnly}>
+                    Rank {index + 1}. Innovator: {post.author.username}. Idea: {post.title} - {post.content}. Wasted calories: {post.wastedCalories} kcal.
+                  </div>
+                )}
+
+                <div className={styles.colRank} aria-hidden={isDistorted ? "true" : undefined}>
                   <span className={styles.rankBadge}>{index + 1}</span>
                 </div>
-                <div className={styles.colAuthor}>
+                <div className={styles.colAuthor} aria-hidden={isDistorted ? "true" : undefined}>
                   <span className={styles.authorAvatar} role="img" aria-label={post.author.avatar}>
                     {AVATAR_MAP[post.author.avatar] || '👤'}
                   </span>
@@ -125,20 +149,42 @@ export default function LeaderboardGrid() {
                     )}
                   </span>
                 </div>
-                <div className={styles.colTitle}>
+                <div className={styles.colTitle} aria-hidden={isDistorted ? "true" : undefined}>
                   <div className={styles.postTitleText}>{post.title}</div>
                   <p className={styles.postSnippet}>{post.content}</p>
                 </div>
                 <div className={styles.colScore}>
                   <div className={styles.scoreContainer}>
-                    <span className={styles.scoreValue}>{post.wastedCalories} kcal</span>
+                    <span className={styles.scoreValue} aria-hidden={isDistorted ? "true" : undefined}>
+                      {post.wastedCalories} kcal
+                    </span>
                     {isFirst && (
-                      <div className={styles.badgeWrapper}>
+                      <div className={styles.badgeWrapper} aria-hidden={isDistorted ? "true" : undefined}>
                         <GoldenRaspberryBadge />
                       </div>
                     )}
-                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
-                      <EvasiveButton targetId={post.id} targetType="post" />
+                    <div className={styles.actionButtons}>
+                      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
+                        <EvasiveButton targetId={post.id} targetType="post" />
+                      </div>
+                      {currentUser && (
+                        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
+                          <button
+                            className={styles.sabotageBtn}
+                            onClick={() => {
+                              setSelectedSabotagePost({
+                                id: post.id,
+                                title: post.title,
+                                authorId: post.author.id,
+                              });
+                              setIsModalOpen(true);
+                            }}
+                            aria-label={`Sabotage post by ${post.author.username}`}
+                          >
+                            Sabotage 😈
+                          </button>
+                        </div>
+                      )}
                     </div>
                   </div>
                 </div>
@@ -150,6 +196,18 @@ export default function LeaderboardGrid() {
           );
         })}
       </div>
+      {selectedSabotagePost && (
+        <SabotageSelectionModal
+          isOpen={isModalOpen}
+          onClose={() => {
+            setIsModalOpen(false);
+            setSelectedSabotagePost(null);
+          }}
+          postId={selectedSabotagePost.id}
+          postTitle={selectedSabotagePost.title}
+          postAuthorId={selectedSabotagePost.authorId}
+        />
+      )}
     </div>
   );
 }
diff --git a/apps/frontend/src/domains/sabotage/components/ChaosListener.tsx b/apps/frontend/src/domains/sabotage/components/ChaosListener.tsx
new file mode 100644
index 0000000..3c0bd26
--- /dev/null
+++ b/apps/frontend/src/domains/sabotage/components/ChaosListener.tsx
@@ -0,0 +1,69 @@
+'use client';
+
+import { useEffect } from 'react';
+import { socket } from '@/core/api/socket.client';
+import { useChaosStore } from '@/core/store/useChaosStore';
+import { useAuthStore } from '@/core/store/useAuthStore';
+
+export default function ChaosListener() {
+  const addSabotage = useChaosStore((s) => s.addSabotage);
+  const clearExpired = useChaosStore((s) => s.clearExpired);
+  const activeSabotages = useChaosStore((s) => s.activeSabotages);
+  const currentUser = useAuthStore((s) => s.user);
+
+  useEffect(() => {
+    if (!socket) return;
+    
+    if (!socket.connected) {
+      socket.connect();
+    }
+
+    const handleSabotage = (data: { targetId: string; effectType: string; authorId: string }) => {
+      addSabotage({
+        id: Math.random().toString(),
+        targetId: data.targetId,
+        effectType: data.effectType,
+        authorId: data.authorId,
+        expiresAt: Date.now() + 15000,
+      });
+    };
+
+    socket.on('sabotage.deployed', handleSabotage);
+
+    return () => {
+      if (socket) {
+        socket.off('sabotage.deployed', handleSabotage);
+      }
+    };
+  }, [addSabotage]);
+
+  useEffect(() => {
+    const interval = setInterval(() => {
+      clearExpired();
+    }, 1000);
+
+    return () => clearInterval(interval);
+  }, [clearExpired]);
+
+  useEffect(() => {
+    // Clear all sabotage classes first
+    document.body.classList.remove('sabotage-blur', 'sabotage-comic-sans', 'sabotage-papyrus');
+
+    if (currentUser) {
+      const targetSabotages = activeSabotages.filter(
+        (s) => s.authorId === currentUser.id && s.effectType !== 'deduct_calories'
+      );
+      targetSabotages.forEach((s) => {
+        document.body.classList.add(`sabotage-${s.effectType}`);
+      });
+    }
+  }, [activeSabotages, currentUser]);
+
+  useEffect(() => {
+    return () => {
+      document.body.classList.remove('sabotage-blur', 'sabotage-comic-sans', 'sabotage-papyrus');
+    };
+  }, []);
+
+  return null;
+}
diff --git a/apps/frontend/src/domains/sabotage/components/SabotageSelectionModal.module.css b/apps/frontend/src/domains/sabotage/components/SabotageSelectionModal.module.css
new file mode 100644
index 0000000..e91ddd1
--- /dev/null
+++ b/apps/frontend/src/domains/sabotage/components/SabotageSelectionModal.module.css
@@ -0,0 +1,324 @@
+.overlay {
+  position: fixed;
+  top: 0;
+  left: 0;
+  right: 0;
+  bottom: 0;
+  background-color: rgba(15, 23, 42, 0.4);
+  backdrop-filter: blur(8px);
+  z-index: 1000;
+  display: flex;
+  justify-content: center;
+  align-items: center;
+  padding: 1rem;
+  animation: fadeIn 0.25s ease-out;
+}
+
+.modal {
+  background: #ffffff;
+  border: 1px solid #e2e8f0;
+  border-radius: 16px;
+  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
+  width: 100%;
+  max-width: 600px;
+  max-height: 90vh;
+  overflow-y: auto;
+  position: relative;
+  font-family: var(--font-body);
+  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
+}
+
+.header {
+  display: flex;
+  justify-content: space-between;
+  align-items: flex-start;
+  padding: 1.5rem 2rem 0.75rem 2rem;
+}
+
+.titleContainer {
+  flex: 1;
+}
+
+.title {
+  font-family: var(--font-heading);
+  font-weight: 800;
+  font-size: 1.5rem;
+  color: #0f172a;
+  margin: 0 0 0.25rem 0;
+}
+
+.subtitle {
+  font-size: 0.9rem;
+  color: #64748b;
+  margin: 0;
+  line-height: 1.4;
+}
+
+.closeBtn {
+  background: transparent;
+  border: none;
+  font-size: 1.5rem;
+  cursor: pointer;
+  color: #94a3b8;
+  padding: 0.25rem;
+  line-height: 1;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  transition: color 0.2s ease, transform 0.2s ease;
+  border-radius: 50%;
+  width: 32px;
+  height: 32px;
+}
+
+.closeBtn:hover {
+  color: #475569;
+  background-color: #f1f5f9;
+  transform: rotate(90deg);
+}
+
+.modalContent {
+  padding: 0 2rem 2rem 2rem;
+}
+
+.inventorySection {
+  margin-top: 1rem;
+}
+
+.inventoryGrid {
+  display: grid;
+  grid-template-columns: repeat(2, 1fr);
+  gap: 1rem;
+  margin-bottom: 1.5rem;
+}
+
+.inventoryCard {
+  border: 2px solid #e2e8f0;
+  border-radius: 12px;
+  padding: 1rem;
+  cursor: pointer;
+  transition: all 0.2s ease;
+  background: #ffffff;
+  display: flex;
+  flex-direction: column;
+  position: relative;
+  overflow: hidden;
+}
+
+.inventoryCard:hover:not(.disabled) {
+  border-color: #3b82f6;
+  transform: translateY(-2px);
+  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
+}
+
+.inventoryCard.selected {
+  border-color: #3b82f6;
+  background: #eff6ff;
+}
+
+.inventoryCard.disabled {
+  opacity: 0.6;
+  cursor: not-allowed;
+  background: #f8fafc;
+}
+
+.cardHeader {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  margin-bottom: 0.5rem;
+}
+
+.cardName {
+  font-family: var(--font-heading);
+  font-weight: 700;
+  font-size: 1.1rem;
+  color: #0f172a;
+}
+
+.cardCount {
+  font-size: 0.8rem;
+  font-weight: 700;
+  padding: 0.25rem 0.5rem;
+  background: #f1f5f9;
+  color: #475569;
+  border-radius: 9999px;
+  transition: all 0.2s ease;
+}
+
+.selected .cardCount {
+  background: #3b82f6;
+  color: #ffffff;
+}
+
+.cardDescription {
+  font-size: 0.85rem;
+  color: #64748b;
+  margin: 0 0 0.75rem 0;
+  line-height: 1.35;
+  flex: 1;
+}
+
+.cardEffect {
+  font-size: 0.8rem;
+  font-weight: 600;
+  color: #ef4444;
+}
+
+.emptyState {
+  text-align: center;
+  padding: 2rem;
+  background: #f8fafc;
+  border-radius: 12px;
+  border: 1px dashed #cbd5e1;
+  margin-bottom: 1.5rem;
+}
+
+.emptyText {
+  color: #64748b;
+  font-size: 0.95rem;
+  margin-bottom: 1rem;
+}
+
+.storeLink {
+  display: inline-block;
+  font-family: var(--font-heading);
+  font-weight: 700;
+  font-size: 0.95rem;
+  color: #3b82f6;
+  text-decoration: none;
+  transition: color 0.2s ease;
+}
+
+.storeLink:hover {
+  color: #1d4ed8;
+  text-decoration: underline;
+}
+
+.actions {
+  display: flex;
+  justify-content: flex-end;
+  gap: 0.75rem;
+  margin-top: 1rem;
+}
+
+.cancelBtn {
+  font-family: var(--font-heading);
+  font-size: 0.95rem;
+  font-weight: 700;
+  padding: 0.75rem 1.5rem;
+  border-radius: 10px;
+  cursor: pointer;
+  background: #f1f5f9;
+  color: #475569;
+  border: 1px solid #e2e8f0;
+  transition: all 0.2s ease;
+}
+
+.cancelBtn:hover {
+  background: #e2e8f0;
+  color: #0f172a;
+}
+
+.deployBtn {
+  font-family: var(--font-heading);
+  font-size: 0.95rem;
+  font-weight: 700;
+  padding: 0.75rem 1.5rem;
+  border-radius: 10px;
+  cursor: pointer;
+  background: #ef4444;
+  color: #ffffff;
+  border: none;
+  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15);
+  transition: all 0.2s ease;
+}
+
+.deployBtn:hover:not(:disabled) {
+  background: #dc2626;
+  transform: translateY(-1px);
+}
+
+.deployBtn:disabled {
+  background: #cbd5e1;
+  color: #94a3b8;
+  box-shadow: none;
+  cursor: not-allowed;
+}
+
+.message {
+  padding: 0.75rem 1rem;
+  border-radius: 8px;
+  font-size: 0.9rem;
+  margin-bottom: 1rem;
+}
+
+.error {
+  background: #fef2f2;
+  border: 1px solid #fca5a5;
+  color: #ef4444;
+}
+
+.success {
+  background: #f0fdf4;
+  border: 1px solid #bbf7d0;
+  color: #16a34a;
+}
+
+.loadingContainer {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  justify-content: center;
+  padding: 3rem;
+}
+
+.spinner {
+  width: 32px;
+  height: 32px;
+  border: 3px solid #cbd5e1;
+  border-top-color: #3b82f6;
+  border-radius: 50%;
+  animation: spin 0.8s linear infinite;
+  margin-bottom: 1rem;
+}
+
+@keyframes spin {
+  to {
+    transform: rotate(360deg);
+  }
+}
+
+@keyframes fadeIn {
+  from {
+    opacity: 0;
+  }
+  to {
+    opacity: 1;
+  }
+}
+
+@keyframes scaleIn {
+  from {
+    opacity: 0;
+    transform: scale(0.95) translateY(10px);
+  }
+  to {
+    opacity: 1;
+    transform: scale(1) translateY(0);
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+  .overlay,
+  .modal,
+  .closeBtn,
+  .deployBtn,
+  .cancelBtn,
+  .inventoryCard,
+  .spinner {
+    animation: none !important;
+    transition: none !important;
+    transform: none !important;
+  }
+}
diff --git a/apps/frontend/src/domains/sabotage/components/SabotageSelectionModal.tsx b/apps/frontend/src/domains/sabotage/components/SabotageSelectionModal.tsx
new file mode 100644
index 0000000..08b1ca1
--- /dev/null
+++ b/apps/frontend/src/domains/sabotage/components/SabotageSelectionModal.tsx
@@ -0,0 +1,247 @@
+'use client';
+
+import React, { useState, useEffect, useRef, useTransition } from 'react';
+import Link from 'next/link';
+import { actionGetUserInventory, actionDeploySabotage } from '../../../app/actions/sabotage';
+import styles from './SabotageSelectionModal.module.css';
+
+interface SabotageSelectionModalProps {
+  isOpen: boolean;
+  onClose: () => void;
+  postId: string;
+  postTitle: string;
+  postAuthorId: string;
+}
+
+const SABOTAGE_TYPES = [
+  {
+    effectType: 'blur',
+    name: 'Blur Pack',
+    description: "Blurs the targeted user's screen and their post on the leaderboard.",
+    effect: 'Deducts 100 kcal',
+  },
+  {
+    effectType: 'comic_sans',
+    name: 'Comic Sans Pack',
+    description: "Forces the targeted user's UI to render in Comic Sans.",
+    effect: 'Deducts 150 kcal',
+  },
+  {
+    effectType: 'papyrus',
+    name: 'Papyrus Pack',
+    description: "Forces the targeted user's UI to render in Papyrus.",
+    effect: 'Deducts 150 kcal',
+  },
+  {
+    effectType: 'deduct_calories',
+    name: 'Calories Deduction',
+    description: "A heavy direct hit to the target post's wasted calories.",
+    effect: 'Deducts 500 kcal',
+  },
+] as const;
+
+export default function SabotageSelectionModal({
+  isOpen,
+  onClose,
+  postId,
+  postTitle,
+  postAuthorId,
+}: SabotageSelectionModalProps) {
+  const [inventory, setInventory] = useState<Record<string, number>>({
+    blur: 0,
+    comic_sans: 0,
+    papyrus: 0,
+    deduct_calories: 0,
+  });
+  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
+  const [error, setError] = useState<string | null>(null);
+  const [success, setSuccess] = useState<boolean>(false);
+  const [isPending, startTransition] = useTransition();
+  const [isDeploying, startDeployTransition] = useTransition();
+
+  const modalRef = useRef<HTMLDivElement>(null);
+
+  useEffect(() => {
+    const handleKeyDown = (e: KeyboardEvent) => {
+      if (e.key === 'Escape' && isOpen) {
+        onClose();
+      }
+    };
+    window.addEventListener('keydown', handleKeyDown);
+    return () => window.removeEventListener('keydown', handleKeyDown);
+  }, [isOpen, onClose]);
+
+  useEffect(() => {
+    if (isOpen) {
+      modalRef.current?.focus();
+      setError(null);
+      setSuccess(false);
+      setSelectedEffect(null);
+
+      // Fetch user inventory
+      startTransition(async () => {
+        const res = await actionGetUserInventory();
+        if (res.success && res.data) {
+          const invMap: Record<string, number> = {
+            blur: 0,
+            comic_sans: 0,
+            papyrus: 0,
+            deduct_calories: 0,
+          };
+          res.data.forEach((item) => {
+            invMap[item.effectType] = item.count;
+          });
+          setInventory(invMap);
+        } else {
+          setError(res.error?.message || 'Failed to fetch inventory.');
+        }
+      });
+    }
+  }, [isOpen]);
+
+  if (!isOpen) return null;
+
+  const handleDeploy = () => {
+    if (!selectedEffect) return;
+    const count = inventory[selectedEffect] || 0;
+    if (count <= 0) return;
+
+    setError(null);
+    setSuccess(false);
+
+    startDeployTransition(async () => {
+      const res = await actionDeploySabotage(postId, selectedEffect);
+      if (res.success) {
+        setSuccess(true);
+        // Decrement local inventory count
+        setInventory((prev) => ({
+          ...prev,
+          [selectedEffect]: Math.max(0, prev[selectedEffect] - 1),
+        }));
+        setTimeout(() => {
+          onClose();
+        }, 1500);
+      } else {
+        setError(res.error?.message || 'Failed to deploy sabotage.');
+      }
+    });
+  };
+
+  const totalInventoryCount = Object.values(inventory).reduce((a, b) => a + b, 0);
+
+  return (
+    <div className={styles.overlay} onClick={onClose}>
+      <div
+        ref={modalRef}
+        className={styles.modal}
+        onClick={(e) => e.stopPropagation()}
+        role="dialog"
+        aria-modal="true"
+        aria-labelledby="sabotage-modal-title"
+        tabIndex={-1}
+      >
+        <div className={styles.header}>
+          <div className={styles.titleContainer}>
+            <h2 id="sabotage-modal-title" className={styles.title}>
+              Sabotage Paradigm 😈
+            </h2>
+            <p className={styles.subtitle}>
+              Deploy a visual disruption against <strong>{postTitle}</strong>.
+            </p>
+          </div>
+          <button
+            className={styles.closeBtn}
+            onClick={onClose}
+            aria-label="Close modal"
+            disabled={isDeploying}
+          >
+            &times;
+          </button>
+        </div>
+
+        <div className={styles.modalContent}>
+          {error && (
+            <div className={`${styles.message} ${styles.error}`} role="alert">
+              ⚠️ {error}
+            </div>
+          )}
+
+          {success && (
+            <div className={`${styles.message} ${styles.success}`} role="alert">
+              🎉 Sabotage deployed successfully! Score has been deducted.
+            </div>
+          )}
+
+          {isPending ? (
+            <div className={styles.loadingContainer}>
+              <div className={styles.spinner} role="status"></div>
+              <p>Opening your arsenal...</p>
+            </div>
+          ) : (
+            <div className={styles.inventorySection}>
+              {totalInventoryCount === 0 ? (
+                <div className={styles.emptyState}>
+                  <p className={styles.emptyText}>
+                    Nice try, but your arsenal is empty. Visit the store to buy some power first!
+                  </p>
+                  <Link href="/sabotage-store" className={styles.storeLink} onClick={onClose}>
+                    🛒 Restock at the Sabotage Storefront
+                  </Link>
+                </div>
+              ) : (
+                <>
+                  <div className={styles.inventoryGrid}>
+                    {SABOTAGE_TYPES.map((type) => {
+                      const count = inventory[type.effectType] || 0;
+                      const isDisabled = count <= 0 || isDeploying;
+                      const isSelected = selectedEffect === type.effectType;
+
+                      return (
+                        <div
+                          key={type.effectType}
+                          className={`${styles.inventoryCard} ${isSelected ? styles.selected : ''
+                            } ${isDisabled ? styles.disabled : ''}`}
+                          onClick={() => {
+                            if (!isDisabled) {
+                              setSelectedEffect(isSelected ? null : type.effectType);
+                            }
+                          }}
+                        >
+                          <div className={styles.cardHeader}>
+                            <span className={styles.cardName}>{type.name}</span>
+                            <span className={styles.cardCount}>Owned: {count}</span>
+                          </div>
+                          <p className={styles.cardDescription}>{type.description}</p>
+                          <span className={styles.cardEffect}>{type.effect}</span>
+                        </div>
+                      );
+                    })}
+                  </div>
+
+                  <div className={styles.actions}>
+                    <button
+                      type="button"
+                      className={styles.cancelBtn}
+                      onClick={onClose}
+                      disabled={isDeploying}
+                    >
+                      Cancel
+                    </button>
+                    <button
+                      type="button"
+                      className={styles.deployBtn}
+                      onClick={handleDeploy}
+                      disabled={!selectedEffect || isDeploying}
+                    >
+                      {isDeploying ? 'Deploying...' : 'Deploy'}
+                    </button>
+                  </div>
+                </>
+              )}
+            </div>
+          )}
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/test-results/.last-run.json b/test-results/.last-run.json
index cbcc1fb..59c67e2 100644
--- a/test-results/.last-run.json
+++ b/test-results/.last-run.json
@@ -1,4 +1,7 @@
 {
-  "status": "passed",
-  "failedTests": []
+  "status": "failed",
+  "failedTests": [
+    "255d3433a6aded2a6061-dc023932b403adc8272c",
+    "0394ea5bd1b8ace59db5-07faf36392e484a884ee"
+  ]
 }
\ No newline at end of file
diff --git a/tests/e2e/sabotage-broadcast.spec.ts b/tests/e2e/sabotage-broadcast.spec.ts
new file mode 100644
index 0000000..2ae8c46
--- /dev/null
+++ b/tests/e2e/sabotage-broadcast.spec.ts
@@ -0,0 +1,125 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Real-Time Sabotage Broadcast E2E Flow', () => {
+  test('should register two users, buy/deploy a sabotage pack, and broadcast real-time visual distortion & score updates', async ({ browser }) => {
+    test.setTimeout(90000);
+    // 1. Create Context A and User A
+    const contextA = await browser.newContext();
+    const pageA = await contextA.newPage();
+    await contextA.clearCookies();
+
+    // Register User A
+    await pageA.goto('/auth');
+    await pageA.click('button:has-text("Register now")');
+    const userAUsername = `usera_${Date.now()}`;
+    await pageA.fill('#username', userAUsername);
+    await pageA.fill('#password', 'pass1234');
+    await pageA.click('button[type="submit"]');
+    await expect(pageA).toHaveURL(/\/profile/);
+
+    // Create a post as User A
+    await pageA.goto('/');
+    await pageA.click('button:has-text("Propose a Paradigm")');
+    const titleInput = pageA.locator('#post-title-input');
+    const postTitle = `Leverage synergy paradigm A ${Date.now()}`;
+    await titleInput.fill(postTitle);
+    const contentInput = pageA.locator('#post-content-input');
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await pageA.click('button:has-text("Propose Paradigm")');
+
+    // Solve Ad Captcha
+    await expect(pageA.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const postAdText = await pageA.locator('#sponsor-ad-text').textContent();
+    expect(postAdText).not.toBeNull();
+    await pageA.fill('#ad-verification-input', postAdText!);
+    await pageA.click('button:has-text("Verify & Submit")');
+
+    // Wait for the modal to close and verify post is on the leaderboard
+    await expect(pageA.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });
+    const postRowLocator = pageA.locator('div[class*="postRowWrapper"]').filter({ hasText: postTitle });
+    await expect(postRowLocator).toBeVisible();
+
+    // Read the initial score of the post
+    const initialScoreText = await postRowLocator.locator(`[class*="scoreValue"]`).textContent();
+    expect(initialScoreText).not.toBeNull();
+    const initialScoreNumber = parseInt(initialScoreText!.replace(/[^0-9]/g, ''));
+
+    // 2. Create Context B and User B
+    const contextB = await browser.newContext();
+    const pageB = await contextB.newPage();
+    await contextB.clearCookies();
+
+    // Register User B
+    await pageB.goto('/auth');
+    await pageB.click('button:has-text("Register now")');
+    const userBUsername = `userb_${Date.now()}`;
+    await pageB.fill('#username', userBUsername);
+    await pageB.fill('#password', 'pass1234');
+    await pageB.click('button[type="submit"]');
+    await expect(pageB).toHaveURL(/\/profile/);
+
+    // Go to Sabotage Store and purchase a Blur Pack
+    await pageB.goto('/sabotage-store');
+    await expect(pageB.locator('[data-testid="inv-blur"]')).toContainText('0');
+    await pageB.locator('[data-testid="buy-button-blur"]').click();
+    await expect(pageB.locator('[data-testid="checkout-success-banner"]')).toBeVisible();
+    await expect(pageB.locator('[data-testid="inv-blur"]')).toContainText('1');
+
+    // Close checkout success banner
+    await pageB.locator('[data-testid="checkout-success-banner"] button').click();
+
+    // Navigate to Leaderboard
+    await pageB.goto('/');
+
+    // Find User A's post row on Page B
+    const postRowOnB = pageB.locator('div[class*="postRowWrapper"]').filter({ hasText: postTitle });
+    await expect(postRowOnB).toBeVisible();
+
+    // Click "Sabotage 😈" trigger button
+    await postRowOnB.locator('button:has-text("Sabotage 😈")').click();
+
+    // Verify modal is displayed and retrieve inventory count
+    await expect(pageB.locator('h2:has-text("Sabotage Paradigm")')).toBeVisible();
+    await pageB.locator('div[class*="inventoryCard"]').filter({ hasText: 'Blur Pack' }).click();
+
+    // Deploy visual sabotage
+    await pageB.locator('button:has-text("Deploy")').click();
+
+    // Verify success confirmation and wait for modal to auto-close
+    await expect(pageB.locator('text=Sabotage deployed successfully!')).toBeVisible();
+    await expect(pageB.locator('h2:has-text("Sabotage Paradigm")')).not.toBeVisible({ timeout: 5000 });
+
+    // Verify score is decremented by 100 kcal in real time on both Page A and Page B
+    const expectedScoreText = `${initialScoreNumber - 100} kcal`;
+    await expect(postRowOnB.locator(`[class*="scoreValue"]`)).toHaveText(expectedScoreText);
+    await expect(postRowLocator.locator(`[class*="scoreValue"]`)).toHaveText(expectedScoreText);
+
+    // Verify row-level distortion is applied on Page B (non-author)
+    const postRowElementOnB = postRowOnB.locator('div[class*="postRow"]:not([class*="postRowWrapper"])');
+    await expect(postRowElementOnB).toHaveClass(/post-blur/);
+
+    // Verify screen reader bypass is active on Page B
+    const srOnlyOnB = postRowOnB.locator('div[class*="srOnly"]');
+    await expect(srOnlyOnB).toBeVisible();
+    await expect(srOnlyOnB).toContainText(userAUsername);
+
+    // Verify distorted title block has aria-hidden="true" set on Page B
+    const titleColOnB = postRowOnB.locator('div[class*="colTitle"]');
+    await expect(titleColOnB).toHaveAttribute('aria-hidden', 'true');
+
+    // Verify global body-level distortion is applied on Page A (author)
+    const bodyOnA = pageA.locator('body');
+    await expect(bodyOnA).toHaveClass(/sabotage-blur/);
+
+    // Wait 15 seconds for the sabotage duration to expire (using a 16s timeout to be safe)
+    await pageB.waitForTimeout(16000);
+
+    // Verify visual classes are fully cleared and original styling restored
+    await expect(postRowElementOnB).not.toHaveClass(/post-blur/);
+    await expect(bodyOnA).not.toHaveClass(/sabotage-blur/);
+
+    // Close both browser contexts
+    await contextA.close();
+    await contextB.close();
+  });
+});
```
