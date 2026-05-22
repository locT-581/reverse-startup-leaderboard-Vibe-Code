---
story_id: 3.3
story_key: 3-3-real-time-sabotage-broadcast
epic_num: 3
story_num: 3
epic_title: Troll Capitalism - The Sabotage Store
story_title: Real-Time Sabotage Broadcast
status: done
---

# Story 3.3: Real-Time Sabotage Broadcast

Status: done

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
 
- [x] **Task 1: Backend WebSocket Gateway Integration** (AC: 3)
  - [x] Add `emitSabotage(targetId: string, effectType: string, authorId: string)` in `LeaderboardGateway` (`apps/backend/src/leaderboard/leaderboard.gateway.ts`) to emit `sabotage.deployed` events.
  - [x] In `apps/backend/src/sabotage/sabotage.module.ts`, import `forwardRef(() => LeaderboardModule)` to resolve circular dependencies and gain access to the gateway.
- [x] **Task 2: Backend Deploy Endpoint & Service Logic** (AC: 3)
  - [x] Create `@Post('deploy')` in `SabotageController` (`apps/backend/src/sabotage/sabotage.controller.ts`), guarded by `JwtAuthGuard`.
  - [x] Implement `deploySabotage(userId: string, postId: string, effectType: string)` in `SabotageService` (`apps/backend/src/sabotage/sabotage.service.ts`):
    - [x] Retrieve the user's inventory count for `effectType`. If <= 0, throw a `BadRequestException` with a sarcastic error message (e.g. "Nice try, but your arsenal is empty. Visit the store to buy some power first!").
    - [x] Retrieve the target post. Throw `NotFoundException` if it doesn't exist.
    - [x] Update the database in a transaction:
      - [x] Decrement `user_sabotages.count` by 1.
      - [x] Calculate score deduction: `blur` (-100), `comic_sans` (-150), `papyrus` (-150), `deduct_calories` (-500).
      - [x] Update the post's `wastedCalories` (ensure a lower bound of 0).
    - [x] Call `LeaderboardGateway.broadcastLeaderboard()` to update everyone's scores.
    - [x] Call `LeaderboardGateway.emitSabotage(postId, effectType, post.authorId)` to broadcast the visual effect.
- [x] **Task 3: Frontend Server Actions & State Management** (AC: 2, 4, 5, 7)
  - [x] Implement `actionDeploySabotage(postId: string, effectType: string)` Server Action in `apps/frontend/src/app/actions/sabotage.ts`.
  - [x] Create `useChaosStore.ts` Zustand store in `apps/frontend/src/core/store/useChaosStore.ts`:
    - [x] State: `activeSabotages` as `{ id: string; targetId: string; effectType: string; authorId: string; expiresAt: number }[]`.
    - [x] Actions: `addSabotage`, `removeSabotage`, `clearExpired`.
  - [x] Create a client-side component `ChaosListener.tsx` (rendered in the root layout or root page):
    - [x] Connect to the Socket and listen for `sabotage.deployed`.
    - [x] Upon receiving the event, compute `expiresAt` (15 seconds from now) and call `addSabotage`.
    - [x] Periodically or via timeout clear expired sabotages.
    - [x] Monitor active sabotages: if any active sabotage matches `currentUser.id` as the `authorId`, dynamically add classes to `document.body` (e.g., `sabotage-blur`, `sabotage-comic-sans`, `sabotage-papyrus`). Remove them when no active matching sabotages remain.
- [x] **Task 4: UI Components & Styles** (AC: 1, 2, 5, 6, 8)
  - [x] Add class definitions to `apps/frontend/src/app/globals.css`:
    - [x] Body-level: `.sabotage-blur` (`filter: blur(2px)`), `.sabotage-comic-sans` (`font-family: 'Comic Sans MS', 'Comic Sans', cursive !important`), `.sabotage-papyrus` (`font-family: 'Papyrus', fantasy !important`).
    - [x] Row-level: `.post-blur` (`filter: blur(4px)`), `.post-comic-sans` (Comic Sans font), `.post-papyrus` (Papyrus font).
    - [x] Implement accessibility safety: ensure no motion-intensive animations run under `@media (prefers-reduced-motion: reduce)`.
  - [x] Create `SabotageSelectionModal.tsx` in `apps/frontend/src/domains/sabotage/components/`:
    - [x] Show count of each Sabotage type currently owned.
    - [x] Enable "Deploy" button if inventory count > 0.
    - [x] If inventory count is 0, show a link to the storefront: "Restock at the Sabotage Storefront".
    - [x] Wrap deployment in a standard transition spinner or loading text.
  - [x] Update `LeaderboardGrid.tsx` to:
    - [x] Add the "Sabotage 😈" trigger button to each post row.
    - [x] Wire it up to open `SabotageSelectionModal` with the post's ID.
    - [x] Read from `useChaosStore` to conditionally apply row-level classes (`.post-blur`, etc.) when the post is targeted.
    - [x] Ensure that for visual distortion, there is alternative descriptive hidden text so screen readers bypass the CSS sabotage effect.
- [x] **Task 5: E2E Playwright Testing** (AC: 1-8)
  - [x] Create `tests/e2e/sabotage-broadcast.spec.ts`:
    - [x] Register User A and create a post.
    - [x] Register User B, navigate to storefront, and buy a Blur Pack (inventory becomes 1).
    - [x] User B goes back to Leaderboard, clicks "Sabotage" on User A's post, opens modal, and clicks deploy.
    - [x] Verify User B's inventory is now 0.
    - [x] Verify User A's post score is decremented by 100 kcal on the leaderboard.
    - [x] Verify User A's post row has `.post-blur` or blur style applied.
    - [x] Authenticate as User A and verify that User A's screen body has `.sabotage-blur` class applied.
    - [x] Fast-forward or wait 15 seconds and verify the class is removed.moved.

### Review Findings

- [x] [Review][Patch] Prevent Self-Sabotage [apps/backend/src/sabotage/sabotage.service.ts:150] — Implement a check to prevent users from deploying sabotage packs against their own posts.
- [x] [Review][Patch] Double-Spend Concurrency Bug in Inventory Count [apps/backend/src/sabotage/sabotage.service.ts:114-134] — User inventory count is queried outside the database transaction, leading to double-spend race conditions where concurrent requests deploy multiple sabotages using a single owned item.
- [x] [Review][Patch] Lost Update Concurrency Bug in Post Score [apps/backend/src/sabotage/sabotage.service.ts:136-198] — Wasted calories are calculated and updated based on pre-fetched state outside the database transaction, leading to lost updates when multiple clients target the same post concurrently.
- [x] [Review][Patch] Missing Validation on Deploy Endpoint [apps/backend/src/sabotage/sabotage.controller.ts:55-62] — Missing input validation and DTO structure for the deploy endpoint body parameters, allowing invalid or malformed data.
- [x] [Review][Patch] Inconsistent Transaction Timestamps [apps/backend/src/sabotage/sabotage.service.ts:172-181] — Transaction updates use independent new Date() calls instead of a single, consistent timestamp reference.
- [x] [Review][Defer] NestJS Circular Dependency between Leaderboard and Sabotage [apps/backend/src/sabotage/sabotage.module.ts:80] — resolved via forwardRef, pre-existing
- [x] [Review][Defer] No Backend Persistence of Active Sabotage Effects [apps/backend/src/sabotage/sabotage.service.ts:190] — Visual distortion active state is not persisted on the backend database, meaning effects do not survive page reloads. This meets acceptance criteria but could be improved, pre-existing

## Dev Notes

### Socket.io Event Handling
Listen to the socket event inside the client-side listener component using:
```typescript
import { useEffect } from 'react';
import { socket } from '@/core/api/socket.client';
import { useChaosStore } from '@/core/store/useChaosStore';

export default function ChaosListener() {
  const addSabotage = useChaosStore((s) => s.addSabotage);

  useEffect(() => {
    if (!socket) return;
    
    if (!socket.connected) {
      socket.connect();
    }

    const handleSabotage = (data: { targetId: string; effectType: string; authorId: string }) => {
      addSabotage({
        id: Math.random().toString(),
        targetId: data.targetId,
        effectType: data.effectType,
        authorId: data.authorId,
        expiresAt: Date.now() + 15000,
      });
    };

    socket.on('sabotage.deployed', handleSabotage);

    return () => {
      socket.off('sabotage.deployed', handleSabotage);
    };
  }, [addSabotage]);

  return null;
}
```

### Global Body Manipulation
Synchronize body classes with Zustand store subscriptions:
```typescript
useEffect(() => {
  const unsubscribe = useChaosStore.subscribe(
    (state) => state.activeSabotages,
    (activeSabotages) => {
      const isTargeted = activeSabotages.some((s) => s.authorId === currentUser?.id);
      
      // Clear all sabotage classes
      document.body.classList.remove('sabotage-blur', 'sabotage-comic-sans', 'sabotage-papyrus');
      
      if (isTargeted) {
        // Find the active effect and apply class
        const primaryEffect = activeSabotages.find((s) => s.authorId === currentUser?.id)?.effectType;
        if (primaryEffect && primaryEffect !== 'deduct_calories') {
          document.body.classList.add(`sabotage-${primaryEffect}`);
        }
      }
    }
  );
  return unsubscribe;
}, [currentUser]);
```

## References

- [PRD - Paid Sabotage](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L266)
- [UX Spec - Paid Sabotage](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L289)
- [Architecture - Socket naming & Zustand Stores](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L240)
