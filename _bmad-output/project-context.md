---
project_name: "Reverse Startup Leaderboard"
user_name: "vibe-coding-team"
date: "2026-05-18"
sections_completed:
  [
    "technology_stack",
    "language_rules",
    "framework_rules",
    "testing_rules",
    "quality_rules",
    "workflow_rules",
    "anti_patterns",
  ]
status: "complete"
rule_count: 22
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Frontend:** Next.js (App Router), TypeScript, Vanilla CSS (Strictly NO Tailwind)
- **State Management:** Zustand v5.0.13
- **Backend:** NestJS, PostgreSQL, Drizzle ORM v0.45.2
- **Real-time:** Socket.io
- **Monetization:** Stripe Node v22.1.1
- **Architecture:** pnpm Monorepo

## Critical Implementation Rules

### Language-Specific Rules

- **Database-to-TypeScript Mapping:** Use `snake_case` for database tables/columns (e.g., `sabotage_packs`) but MUST map to `camelCase` in TypeScript/Drizzle (e.g., `wastedCalories`). Foreign keys in DB must have `_id` suffix.
- **Import Aliases:** Use path aliases `@/*` for absolute imports in Next.js.
- **Server Action Responses:** All Next.js Server Actions MUST return a typed object: `{ success: boolean; data?: T; error?: { message: string; code?: string } }`.
- **Error Handling:** DO NOT throw raw exceptions in Server Actions. Return passive-aggressive error messages inside the `error` object so the client can render them correctly.

### Framework-Specific Rules

- **Client vs. Server Components (Next.js):** Keep Server Components (data fetching, SEO, lists like `LeaderboardGrid`) separated from Client Components (`"use client"`). Any component using Zustand state, DOM coordinates, or Anti-UX interactive logic MUST be a Client Component.
- **Component Boundaries:** Standard UI elements (`src/shared/ui/`) MUST NOT contain any Anti-UX or hostile logic. All intentional UI chaos (e.g., evasion logic, ad captchas) MUST be strictly isolated within `src/domains/anti-ux/components/`.
- **Zustand State Management:** Store files must be named `use[Feature]Store.ts` (e.g., `useChaosStore.ts`). State mutation functions must be grouped inside the same store (do not separate actions from state).
- **Loading States:** Utilize React's `useFormStatus` or `useTransition` for loading states on forms and mutations instead of manually managing `isLoading` boolean state.
- **WebSocket Events (Socket.io):** Event names must follow the `noun.verb` pattern (e.g., `sabotage.deployed`). Payloads must always include a `targetId` to apply sabotage effects precisely.

### Testing Rules

- **Test Organization:** All End-to-End (E2E) tests using Playwright MUST be placed in the `tests/e2e/` directory. Unit tests (using Jest) MUST be placed in `tests/unit/`.
- **Mocking Conventions:** Always mock external API dependencies (like Stripe) in unit tests. For WebSockets (Socket.io), use a mock emitter in unit tests to verify that `useChaosStore` updates correctly upon receiving sabotage events.
- **Anti-UX Testing Boundaries:** Do not over-test precise pixel coordinates of evasive elements in unit tests. Instead, rely on E2E Playwright tests to ensure that the "Mercy Threshold" correctly activates and allows a frustrated user to eventually complete the core user flow (e.g., submitting a post).

### Code Quality & Style Rules

- **File/Folder Naming:** Use `kebab-case` for all folders and files (e.g., `format-date.ts`, `app/leaderboard-view/page.tsx`), EXCEPT for React Component files which MUST use `PascalCase` (e.g., `EvasiveButton.tsx`).
- **Variable/Function Naming:** Always use `camelCase` for variables, functions, and standard object keys in TypeScript.
- **Type Safety:** The project uses strict TypeScript. Use explicitly defined types or interfaces. Avoid using the `any` type under all circumstances.
- **Vanilla CSS:** CSS classes for layout/styling must be written in Vanilla CSS (via CSS Modules or Global CSS). DO NOT use Tailwind CSS or any utility-first CSS framework, to ensure the Anti-UX dynamic CSS properties (`:root` Chaos Tokens) run as cleanly and performantly as possible.

### Development Workflow Rules

- **Monorepo Package Manager:** The project uses `pnpm` workspaces exclusively. DO NOT use `npm` or `yarn`. Always run commands from the project root using `pnpm --filter <app-name>` (e.g., `pnpm --filter frontend dev`) or explicitly navigate into the specific app directory (e.g., `apps/frontend`).
- **Initial Setup Step:** The very first implementation step for any agent working on the frontend must be initializing Next.js using the exact command documented in the architecture: `pnpm create next-app apps/frontend --typescript --eslint --app --src-dir --import-alias "@/*"`.

### Critical Don't-Miss Rules

- **Anti-Pattern: Server Actions vs API Routes:** Do NOT use standard Next.js API Routes (`app/api/route.ts`) for frontend data mutation; ONLY use Server Actions. Conversely, DO NOT use Server Actions for external Webhooks (e.g., Stripe callbacks) – Webhooks MUST use standard API Routes.
- **Security Guardrail:** Never store raw credit card data or untrusted user-generated HTML in the database without aggressive sanitization, to protect the chaotic UI from real XSS attacks.
- **Accessibility (Safe-Chaos):** ALWAYS wrap intense Sabotage UI animations (like screen shakes) with CSS `@media (prefers-reduced-motion: no-preference)`. Never bypass this guardrail; it is critical for accessibility.
- **Edge Case (Mercy Threshold):** The Mercy Threshold state should be resilient. Ensure that state updates in `useMercyStore` correctly sync with the server to prevent users from bypassing the Anti-UX logic simply by refreshing the page.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-05-18
