---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  [
    "/Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md",
    "/Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md",
    "/Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md",
  ]
---

# Reverse Startup Leaderboard - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Reverse Startup Leaderboard, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create an account, authenticate, and manage a basic profile (e.g., username, avatar).
FR2: The system can securely store and manage user payment history and purchased digital inventory (Sabotage Packs).
FR3: Users can create and submit a new problem or question post.
FR4: Users can submit a solution comment to an existing post.
FR5: The system can validate that a solution comment strictly exceeds the character length of the original post before accepting it.
FR6: Users must complete a complex manual verification challenge (e.g., typing an advertisement) before successfully submitting a post or comment.
FR7: Users can cast a vote (which negatively impacts rank) on a post or comment.
FR8: Users must successfully interact with a deliberately evasive or multi-step UI component to register a vote.
FR9: Users can view a real-time global leaderboard of posts.
FR10: The system can calculate and assign a "Wasted Calories" score to posts based on predefined static rules (e.g., word count, formatting complexity).
FR11: The system can rank and order the leaderboard dynamically based on the highest "Wasted Calories" score.
FR12: The system can automatically apply a distinct visual marker (e.g., "Golden Raspberry" badge) to the post currently holding the #1 position on the leaderboard.
FR13: Users can view the current "Wasted Calories" score and rank of their own and others' posts.
FR14: Users can browse available "Sabotage Packs" (e.g., visual distortions) in a digital storefront.
FR15: Users can purchase Sabotage Packs using real fiat currency via an integrated payment gateway.
FR16: Users can purchase a rank-reduction action using real fiat currency to deliberately deduct "Wasted Calories" from their own post.
FR17: Users can target a specific active post to deploy a purchased Sabotage Pack.
FR18: The system can instantly broadcast the visual distortion effects of a deployed Sabotage Pack to all users viewing the targeted post.
FR19: The system can automatically deduct a specific amount of "Wasted Calories" from a post when it is sabotaged.
FR20: Users can flag or report a post for being "too logical" or "too helpful".
FR21: The system can track the number of "logic violations" accumulated by a specific user or post.
FR22: The system can automatically apply a visual penalty (e.g., forcing a clown hat onto an avatar) to a user's profile once a report threshold is reached.
FR23: The system can track the number of consecutive failed attempts a user makes on an Anti-UX task (e.g., missing the vote button).
FR24: The system can automatically lower the difficulty of an Anti-UX task (triggering the "Mercy Threshold") after a defined number of failures.
FR25: The system can display a specific condescending notification to the user when the Mercy Threshold is activated.
FR26: Users can generate a shareable URL for a specific post, leaderboard state, or their profile.
FR27: The system can dynamically generate preview metadata (specifically capturing visual penalties like the clown hat) when a link is shared externally to social media.

### NonFunctional Requirements

NFR-P1: The initial Time to Interactive (TTI) of the web application must be under 2.5 seconds on a standard 4G mobile connection.
NFR-P2: WebSocket message broadcast latency must be under 100 milliseconds at the 95th percentile.
NFR-SE1: The system must strictly sanitize all user inputs and explicitly restrict CSS overrides to predefined safe classes to prevent XSS.
NFR-SE2: The backend must enforce network-level rate limiting (e.g., maximum 100 requests per IP per minute) on state-mutating endpoints.
NFR-SE3: All fiat payment processing must be fully offloaded to a PCI-DSS compliant third-party gateway (e.g., Stripe) with zero raw credit card data stored.
NFR-SC1: The WebSocket or Pub/Sub infrastructure must securely support at least 10,000 concurrent active connections with <0.1% message drop rate.
NFR-SC2: The system infrastructure must auto-scale to handle a 10x traffic spike within 3 minutes without violating the 100ms latency requirement.
NFR-AV1: The core data pipeline and leaderboard calculation engine must maintain a 99.9% uptime SLA per month.
NFR-A1: The frontend must automatically detect OS-level `prefers-reduced-motion` and halt vibrating/flashing UI components.
NFR-A2: The application must provide a "Screen Reader Bypass" to strip DOM obfuscation and CSS sabotage effects for assistive technologies.

### Additional Requirements

- **Starter Template:** Initialize Next.js App Router project using `pnpm create next-app apps/frontend --typescript --eslint --app --src-dir --import-alias "@/*"` and strictly DO NOT use Tailwind CSS.
- **Backend & Realtime:** Build a standalone NestJS server with PostgreSQL for data management and Socket.io for real-time WebSocket communication.
- **Data Persistence:** Utilize Drizzle ORM v0.45.2.
- **Authentication & Payments:** Implement NestJS Custom JWT Auth and integrate Stripe via `stripe-node v22.1.1`.
- **Frontend Architecture:** Manage Anti-UX states with Zustand v5.0.13 and employ Next.js Server Actions for data mutations. Use Vercel KV for Rate Limiting.
- **Styling:** Strict use of Vanilla CSS Variables for styling and Chaos Tokens. No UI component libraries allowed for Anti-UX elements.
- **Project Structure:** Monorepo structure (pnpm workspace) separating apps/frontend (DDD approach) and apps/backend.
- **Naming & Formatting Rules:** Ensure Database uses snake_case, TypeScript uses camelCase, standard API Response format (`ActionResponse`), React Components use PascalCase, and files use kebab-case.

### UX Design Requirements

UX-DR1: Create the 'EvasiveButton' component that translates X/Y based on cursor proximity, vibrates when cornered, and enters a cooldown state.
UX-DR2: Create the 'HostileInput' component that rejects standard inputs, highlights text in Penalty Red, and displays passive-aggressive errors.
UX-DR3: Create the 'SabotageCard' component with premium dark mode glassmorphism, neon hover glow, and seamless purchasing transition.
UX-DR4: Implement the 'Ad Captcha' interstitial modal forcing users to type out sponsored messages before form submission.
UX-DR5: Build the 'Mercy Threshold' toggle/prompt to simplify UI after repeated failures, paired with condescending messages.
UX-DR6: Define dual-theme CSS Color System: 'Hyper-Modern SaaS' (light mode facade) and 'Troll Capitalist' (deep dark mode with neon accents).
UX-DR7: Establish Typography System: 'Inter'/'Outfit' as primary font, dynamically injecting penalty fonts like 'Comic Sans'.
UX-DR8: Implement Chaos Tokens system using inline CSS Custom Properties (e.g., `--chaos-blur: 0px`, `--chaos-shake: 0s`) mapped to global WebSocket state.
UX-DR9: Implement 'Safe-Chaos' accessibility protocol wrapping all chaotic UI animations in `@media (prefers-reduced-motion: reduce)`.
UX-DR10: Develop 'Screen Reader Bypass' providing visually hidden text and proper ARIA labels while bypassing visual sabotage effects.
UX-DR11: Build Mobile-First layouts with touch-optimized Anti-UX (e.g., touch evasion logic <50ms latency) and sticky bottom monetization bars.

### FR Coverage Map

FR1: Epic 1 - Account & Profile management
FR2: Epic 3 - Store purchase history & digital inventory
FR3: Epic 2 - Create and submit problem post
FR4: Epic 2 - Submit solution comment
FR5: Epic 2 - Validate comment length > original post
FR6: Epic 2 - Manual verification challenge (Ad Captcha)
FR7: Epic 2 - Cast vote to negatively impact rank
FR8: Epic 2 - Interact with evasive vote UI
FR9: Epic 1 - View real-time global leaderboard
FR10: Epic 1 - Calculate Wasted Calories score
FR11: Epic 1 - Sort leaderboard dynamically
FR12: Epic 1 - Golden Raspberry badge for #1 position
FR13: Epic 1 - View Wasted Calories and rank
FR14: Epic 3 - Browse Sabotage Packs in storefront
FR15: Epic 3 - Purchase Sabotage Pack via fiat
FR16: Epic 3 - Purchase rank-reduction action
FR17: Epic 3 - Target post for Sabotage
FR18: Epic 3 - Broadcast Sabotage distortion via WebSockets
FR19: Epic 3 - Deduct Wasted Calories via Sabotage
FR20: Epic 4 - Report post for being "too logical"
FR21: Epic 4 - Track logic violations
FR22: Epic 4 - Apply visual penalty (clown hat)
FR23: Epic 2 - Track consecutive failed Anti-UX attempts
FR24: Epic 2 - Activate Mercy Threshold
FR25: Epic 2 - Display condescending Mercy notification
FR26: Epic 4 - Generate shareable URL
FR27: Epic 4 - Generate dynamic OG tags for sharing

## Epic List

### Epic 1: The Foundation - Identity & Leaderboard

Users can register, log in, view the leaderboard, and see how posts are ranked based on "Wasted Calories" along with special badges.
**FRs covered:** FR1, FR9, FR10, FR11, FR12, FR13

### Epic 2: The Core Chaos - Posting, Voting & Mercy

Users can participate by posting, commenting, and voting, but must navigate intentionally hostile UI (Evasive buttons, Ad Captcha, length validations) or hit the "Mercy" limit.
**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8, FR23, FR24, FR25

### Epic 3: Troll Capitalism - The Sabotage Store

Users can spend real money seamlessly to purchase Sabotage Packs and instantly deploy them against rivals to cause real-time visual distortions and score penalties.
**FRs covered:** FR2, FR14, FR15, FR16, FR17, FR18, FR19

### Epic 4: Anti-Logic Moderation & Viral Sharing

Users can report helpful posts to trigger visual penalties (clown hats) on the authors, and share these chaotic moments easily on social media with rich previews.
**FRs covered:** FR20, FR21, FR22, FR26, FR27

## Epic 1: The Foundation - Identity & Leaderboard

Users can register, log in, view the leaderboard, and see how posts are ranked based on "Wasted Calories" along with special badges.

### Story 1.1: Project Initialization & UI Foundation

As a developer,
I want the core project structure and design system established,
So that I can build functional features on a stable, architecturally compliant foundation.

**Acceptance Criteria:**

**Given** a new environment
**When** the project is initialized
**Then** it must use Next.js App Router, NestJS, and Drizzle ORM without Tailwind CSS
**And** global Vanilla CSS variables for the "Hyper-Modern SaaS" theme and Typography (Inter/Outfit) must be configured.

### Story 1.2: User Authentication & Profile Management

As a user,
I want to create an account and manage my profile,
So that my identity and ranking can be tracked on the platform.

**Acceptance Criteria:**

**Given** an unauthenticated user on the auth page
**When** they submit valid registration or login credentials
**Then** they should be authenticated securely via JWT
**And** they can access a profile page to update their basic profile (username, avatar) in the database.

### Story 1.3: Core Leaderboard Data Engine

As a system administrator,
I want the backend to calculate and order posts by "Wasted Calories",
So that the core Reverse Leaderboard logic functions correctly.

**Acceptance Criteria:**

**Given** multiple posts exist in the database
**When** the leaderboard data is fetched via Server Action
**Then** the backend must return the posts sorted descending by their "Wasted Calories" score
**And** the score calculation must follow predefined static rules.

### Story 1.4: Real-time Leaderboard View & Badges

As a user,
I want to view the active leaderboard and see special badges,
So that I know who currently holds the most "Wasted Calories".

**Acceptance Criteria:**

**Given** the leaderboard page is loaded
**When** the data is rendered on the client
**Then** the `LeaderboardGrid` component displays the ranked posts
**And** the post in the #1 position automatically displays the "Golden Raspberry" badge.

## Epic 2: The Core Chaos - Posting, Voting & Mercy

Users can participate by posting, commenting, and voting, but must navigate intentionally hostile UI (Evasive buttons, Ad Captcha, length validations) or hit the "Mercy" limit.

### Story 2.1: Hostile Input & Content Creation

As a Chaos Engineer (Poster),
I want to submit problems and solutions,
So that I can participate in the community, even though the system fights me.

**Acceptance Criteria:**

**Given** a user is creating a post or comment
**When** they interact with the `HostileInput` component
**Then** the component rejects standard inputs with passive-aggressive errors (highlighted in Penalty Red)
**And** solution comments are only accepted if they strictly exceed the character length of the original post.

### Story 2.2: The Ad Captcha Challenge

As a user,
I want to submit my completed form,
So that my content is published to the leaderboard.

**Acceptance Criteria:**

**Given** a user has successfully passed the Hostile Input validation
**When** they click to finally submit the post/comment
**Then** an "Ad Captcha" modal appears forcing them to manually type out a sponsored message
**And** the post is only submitted once the exact ad text is typed without errors.

### Story 2.3: The Evasive Vote Button

As a user,
I want to cast a vote on a post or comment,
So that I can negatively impact its rank.

**Acceptance Criteria:**

**Given** the user hovers or taps near the Vote button
**When** the cursor enters a predefined proximity
**Then** the `EvasiveButton` must translate its X/Y coordinates to evade the cursor (with touch-optimized latency <50ms for mobile)
**And** if cornered, the button must vibrate rapidly before accepting the vote and entering a cooldown state.

### Story 2.4: Anti-UX Tracker & Mercy Threshold

As a frustrated user,
I want the system to eventually take pity on me,
So that I don't churn completely when I fail repeatedly.

**Acceptance Criteria:**

**Given** the user is interacting with Anti-UX components (e.g., missing the Evasive Button)
**When** they accumulate a predefined number of consecutive failures
**Then** the Zustand store activates the "Mercy Threshold" to disable the evasion logic
**And** displays a condescending notification mocking the user's failure.

## Epic 3: Troll Capitalism - The Sabotage Store

Users can spend real money seamlessly to purchase Sabotage Packs and instantly deploy them against rivals to cause real-time visual distortions and score penalties.

### Story 3.1: The Sabotage Storefront

As a Troll Capitalist,
I want to browse available Sabotage Packs,
So that I can choose the perfect visual distortion to inflict on my rivals.

**Acceptance Criteria:**

**Given** a user navigates to the Sabotage Store
**When** the page renders
**Then** it displays the `SabotageCard` components in a premium dark mode (Troll Capitalist theme)
**And** users can view details and prices of available packs without any Anti-UX friction.

### Story 3.2: Seamless Checkout Integration

As a Troll Capitalist,
I want to purchase a Sabotage Pack or rank-reduction easily,
So that I can exert my power without the friction experienced by free users.

**Acceptance Criteria:**

**Given** a user selects a Sabotage Pack
**When** they initiate the purchase
**Then** the system must process the payment flawlessly via the Stripe gateway (PCI-DSS compliant)
**And** securely store the purchase history without exposing raw credit card data.

### Story 3.3: Real-Time Sabotage Broadcast

As a Troll Capitalist,
I want to deploy my Sabotage Pack against a specific post,
So that the target's screen instantly distorts and their score drops.

**Acceptance Criteria:**

**Given** a user targets an active post with a Sabotage Pack
**When** the action is confirmed
**Then** the backend deducts the specified "Wasted Calories" from the target
**And** instantly broadcasts a WebSocket event to all connected clients
**And** the target client's UI updates the CSS Chaos Tokens to apply the visual distortion.

## Epic 4: Anti-Logic Moderation & Viral Sharing

Users can report helpful posts to trigger visual penalties (clown hats) on the authors, and share these chaotic moments easily on social media with rich previews.

### Story 4.1: Anti-Logic Reporting System

As a user,
I want to report posts that are "too logical" or "too helpful",
So that we can maintain the platform's chaotic standard.

**Acceptance Criteria:**

**Given** an active post on the leaderboard
**When** a user clicks the "Report Logic" button
**Then** the system increments the logic violation counter for that post/user
**And** updates the database record accordingly.

### Story 4.2: Visual Penalties (The Clown Hat)

As an Anti-Logic Judge,
I want the system to automatically apply visual penalties to logical users,
So that they are publicly shamed for their helpfulness.

**Acceptance Criteria:**

**Given** a user accumulates logic violations
**When** the violation count reaches a predefined threshold
**Then** the system automatically flags the user profile
**And** forces a "Clown Hat" overlay onto their avatar globally.

### Story 4.3: Viral Sharing & Dynamic Previews

As a user,
I want to share my penalized profile or sabotaged post on social media,
So that I can showcase the absurdity to my friends.

**Acceptance Criteria:**

**Given** a user generates a shareable URL for a post or profile
**When** the link is posted to an external platform (e.g., Twitter)
**Then** the SSR engine dynamically generates Open Graph (OG) tags and images
**And** the preview image accurately reflects current visual penalties (like the clown hat).

### Story 4.4: Safe-Chaos Protocol & Screen Reader Bypass

As a system administrator,
I want the platform to be safe and accessible despite the visual chaos,
So that we do not cause actual harm or exclude assistive technology users.

**Acceptance Criteria:**

**Given** the application is running
**When** a user has OS-level `prefers-reduced-motion` enabled
**Then** all CSS vibrating, evading, and shaking animations must be disabled
**And** visually hidden text with proper ARIA labels must allow screen readers to parse the raw semantic HTML, bypassing the visual sabotage effects.
