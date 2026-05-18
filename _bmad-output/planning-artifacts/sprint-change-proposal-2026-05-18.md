# Sprint Change Proposal: Migration from Supabase to NestJS Backend

## Section 1: Issue Summary

- **Trigger**: The project team has decided to pivot away from using Supabase as a Backend-as-a-Service (BaaS) and instead build a separate, custom backend using NestJS.
- **Context**: The original architecture relied heavily on Supabase for PostgreSQL database hosting, Authentication (Supabase Auth), and Real-time communication (Supabase Realtime channels).
- **Core Problem**: Using a custom NestJS backend fundamentally changes the system architecture, authentication flow, real-time event broadcasting, and database management strategy. It requires building infrastructure that Supabase previously provided out-of-the-box.

## Section 2: Impact Analysis

- **Epic Impact**:
  - Missing Epics will need to be generated reflecting a split between Frontend (Next.js) and Backend (NestJS).
  - New Epics required for: NestJS Server Setup, Custom Authentication (JWT), WebSocket Implementation (e.g., Socket.io) for real-time sabotage events, and Database Management (PostgreSQL + ORM).
- **Artifact Conflicts**:
  - **PRD**: Requirements regarding backend infrastructure and real-time state management need to be explicitly assigned to the NestJS service. The MVP timeline must be extended to account for backend development overhead.
  - **Architecture**: Major overhaul required. Supabase references must be removed. The system will shift from a Serverless BaaS model to a standalone API Service model.
  - **UI/UX**: No significant impact on visual design, but API integration layers and state management (Zustand) must be updated to consume REST APIs and standard WebSockets instead of the Supabase Client.
- **Technical Impact**: Requires setting up a new repository or monorepo structure, deploying a separate backend service, and managing a standalone PostgreSQL instance.

## Section 3: Recommended Approach

- **Selected Approach**: Direct Architectural Pivot and PRD MVP Adjustment.
- **Rationale**: Building a custom NestJS backend provides maximum control over business logic, complex gamification mechanics, and rate limiting (which is crucial for the "anti-UX" nature of the application). While this increases initial development effort and timeline (High Effort), it reduces vendor lock-in and offers better scalability for highly customized backend operations. The MVP scope must be adjusted to allow time for foundational backend development.

## Section 4: Detailed Change Proposals

### Architecture Document Changes

```text
File: architecture.md
Section: System Architecture

OLD:
- **Database & Realtime Engine:** **Supabase (PostgreSQL)**...
- **Authentication:** **Supabase Auth**...
- **Real-Time Communication:** **Supabase Realtime Channel**...

NEW:
- **Backend Framework:** **NestJS**
  - _Rationale:_ Provides a robust, scalable, and modular architecture for handling complex anti-UX business logic and custom rate-limiting.
- **Database:** **PostgreSQL** (Self-hosted or Managed) with Drizzle ORM or TypeORM.
- **Authentication:** Custom **JWT Authentication** managed by NestJS.
- **Real-Time Communication:** **Socket.io** or native NestJS WebSockets for broadcasting "Sabotage Packs" instantly.
```

### PRD Changes

```text
File: prd.md
Section: Technical Requirements

OLD:
- A robust backend capable of processing microtransactions and instantly broadcasting state changes...

NEW:
- **Standalone Backend Service:** A dedicated NestJS backend service responsible for managing state, enforcing ACID properties, handling JWT authentication, and broadcasting real-time state changes via WebSockets.
- **MVP Timeline Adjustment:** The MVP timeline is extended by ~1-2 weeks to accommodate the setup and implementation of the custom backend infrastructure.
```

## Section 5: Implementation Handoff

- **Scope Classification**: **Major** (Fundamental replan required).
- **Handoff Recipients**:
  - **Solution Architect (Winston)**: Must completely rewrite the `architecture.md` document to define the new NestJS boundaries, API contracts, and deployment strategy.
  - **Product Manager (John)**: Must update the PRD timeline and coordinate the creation of new Epics/Stories for the backend tasks.
  - **Developer (Amelia)**: Must initialize the NestJS project structure and remove Supabase dependencies from the existing Next.js frontend.
- **Success Criteria**: The `architecture.md` and `prd.md` are updated and approved. A new NestJS service is successfully initialized and can communicate with the Next.js frontend via a basic WebSocket connection.
