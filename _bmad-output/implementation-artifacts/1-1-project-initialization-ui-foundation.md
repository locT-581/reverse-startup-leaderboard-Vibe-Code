---
story_id: 1.1
story_key: 1-1-project-initialization-ui-foundation
epic_num: 1
story_num: 1
epic_title: The Foundation - Identity & Leaderboard
story_title: Project Initialization & UI Foundation
status: ready-for-dev
---

# Story 1.1: Project Initialization & UI Foundation

## 1. Story Requirements

### User Story

As a developer,
I want the core project structure and design system established,
So that I can build functional features on a stable, architecturally compliant foundation.

### Acceptance Criteria

- **Given** a new environment
- **When** the project is initialized
- **Then** it must use Next.js App Router, NestJS, and Drizzle ORM without Tailwind CSS
- **And** global Vanilla CSS variables for the "Hyper-Modern SaaS" theme and Typography (Inter/Outfit) must be configured.

### Business Context & Success Criteria

This is the foundational story of the Reverse Startup Leaderboard project. It establishes the "Hyper-Modern SaaS" baseline UI aesthetic, which creates a false sense of security before introducing the platform's core Anti-UX mechanics. Setting up a robust monorepo architecture strictly enforcing Vanilla CSS is critical for performance when the chaotic CSS mutations are later applied.

## 2. Developer Context

### Current State

This is the very first implementation story. The repository is currently empty of application code.

### Changes Required

You will bootstrap the entire project infrastructure, setting up a `pnpm` monorepo containing a Next.js App Router frontend and a NestJS backend. You will establish the CSS variables and base typography for the application.

## 3. Technical Requirements

### Core Setup Steps

1. **Monorepo Initialization:**
   - Initialize a `pnpm` workspace at the project root (`pnpm-workspace.yaml` and `package.json`).
2. **Frontend Setup:**
   - Run the exact Next.js init command:
     `pnpm create next-app apps/frontend --typescript --eslint --app --src-dir --import-alias "@/*"`
   - **CRITICAL:** Decline Tailwind CSS or remove it entirely. This project strictly uses Vanilla CSS.
   - Configure global CSS with the "Hyper-Modern SaaS" theme variables.
   - Configure Google Fonts (Inter and Outfit).
3. **Backend Setup:**
   - Initialize a new NestJS project in `apps/backend`.
4. **ORM Setup:**
   - Install and configure Drizzle ORM v0.45.2.
   - Setup basic database configuration (PostgreSQL target).

## 4. Architecture Compliance

### Mandatory Architectural Rules

- **Styling Solution:** Vanilla CSS via CSS Modules or Global CSS. No UI component libraries (like Material UI) or utility frameworks (like Tailwind) are allowed.
- **Frontend Architecture:** Domain-Driven Design (DDD).
  - `src/app`: Routing only.
  - `src/core`: Platform setup.
  - `src/domains`: Anti-UX and Leaderboard logic.
  - `src/shared`: Generic UI components with **no** hostile logic.

## 5. Library & Framework Requirements

- **Next.js**: Latest stable (App Router)
- **NestJS**: Latest stable
- **Drizzle ORM**: `v0.45.2` EXACTLY
- **Node/PackageManager**: Node LTS, `pnpm` workspace exclusively.

## 6. File Structure Requirements

Ensure the project adheres to this exact initial structure:

```
reverse-startup-leaderboard/
├── pnpm-workspace.yaml
├── package.json
├── apps/
│   ├── frontend/
│   │   ├── package.json
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   └── globals.css
│   │       ├── core/
│   │       ├── domains/
│   │       └── shared/
│   │           └── ui/
│   └── backend/
│       ├── package.json
│       ├── src/
│       └── db/
└── tests/
    ├── e2e/
    └── unit/
```

## 7. Testing Requirements

- Set up empty directories for `tests/e2e` (Playwright) and `tests/unit` (Jest).
- No specific tests are required for this pure infrastructure setup story, but the directories must exist to enforce standard placement later.

## 8. Web Research / Latest Tech Information

- Next.js latest setup: Ensure `create-next-app` uses the latest stable version and respects the App Router configuration.
- Drizzle ORM: Pay attention to version `v0.45.2` specific initialization details, as Drizzle frequently changes APIs.

## 9. Project Context Reference

### Essential `project-context.md` Rules for this Story:

- **Monorepo Package Manager:** "The project uses `pnpm` workspaces exclusively. DO NOT use `npm` or `yarn`."
- **Vanilla CSS:** "CSS classes for layout/styling must be written in Vanilla CSS. DO NOT use Tailwind CSS or any utility-first CSS framework."
- **Import Aliases:** "Use path aliases `@/*` for absolute imports in Next.js."
- **File/Folder Naming:** "Use `kebab-case` for all folders and files, EXCEPT for React Component files which MUST use `PascalCase`."

## 10. Completion Status

**Status:** `ready-for-dev`
_Ultimate context engine analysis completed - comprehensive developer guide created._
