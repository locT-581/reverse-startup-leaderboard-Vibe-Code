---
story_id: 4.3
story_key: 4-3-viral-sharing-dynamic-previews
epic_num: 4
story_num: 3
epic_title: Anti-Logic Moderation & Viral Sharing
story_title: Viral Sharing & Dynamic Previews
status: done
---

# Story 4.3: Viral Sharing & Dynamic Previews

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to share my penalized profile or sabotaged post on social media,
So that I can showcase the absurdity to my friends.

## Acceptance Criteria

1. **Given** a user is viewing a post on the leaderboard or their profile:
   - **When** they click the "Share" action button/link
   - **Then** the app copies a shareable URL to the clipboard (e.g. `/posts/[id]` or `/profile/[username]`) and shows a temporary success notification.
2. **Given** an external platform (like Twitter or Discord) crawls a shared post URL `/posts/[id]`:
   - **When** the page is requested
   - **Then** the Next.js SSR engine must dynamically render standard Open Graph (OG) tags:
     - `og:title` containing the post title and the author's name
     - `og:description` displaying the post content or snippet
     - `og:image` pointing to a dynamically generated preview image or a route returning a custom image
     - `twitter:card` set to `summary_large_image`
3. **Given** an external platform crawls a shared profile URL `/profile/[username]`:
   - **When** the page is requested
   - **Then** the Next.js SSR engine must dynamically render Open Graph tags:
     - `og:title` reflecting the user's username
     - `og:description` showing their Wasted Calories, rank, and current logic violation status
     - `og:image` pointing to a dynamically generated preview image showing their avatar (including the clown hat overlay emoji if they are penalized).
4. **Given** the dynamically generated preview image is requested:
   - **When** the user is penalized (with 5 or more logic violations)
   - **Then** the dynamically generated OG image must visually render a clown hat overlay on top of their avatar (e.g. using HTML canvas, Next.js `@vercel/og` Image Generation API, or SVG rendering).
5. **Given** a shared post page `/posts/[id]` is opened directly in a browser:
   - **When** the page is loaded
   - **Then** it must render a read-only detailed view of the post, author name, author avatar (with the clown hat overlay if applicable), and its comments.
   - **And** it must provide a clear button to go back to the main leaderboard.
6. **Given** a shared profile page `/profile/[username]` is opened directly in a browser:
   - **When** the page is loaded
   - **Then** it must render a public, read-only profile view of the user showing their name, avatar (with clown hat overlay if applicable), wasted calories, and logic violations count.
   - **And** it must provide a clear button to go back to the main leaderboard.

## Tasks / Subtasks

- [ ] **Task 1: Shared Profile and Post Detail Routes** (AC: 1, 5, 6)
  - [ ] Create `/posts/[id]` dynamic route in `apps/frontend/src/app/posts/[id]/page.tsx`
    - [ ] Fetch post details (including comments and author info) from the backend. (Backend needs an endpoint to get a post by ID, or frontend can fetch it).
    - [ ] Render the post detail view with CSS Modules. Add a link/button to return to `/`.
  - [ ] Create `/profile/[username]` dynamic route in `apps/frontend/src/app/profile/[username]/page.tsx`
    - [ ] Fetch user profile details by username from the backend.
    - [ ] Render the public profile view. If `user.logicViolations >= 5`, render the clown hat overlay emoji `🎩` on the avatar. Add a link/button to return to `/`.
- [ ] **Task 2: Dynamic Metadata (OG Tags) Configuration** (AC: 2, 3)
  - [ ] Implement `generateMetadata` function on `/posts/[id]/page.tsx` to return dynamic Open Graph meta tags (title, description, and image URL).
  - [ ] Implement `generateMetadata` function on `/profile/[username]/page.tsx` to return dynamic Open Graph meta tags.
- [ ] **Task 3: Dynamic Preview Image Generation Route** (AC: 4)
  - [ ] Implement a Next.js dynamic OG image route `/posts/[id]/opengraph-image.tsx` and/or `/profile/[username]/opengraph-image.tsx` using `@vercel/og` (or custom SVG API endpoints like `/api/og/post/[id]` and `/api/og/profile/[username]`).
  - [ ] Ensure that if the user's `logicViolations >= 5`, the generated image explicitly includes a representation of the clown hat (e.g. `🎩`) over the avatar.
- [ ] **Task 4: Share Buttons UI & Clipboard Integration** (AC: 1)
  - [ ] Add a "Share Link" button to each post in `LeaderboardGrid.tsx` and the main User Profile page.
  - [ ] Implement copy-to-clipboard functionality with a visual tooltip/toast indicating "Link copied to clipboard!".
- [ ] **Task 5: E2E Playwright Tests** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Create E2E test file `tests/e2e/viral-sharing.spec.ts` that registers a user, creates a post, verifies that clicking share copies the correct link, fetches the page HTML to verify OG tags, and verifies that the post/profile detail routes render correctly.

## Dev Notes

- **Stripe & Other Configs:** Ensure that fetching posts by ID or user by username does not require authentication since external platform crawlers need to fetch these pages without credentials.
- **Dynamic Image Options:** In Next.js App Router, the `opengraph-image.tsx` file dynamically generates PNG images using Edge Runtime. If Next.js Image Generation is preferred, we can use the `ImageResponse` from `next/og` (which leverages `@vercel/og` internally under the hood). If dependencies are restricted, we can also return an SVG image from an API route.
- **Backend Endpoints:**
  - Need a backend route `GET /posts/:id` to retrieve post details, author, and comments.
  - Need a backend route `GET /users/username/:username` to retrieve user public details.

### Project Structure Notes

- Keep all Next.js pages under `apps/frontend/src/app`.
- Domain components should reside in domain folders.

### References

- [PRD - Dynamic Open Graph (OG) Tags](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L188)
- [PRD - FR26 & FR27](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L286-L288)
- [UX Specification - Aggressive sharing prompts](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L151)

## Dev Agent Record

### Agent Model Used

N/A

### Debug Log References

N/A

### Completion Notes List

N/A

### File List

- `apps/frontend/src/app/posts/[id]/page.tsx`
- `apps/frontend/src/app/posts/[id]/opengraph-image.tsx`
- `apps/frontend/src/app/profile/[username]/page.tsx`
- `apps/frontend/src/app/profile/[username]/opengraph-image.tsx`
- `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx`
- `apps/frontend/src/app/profile/page.tsx`
- `tests/e2e/viral-sharing.spec.ts`

## Change Log

### [2026-05-22] Created Story 4.3 Specifications
- Defined dynamic routes for post details and public profiles.
- Added dynamic Open Graph metadata and preview image requirements.
- Included E2E Playwright test coverage specifications.
