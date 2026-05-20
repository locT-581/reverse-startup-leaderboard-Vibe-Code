You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

<spec>
---
story_id: 1.2
story_key: 1-2-user-authentication-profile-management
epic_num: 1
story_num: 2
epic_title: The Foundation - Identity & Leaderboard
story_title: User Authentication & Profile Management
status: review
---

# Story 1.2: User Authentication & Profile Management

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to create an account and manage my profile,
so that my identity and ranking can be tracked on the platform.

## Acceptance Criteria

1. **Given** an unauthenticated user on the auth page
   - **When** they submit valid registration credentials (username and password)
   - **Then** a new user is created in the database with a hashed password, and they are authenticated securely via JWT.
2. **Given** an unauthenticated user on the auth page
   - **When** they submit valid login credentials
   - **Then** they should be authenticated securely via JWT and redirected to the home/leaderboard page.
3. **Given** an authenticated user
   - **When** they access the profile page
   - **Then** they can view their username and current avatar.
   - **And** they can update their basic profile details (username, avatar) in the database.
4. **Given** an authenticated user
   - **When** they request to update their username to an already existing username
   - **Then** they should see a passive-aggressive validation error and the change should be rejected.

## Tasks / Subtasks

- [ ] Task 1: Database Schema Expansion (AC: 1, 3, 4)
  - [ ] Add the `users` table definition to `apps/backend/db/schema.ts` using Drizzle ORM.
  - [ ] Map `snake_case` database column names to `camelCase` TypeScript properties.
  - [ ] Create and run migration to apply changes to the PostgreSQL database.
- [ ] Task 2: Backend Auth Module (AC: 1, 2, 3, 4)
  - [ ] Install dependencies in the backend: `pnpm --filter backend add @nestjs/jwt bcrypt` and devDependencies: `pnpm --filter backend add -D @types/bcrypt`.
  - [ ] Implement `AuthModule`, `AuthService`, and `AuthController` in `apps/backend/src/auth/`.
  - [ ] Inject the database connection into `AuthService` using `@Inject(DRIZZLE)` (from globally exported `DatabaseModule`) instead of statically importing `db` from `db/index.ts` to follow the NestJS Dependency Injection pattern from Story 1.1.
  - [ ] Setup password hashing with `bcrypt` (10 salt rounds).
  - [ ] Define endpoints:
    - `POST /auth/register` (registers a new user, returns JWT and user profile)
    - `POST /auth/login` (verifies credentials, returns JWT and user profile)
    - `GET /auth/me` (uses JWT Guard to return current authenticated user profile)
    - `PUT /auth/profile` (uses JWT Guard to update username and avatar)
- [ ] Task 3: Next.js Server Actions & Session Management (AC: 1, 2, 3, 4)
  - [ ] Create `apps/frontend/src/app/actions/auth.ts` (or `apps/frontend/src/app/actions.ts`).
  - [ ] Implement typed actions: `actionRegister`, `actionLogin`, `actionUpdateProfile`, `actionLogout`.
  - [ ] Server actions must strictly return `ActionResponse<T>`: `{ success: boolean; data?: T; error?: { message: string; code?: string } }`.
  - [ ] Manage authentication session using HTTP-only cookies (`token`) set/cleared during Server Actions.
  - [ ] Return passive-aggressive, humorous error messages in the `error` object on failure instead of throwing raw exceptions.
- [ ] Task 4: Zustand Auth Store (AC: 1, 2, 3)
  - [ ] Create `apps/frontend/src/core/store/useAuthStore.ts`.
  - [ ] Group state (`user`, `isAuthenticated`) and actions (`setUser`, `logout`) inside the same store.
- [ ] Task 5: Auth & Profile Frontend Pages (AC: 1, 2, 3, 4)
  - [ ] Create a client component auth page at `apps/frontend/src/app/auth/page.tsx` with a clean Vanilla CSS layout (`auth.module.css`).
  - [ ] Auth page must toggle between Login and Register modes, utilizing `useFormStatus` or `useTransition` for loading states.
  - [ ] Create a client component profile page at `apps/frontend/src/app/profile/page.tsx` with form fields for username and avatar selector, styled with CSS modules (`profile.module.css`).
  - [ ] Highlight validation errors in "Penalty Red" and render passive-aggressive error states.
- [ ] Task 6: Authentication Guard Middleware (AC: 3)
  - [ ] Update Next.js middleware in `apps/frontend/src/middleware.ts` to protect the `/profile` route (redirect to `/auth` if no valid token cookie is present).
- [ ] Task 7: Unit & E2E Verification (AC: 1, 2, 3, 4)
  - [ ] Create unit tests for backend `AuthService` in `tests/unit/backend/auth/auth.service.spec.ts`.
  - [ ] Create a Playwright E2E test in `tests/e2e/auth.spec.ts` to verify the full register, login, profile view, profile update, and logout flows.

## Dev Notes

### Unified Project Structure & Naming Conventions

- **Database Mapping:** Use `snake_case` for database tables/columns (e.g., `users`, `password_hash`) but MUST map to `camelCase` in TypeScript/Drizzle (e.g., `passwordHash`).
- **File/Folder Naming:** Use `kebab-case` for all folders and files (e.g., `use-auth-store.ts`, `app/auth/page.tsx`), EXCEPT for React Component files which MUST use `PascalCase`.
- **Import Aliases:** Use path aliases `@/*` for absolute imports in Next.js.
- **Styling Solution:** Strict use of Vanilla CSS variables and CSS modules. **Absolutely NO Tailwind CSS**.

### Database schema details to add in `apps/backend/db/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar").default("default_avatar"),
  wastedCalories: integer("wasted_calories").default(0).notNull(),
  logicViolations: integer("logic_violations").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Next.js Server Action Responses

All Next.js Server Actions MUST return a typed object matching:

```typescript
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
};
```

DO NOT throw exceptions in Server Actions. Return them inside the response object.

### Zustand State management

Store files must be named `use[Feature]Store.ts` (e.g., `useAuthStore.ts`). Keep mutations inside the store definition.

### React Loading States

Avoid manual `isLoading` boolean states. Utilize React's `useFormStatus` or `useTransition` for forms and mutations.

### References

- [Source: planning-artifacts/architecture.md#Naming Naming Patterns]
- [Source: planning-artifacts/architecture.md#Structure Project Organization]
- [Source: planning-artifacts/architecture.md#Format API Response Formats]
- [Source: project-context.md#Language-Specific Rules]
- [Source: project-context.md#Framework-Specific Rules]

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

### Completion Notes List

### File List

</spec>

<diff>
diff --git a/apps/backend/db/schema.ts b/apps/backend/db/schema.ts
index 1d0b750..630e94e 100644
--- a/apps/backend/db/schema.ts
+++ b/apps/backend/db/schema.ts
@@ -1,3 +1,13 @@
-// Schema definitions will go here
+import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
+
+export const users = pgTable("users", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  username: text("username").notNull().unique(),
+  passwordHash: text("password_hash").notNull(),
+  avatar: text("avatar").default("default_avatar"),
+  wastedCalories: integer("wasted_calories").default(0).notNull(),
+  logicViolations: integer("logic_violations").default(0).notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+  updatedAt: timestamp("updated_at").defaultNow().notNull(),
+});
 
-export {};
diff --git a/apps/backend/package.json b/apps/backend/package.json
index c515b36..b1effaf 100644
--- a/apps/backend/package.json
+++ b/apps/backend/package.json
@@ -5,25 +5,53 @@
   "scripts": {
     "build": "nest build",
     "start": "nest start",
-    "start:dev": "nest start --watch"
+    "start:dev": "nest start --watch",
+    "test": "jest"
   },
   "dependencies": {
     "@nestjs/common": "^10.0.0",
     "@nestjs/core": "^10.0.0",
+    "@nestjs/jwt": "^11.0.2",
     "@nestjs/platform-express": "^10.0.0",
-    "reflect-metadata": "^0.2.0",
-    "rxjs": "^7.8.1",
+    "bcrypt": "^6.0.0",
     "drizzle-orm": "0.45.2",
-    "pg": "^8.11.3"
+    "pg": "^8.11.3",
+    "reflect-metadata": "^0.2.0",
+    "rxjs": "^7.8.1"
   },
   "devDependencies": {
     "@nestjs/cli": "^10.0.0",
     "@nestjs/schematics": "^10.0.0",
     "@nestjs/testing": "^10.0.0",
+    "@types/bcrypt": "^5.0.2",
     "@types/express": "^4.17.17",
+    "@types/jest": "^29.5.12",
     "@types/node": "^20.3.1",
-    "typescript": "^5.1.3",
+    "@types/pg": "^8.11.0",
     "drizzle-kit": "^0.30.4",
-    "@types/pg": "^8.11.0"
+    "jest": "^29.7.0",
+    "ts-jest": "^29.1.2",
+    "typescript": "^5.1.3"
+  },
+  "jest": {
+    "moduleFileExtensions": [
+      "js",
+      "json",
+      "ts"
+    ],
+    "rootDir": ".",
+    "roots": [
+      "<rootDir>/src",
+      "<rootDir>/../../tests/unit"
+    ],
+    "testRegex": ".*\\.spec\\.ts$",
+    "transform": {
+      "^.+\\.(t|j)s$": "ts-jest"
+    },
+    "collectCoverageFrom": [
+      "**/*.(t|j)s"
+    ],
+    "coverageDirectory": "./coverage",
+    "testEnvironment": "node"
   }
-}
+}
\ No newline at end of file
diff --git a/apps/backend/src/app.module.ts b/apps/backend/src/app.module.ts
index 2f36ce3..5a9bdcb 100644
--- a/apps/backend/src/app.module.ts
+++ b/apps/backend/src/app.module.ts
@@ -1,9 +1,11 @@
 import { Module } from '@nestjs/common';
 import { DatabaseModule } from './database/database.module';
+import { AuthModule } from './auth/auth.module';
 
 @Module({
-  imports: [DatabaseModule],
+  imports: [DatabaseModule, AuthModule],
   controllers: [],
   providers: [],
 })
 export class AppModule {}
+
diff --git a/apps/backend/src/auth/auth.controller.ts b/apps/backend/src/auth/auth.controller.ts
new file mode 100644
index 0000000..59779d0
--- /dev/null
+++ b/apps/backend/src/auth/auth.controller.ts
@@ -0,0 +1,30 @@
+import { Controller, Post, Body, Get, Put, UseGuards, Request } from '@nestjs/common';
+import { AuthService } from './auth.service';
+import { JwtAuthGuard } from './jwt-auth.guard';
+
+@Controller('auth')
+export class AuthController {
+  constructor(private readonly authService: AuthService) {}
+
+  @Post('register')
+  async register(@Body() body: { username?: string; password?: string }) {
+    return this.authService.register(body.username ?? '', body.password ?? '');
+  }
+
+  @Post('login')
+  async login(@Body() body: { username?: string; password?: string }) {
+    return this.authService.login(body.username ?? '', body.password ?? '');
+  }
+
+  @UseGuards(JwtAuthGuard)
+  @Get('me')
+  async me(@Request() req: any) {
+    return this.authService.validateUser(req.user.sub);
+  }
+
+  @UseGuards(JwtAuthGuard)
+  @Put('profile')
+  async updateProfile(@Request() req: any, @Body() body: { username?: string; avatar?: string }) {
+    return this.authService.updateProfile(req.user.sub, body.username ?? '', body.avatar ?? '');
+  }
+}
diff --git a/apps/backend/src/auth/auth.module.ts b/apps/backend/src/auth/auth.module.ts
new file mode 100644
index 0000000..5cd93c8
--- /dev/null
+++ b/apps/backend/src/auth/auth.module.ts
@@ -0,0 +1,20 @@
+import { Module } from '@nestjs/common';
+import { JwtModule } from '@nestjs/jwt';
+import { AuthService } from './auth.service';
+import { AuthController } from './auth.controller';
+import { DatabaseModule } from '../database/database.module';
+
+@Module({
+  imports: [
+    DatabaseModule,
+    JwtModule.register({
+      global: true,
+      secret: process.env.JWT_SECRET || 'fallback-secret-for-development-only-12345',
+      signOptions: { expiresIn: '1d' },
+    }),
+  ],
+  controllers: [AuthController],
+  providers: [AuthService],
+  exports: [AuthService],
+})
+export class AuthModule {}
diff --git a/apps/backend/src/auth/auth.service.ts b/apps/backend/src/auth/auth.service.ts
new file mode 100644
index 0000000..78dc3d0
--- /dev/null
+++ b/apps/backend/src/auth/auth.service.ts
@@ -0,0 +1,135 @@
+import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
+import { DRIZZLE } from '../database/database.module';
+import { NodePgDatabase } from 'drizzle-orm/node-postgres';
+import * as schema from '../../db/schema';
+import { eq } from 'drizzle-orm';
+import * as bcrypt from 'bcrypt';
+import { JwtService } from '@nestjs/jwt';
+
+@Injectable()
+export class AuthService {
+  constructor(
+    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
+    private readonly jwtService: JwtService,
+  ) {}
+
+  async register(username: string, passwordHashRaw: string) {
+    if (!username || !passwordHashRaw) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Username and password are required. Obviously.' }
+      });
+    }
+
+    // Check if user already exists
+    const existing = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
+    if (existing.length > 0) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: `Username '${username}' is already taken. Try something more unique, perhaps?` }
+      });
+    }
+
+    // Hash password
+    const passwordHash = await bcrypt.hash(passwordHashRaw, 10);
+
+    // Insert user
+    const [newUser] = await this.db.insert(schema.users).values({
+      username,
+      passwordHash,
+    }).returning();
+
+    // Generate JWT token
+    const token = this.jwtService.sign({ sub: newUser.id, username: newUser.username });
+
+    const { passwordHash: _, ...profile } = newUser;
+    return {
+      success: true,
+      data: {
+        token,
+        user: profile,
+      }
+    };
+  }
+
+  async login(username: string, passwordHashRaw: string) {
+    if (!username || !passwordHashRaw) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Username and password are required. Did you forget them already?' }
+      });
+    }
+
+    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
+    if (!user) {
+      throw new UnauthorizedException({
+        success: false,
+        error: { message: 'Invalid credentials. Or maybe you do not exist yet.' }
+      });
+    }
+
+    const isMatch = await bcrypt.compare(passwordHashRaw, user.passwordHash);
+    if (!isMatch) {
+      throw new UnauthorizedException({
+        success: false,
+        error: { message: 'Invalid credentials. Password memory failure?' }
+      });
+    }
+
+    const token = this.jwtService.sign({ sub: user.id, username: user.username });
+
+    const { passwordHash: _, ...profile } = user;
+    return {
+      success: true,
+      data: {
+        token,
+        user: profile,
+      }
+    };
+  }
+
+  async validateUser(id: string) {
+    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
+    if (!user) {
+      throw new UnauthorizedException({
+        success: false,
+        error: { message: 'User session invalid. Please log in again.' }
+      });
+    }
+
+    const { passwordHash: _, ...profile } = user;
+    return {
+      success: true,
+      data: profile
+    };
+  }
+
+  async updateProfile(userId: string, username: string, avatar: string) {
+    if (!username) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Username cannot be empty. It defines your leaderboard existence.' }
+      });
+    }
+
+    // Check if new username is already taken by another user
+    const [existing] = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
+    if (existing && existing.id !== userId) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: `Username '${username}' is already taken. Be original for once.` }
+      });
+    }
+
+    const [updatedUser] = await this.db.update(schema.users)
+      .set({ username, avatar, updatedAt: new Date() })
+      .where(eq(schema.users.id, userId))
+      .returning();
+
+    const { passwordHash: _, ...profile } = updatedUser;
+    return {
+      success: true,
+      data: profile
+    };
+  }
+}
diff --git a/apps/backend/src/auth/jwt-auth.guard.ts b/apps/backend/src/auth/jwt-auth.guard.ts
new file mode 100644
index 0000000..83f105b
--- /dev/null
+++ b/apps/backend/src/auth/jwt-auth.guard.ts
@@ -0,0 +1,34 @@
+import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
+import { JwtService } from '@nestjs/jwt';
+import { Request } from 'express';
+
+@Injectable()
+export class JwtAuthGuard implements CanActivate {
+  constructor(private readonly jwtService: JwtService) {}
+
+  async canActivate(context: ExecutionContext): Promise<boolean> {
+    const request = context.switchToHttp().getRequest<Request>();
+    const token = this.extractTokenFromHeader(request);
+    if (!token) {
+      throw new UnauthorizedException({
+        success: false,
+        error: { message: 'Authentication token is missing. Access denied.' }
+      });
+    }
+    try {
+      const payload = await this.jwtService.verifyAsync(token);
+      request['user'] = payload;
+    } catch {
+      throw new UnauthorizedException({
+        success: false,
+        error: { message: 'Authentication token is invalid or expired.' }
+      });
+    }
+    return true;
+  }
+
+  private extractTokenFromHeader(request: Request): string | undefined {
+    const [type, token] = request.headers.authorization?.split(' ') ?? [];
+    return type === 'Bearer' ? token : undefined;
+  }
+}
diff --git a/apps/frontend/package.json b/apps/frontend/package.json
index 74b4e68..32f8bf7 100644
--- a/apps/frontend/package.json
+++ b/apps/frontend/package.json
@@ -11,14 +11,15 @@
   "dependencies": {
     "next": "15.0.0",
     "react": "19.0.0",
-    "react-dom": "19.0.0"
+    "react-dom": "19.0.0",
+    "zustand": "5.0.13"
   },
   "devDependencies": {
-    "typescript": "^5",
     "@types/node": "^20",
     "@types/react": "^18",
     "@types/react-dom": "^18",
     "eslint": "^8",
-    "eslint-config-next": "15.0.0"
+    "eslint-config-next": "15.0.0",
+    "typescript": "^5"
   }
 }
diff --git a/apps/frontend/src/app/actions/auth.ts b/apps/frontend/src/app/actions/auth.ts
new file mode 100644
index 0000000..f8604a2
--- /dev/null
+++ b/apps/frontend/src/app/actions/auth.ts
@@ -0,0 +1,190 @@
+'use server';
+
+import { cookies } from 'next/headers';
+
+export interface UserProfile {
+  id: string;
+  username: string;
+  avatar: string;
+  wastedCalories: number;
+  logicViolations: number;
+  createdAt: string;
+  updatedAt: string;
+}
+
+export type ActionResponse<T> =
+  | { success: true; data: T }
+  | { success: false; error: { message: string } };
+
+const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
+
+export async function actionRegister(
+  username?: string,
+  password?: string
+): Promise<ActionResponse<{ token: string; user: UserProfile }>> {
+  if (!username || !password) {
+    return {
+      success: false,
+      error: { message: 'Username and password are required. Do not make me ask again.' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/auth/register`, {
+      method: 'POST',
+      headers: { 'Content-Type': 'application/json' },
+      body: JSON.stringify({ username, password }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Registration failed. The universe is against you.' },
+      };
+    }
+
+    const cookieStore = await cookies();
+    cookieStore.set('token', data.data.token, {
+      httpOnly: true,
+      secure: process.env.NODE_ENV === 'production',
+      maxAge: 60 * 60 * 24, // 1 day
+      path: '/',
+    });
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Failed to contact backend. Maybe it does not like you.' },
+    };
+  }
+}
+
+export async function actionLogin(
+  username?: string,
+  password?: string
+): Promise<ActionResponse<{ token: string; user: UserProfile }>> {
+  if (!username || !password) {
+    return {
+      success: false,
+      error: { message: 'Username and password are required. Memory issues?' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/auth/login`, {
+      method: 'POST',
+      headers: { 'Content-Type': 'application/json' },
+      body: JSON.stringify({ username, password }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Invalid credentials. Password memory failure?' },
+      };
+    }
+
+    const cookieStore = await cookies();
+    cookieStore.set('token', data.data.token, {
+      httpOnly: true,
+      secure: process.env.NODE_ENV === 'production',
+      maxAge: 60 * 60 * 24, // 1 day
+      path: '/',
+    });
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Failed to contact backend. Try checking if it is even running.' },
+    };
+  }
+}
+
+export async function actionUpdateProfile(
+  username: string,
+  avatar: string
+): Promise<ActionResponse<UserProfile>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'Unauthorized. Log in first, please.' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/auth/profile`, {
+      method: 'PUT',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+      body: JSON.stringify({ username, avatar }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Profile update failed. Try to make a valid request.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Failed to update profile. Server did not feel like responding.' },
+    };
+  }
+}
+
+export async function actionLogout(): Promise<ActionResponse<null>> {
+  const cookieStore = await cookies();
+  cookieStore.delete('token');
+  return { success: true, data: null };
+}
+
+export async function actionGetMe(): Promise<ActionResponse<UserProfile>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'No active session.' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/auth/me`, {
+      method: 'GET',
+      headers: {
+        Authorization: `Bearer ${token}`,
+      },
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Session verification failed.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Could not reach session server.' },
+    };
+  }
+}
diff --git a/apps/frontend/src/app/auth/auth.module.css b/apps/frontend/src/app/auth/auth.module.css
new file mode 100644
index 0000000..c389209
--- /dev/null
+++ b/apps/frontend/src/app/auth/auth.module.css
@@ -0,0 +1,173 @@
+.container {
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  min-height: 100vh;
+  background: radial-gradient(circle at center, #1e1b4b 0%, #0f0c1b 100%);
+  font-family: "Outfit", "Inter", sans-serif;
+  color: #f8fafc;
+  padding: 2rem;
+}
+
+.card {
+  width: 100%;
+  max-width: 440px;
+  background: rgba(30, 27, 75, 0.4);
+  backdrop-filter: blur(16px);
+  border: 1px solid rgba(255, 255, 255, 0.08);
+  border-radius: 24px;
+  padding: 3rem 2.5rem;
+  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
+  text-align: center;
+  position: relative;
+  overflow: hidden;
+  transition:
+    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
+    border-color 0.3s ease;
+}
+
+.card::before {
+  content: "";
+  position: absolute;
+  top: 0;
+  left: 0;
+  width: 100%;
+  height: 4px;
+  background: linear-gradient(90deg, #4f46e5, #ec4899);
+}
+
+.title {
+  font-size: 2.25rem;
+  font-weight: 800;
+  margin-bottom: 0.5rem;
+  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
+  -webkit-background-clip: text;
+  -webkit-text-fill-color: transparent;
+  letter-spacing: -0.025em;
+}
+
+.subtitle {
+  font-size: 0.95rem;
+  color: #94a3b8;
+  margin-bottom: 2.5rem;
+}
+
+.form {
+  display: flex;
+  flex-direction: column;
+  gap: 1.25rem;
+  text-align: left;
+}
+
+.fieldGroup {
+  display: flex;
+  flex-direction: column;
+  gap: 0.5rem;
+}
+
+.label {
+  font-size: 0.85rem;
+  font-weight: 600;
+  color: #c7d2fe;
+  text-transform: uppercase;
+  letter-spacing: 0.05em;
+}
+
+.input {
+  background: rgba(15, 23, 42, 0.6);
+  border: 1px solid rgba(255, 255, 255, 0.1);
+  border-radius: 12px;
+  padding: 0.85rem 1rem;
+  color: #ffffff;
+  font-size: 1rem;
+  transition:
+    border-color 0.2s ease,
+    box-shadow 0.2s ease;
+}
+
+.input:focus {
+  outline: none;
+  border-color: #6366f1;
+  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
+}
+
+.button {
+  background: linear-gradient(95deg, #6366f1 0%, #4f46e5 100%);
+  color: #ffffff;
+  border: none;
+  border-radius: 12px;
+  padding: 1rem;
+  font-size: 1rem;
+  font-weight: 700;
+  cursor: pointer;
+  transition:
+    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
+    filter 0.2s ease,
+    box-shadow 0.2s ease;
+  margin-top: 1rem;
+  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
+}
+
+.button:hover:not(:disabled) {
+  filter: brightness(1.1);
+  transform: translateY(-1px);
+  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
+}
+
+.button:active:not(:disabled) {
+  transform: translateY(0);
+}
+
+.button:disabled {
+  background: #334155;
+  color: #64748b;
+  cursor: not-allowed;
+  box-shadow: none;
+}
+
+.toggleContainer {
+  margin-top: 2rem;
+  font-size: 0.9rem;
+  color: #94a3b8;
+}
+
+.toggleLink {
+  color: #818cf8;
+  font-weight: 600;
+  background: none;
+  border: none;
+  cursor: pointer;
+  padding: 0 0.25rem;
+  text-decoration: underline;
+  transition: color 0.2s ease;
+}
+
+.toggleLink:hover {
+  color: #a5b4fc;
+}
+
+.errorMessage {
+  background: rgba(239, 68, 68, 0.1);
+  border: 1px solid rgba(239, 68, 68, 0.3);
+  color: #ef4444;
+  border-radius: 12px;
+  padding: 0.85rem 1rem;
+  font-size: 0.9rem;
+  margin-bottom: 1.5rem;
+  text-align: left;
+  line-height: 1.4;
+  animation: shake 0.4s ease;
+}
+
+@keyframes shake {
+  0%,
+  100% {
+    transform: translateX(0);
+  }
+  25% {
+    transform: translateX(-4px);
+  }
+  75% {
+    transform: translateX(4px);
+  }
+}
diff --git a/apps/frontend/src/app/auth/page.tsx b/apps/frontend/src/app/auth/page.tsx
new file mode 100644
index 0000000..e67939b
--- /dev/null
+++ b/apps/frontend/src/app/auth/page.tsx
@@ -0,0 +1,126 @@
+'use client';
+
+import React, { useState, useTransition } from 'react';
+import { useRouter } from 'next/navigation';
+import styles from './auth.module.css';
+import { actionLogin, actionRegister } from '../actions/auth';
+import { useAuthStore } from '../../core/store/useAuthStore';
+
+export default function AuthPage() {
+  const router = useRouter();
+  const [isLogin, setIsLogin] = useState(true);
+  const [username, setUsername] = useState('');
+  const [password, setPassword] = useState('');
+  const [error, setError] = useState<string | null>(null);
+  const [isPending, startTransition] = useTransition();
+
+  const setUser = useAuthStore((state) => state.setUser);
+
+  const handleSubmit = (e: React.FormEvent) => {
+    e.preventDefault();
+    setError(null);
+
+    if (!username.trim()) {
+      setError('Username cannot be empty. How else will people judge you?');
+      return;
+    }
+
+    if (password.length < 6) {
+      setError('Password must be at least 6 characters. Let us make it slightly harder to hack.');
+      return;
+    }
+
+    startTransition(async () => {
+      const response = isLogin
+        ? await actionLogin(username, password)
+        : await actionRegister(username, password);
+
+      if (response.success) {
+        setUser(response.data.user);
+        router.push('/profile');
+      } else {
+        setError(response.error.message);
+      }
+    });
+  };
+
+  return (
+    <div className={styles.container}>
+      <div className={styles.card}>
+        <h1 className={styles.title}>
+          {isLogin ? 'Log In' : 'Register'}
+        </h1>
+        <p className={styles.subtitle}>
+          {isLogin
+            ? 'Enter your credentials to check your failure levels.'
+            : 'Join the leaderboard of wasted engineering potential.'}
+        </p>
+
+        {error && (
+          <div className={styles.errorMessage} role="alert">
+            {error}
+          </div>
+        )}
+
+        <form className={styles.form} onSubmit={handleSubmit}>
+          <div className={styles.fieldGroup}>
+            <label className={styles.label} htmlFor="username">
+              Username
+            </label>
+            <input
+              id="username"
+              type="text"
+              className={styles.input}
+              value={username}
+              onChange={(e) => setUsername(e.target.value)}
+              disabled={isPending}
+              placeholder="e.g. CodeWaster99"
+              autoComplete="username"
+            />
+          </div>
+
+          <div className={styles.fieldGroup}>
+            <label className={styles.label} htmlFor="password">
+              Password
+            </label>
+            <input
+              id="password"
+              type="password"
+              className={styles.input}
+              value={password}
+              onChange={(e) => setPassword(e.target.value)}
+              disabled={isPending}
+              placeholder="••••••••"
+              autoComplete="current-password"
+            />
+          </div>
+
+          <button
+            type="submit"
+            className={styles.button}
+            disabled={isPending}
+          >
+            {isPending
+              ? (isLogin ? 'Logging In...' : 'Registering...')
+              : (isLogin ? 'Enter' : 'Create Account')}
+          </button>
+        </form>
+
+        <div className={styles.toggleContainer}>
+          {isLogin ? "New here? " : "Already have an account? "}
+          <button
+            type="button"
+            className={styles.toggleLink}
+            onClick={() => {
+              setIsLogin(!isLogin);
+              setError(null);
+            }}
+            disabled={isPending}
+          >
+            {isLogin ? 'Register now' : 'Sign in'}
+          </button>
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/apps/frontend/src/app/profile/page.tsx b/apps/frontend/src/app/profile/page.tsx
new file mode 100644
index 0000000..1d2589e
--- /dev/null
+++ b/apps/frontend/src/app/profile/page.tsx
@@ -0,0 +1,182 @@
+'use client';
+
+import React, { useState, useEffect, useTransition } from 'react';
+import { useRouter } from 'next/navigation';
+import styles from './profile.module.css';
+import { actionGetMe, actionUpdateProfile, actionLogout } from '../actions/auth';
+import { useAuthStore } from '../../core/store/useAuthStore';
+
+const AVATARS = [
+  { id: 'avatar_clown', emoji: '🤡', label: 'Clown' },
+  { id: 'avatar_turtle', emoji: '🐢', label: 'Turtle' },
+  { id: 'avatar_trash', emoji: '🗑️', label: 'Trash Can' },
+  { id: 'avatar_bug', emoji: '🐛', label: 'Bug' },
+  { id: 'avatar_ghost', emoji: '👻', label: 'Ghost' },
+];
+
+const AVATAR_MAP: Record<string, string> = {
+  avatar_clown: '🤡',
+  avatar_turtle: '🐢',
+  avatar_trash: '🗑️',
+  avatar_bug: '🐛',
+  avatar_ghost: '👻',
+  default_avatar: '👤'
+};
+
+export default function ProfilePage() {
+  const router = useRouter();
+  const user = useAuthStore((state) => state.user);
+  const setUser = useAuthStore((state) => state.setUser);
+  const logoutStore = useAuthStore((state) => state.logout);
+
+  const [username, setUsername] = useState('');
+  const [avatar, setAvatar] = useState('default_avatar');
+  const [success, setSuccess] = useState<string | null>(null);
+  const [error, setError] = useState<string | null>(null);
+  const [isPending, startTransition] = useTransition();
+
+  useEffect(() => {
+    if (!user) {
+      startTransition(async () => {
+        const response = await actionGetMe();
+        if (response.success) {
+          setUser(response.data);
+          setUsername(response.data.username);
+          setAvatar(response.data.avatar || 'default_avatar');
+        } else {
+          router.push('/auth');
+        }
+      });
+    } else {
+      setUsername(user.username);
+      setAvatar(user.avatar || 'default_avatar');
+    }
+  }, [user, setUser, router]);
+
+  const handleSave = (e: React.FormEvent) => {
+    e.preventDefault();
+    setError(null);
+    setSuccess(null);
+
+    if (!username.trim()) {
+      setError('Username cannot be empty. Stand proud.');
+      return;
+    }
+
+    startTransition(async () => {
+      const response = await actionUpdateProfile(username, avatar);
+      if (response.success) {
+        setUser(response.data);
+        setSuccess('Profile updated successfully! Leaderboard is reflecting your changes.');
+      } else {
+        setError(response.error.message);
+      }
+    });
+  };
+
+  const handleLogout = async () => {
+    setError(null);
+    setSuccess(null);
+    const response = await actionLogout();
+    if (response.success) {
+      logoutStore();
+      router.push('/auth');
+    } else {
+      setError('Logout failed. You are stuck here.');
+    }
+  };
+
+  if (!user && isPending) {
+    return (
+      <div className={styles.container}>
+        <div className={styles.card} style={{ textAlign: 'center' }}>
+          <h2 className={styles.title}>Loading session...</h2>
+        </div>
+      </div>
+    );
+  }
+
+  if (!user) return null;
+
+  return (
+    <div className={styles.container}>
+      <div className={styles.card}>
+        <div className={styles.header}>
+          <div className={styles.avatarDisplay}>
+            {AVATAR_MAP[avatar] || '👤'}
+          </div>
+          <h1 className={styles.title}>{user.username}</h1>
+        </div>
+
+        <div className={styles.statsGrid}>
+          <div className={styles.statBox}>
+            <div className={styles.statLabel}>Wasted Calories</div>
+            <div className={styles.statVal}>{user.wastedCalories} kcal</div>
+          </div>
+          <div className={styles.statBox}>
+            <div className={styles.statLabel}>Logic Violations</div>
+            <div className={styles.statVal}>{user.logicViolations}</div>
+          </div>
+        </div>
+
+        {success && <div className={styles.successMessage}>{success}</div>}
+        {error && <div className={styles.errorMessage}>{error}</div>}
+
+        <form className={styles.form} onSubmit={handleSave}>
+          <div className={styles.fieldGroup}>
+            <label className={styles.label} htmlFor="username">
+              Username
+            </label>
+            <input
+              id="username"
+              type="text"
+              className={styles.input}
+              value={username}
+              onChange={(e) => setUsername(e.target.value)}
+              disabled={isPending}
+              placeholder="e.g. CodeWaster99"
+            />
+          </div>
+
+          <div className={styles.fieldGroup}>
+            <label className={styles.label}>Select Avatar</label>
+            <div className={styles.avatarPicker}>
+              {AVATARS.map((av) => (
+                <button
+                  key={av.id}
+                  type="button"
+                  aria-label={av.label}
+                  className={`${styles.avatarOption} ${
+                    avatar === av.id ? styles.avatarOptionSelected : ''
+                  }`}
+                  onClick={() => setAvatar(av.id)}
+                  disabled={isPending}
+                >
+                  {av.emoji}
+                </button>
+              ))}
+            </div>
+          </div>
+
+          <div className={styles.actions}>
+            <button
+              type="submit"
+              className={styles.saveButton}
+              disabled={isPending}
+            >
+              {isPending ? 'Saving...' : 'Save Profile'}
+            </button>
+            <button
+              type="button"
+              className={styles.logoutButton}
+              onClick={handleLogout}
+              disabled={isPending}
+            >
+              Logout
+            </button>
+          </div>
+        </form>
+      </div>
+    </div>
+  );
+}
diff --git a/apps/frontend/src/app/profile/profile.module.css b/apps/frontend/src/app/profile/profile.module.css
new file mode 100644
index 0000000..990b263
--- /dev/null
+++ b/apps/frontend/src/app/profile/profile.module.css
@@ -0,0 +1,254 @@
+.container {
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  min-height: 100vh;
+  background: radial-gradient(circle at center, #111827 0%, #030712 100%);
+  font-family: "Outfit", "Inter", sans-serif;
+  color: #f8fafc;
+  padding: 2rem;
+}
+
+.card {
+  width: 100%;
+  max-width: 500px;
+  background: rgba(17, 24, 39, 0.4);
+  backdrop-filter: blur(20px);
+  border: 1px solid rgba(255, 255, 255, 0.08);
+  border-radius: 28px;
+  padding: 3rem 2.5rem;
+  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
+  position: relative;
+}
+
+.card::before {
+  content: "";
+  position: absolute;
+  top: 0;
+  left: 0;
+  width: 100%;
+  height: 4px;
+  background: linear-gradient(90deg, #10b981, #3b82f6);
+}
+
+.header {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  margin-bottom: 2.5rem;
+}
+
+.avatarDisplay {
+  font-size: 4.5rem;
+  background: rgba(255, 255, 255, 0.05);
+  border: 2px solid rgba(255, 255, 255, 0.15);
+  border-radius: 50%;
+  width: 110px;
+  height: 110px;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  margin-bottom: 1rem;
+  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
+  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
+}
+
+.avatarDisplay:hover {
+  transform: scale(1.05) rotate(5deg);
+}
+
+.title {
+  font-size: 1.85rem;
+  font-weight: 800;
+  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
+  -webkit-background-clip: text;
+  -webkit-text-fill-color: transparent;
+  letter-spacing: -0.02em;
+}
+
+.statsGrid {
+  display: grid;
+  grid-template-columns: 1fr 1fr;
+  gap: 1.25rem;
+  margin-bottom: 2.5rem;
+}
+
+.statBox {
+  background: rgba(255, 255, 255, 0.03);
+  border: 1px solid rgba(255, 255, 255, 0.05);
+  border-radius: 16px;
+  padding: 1.25rem;
+  text-align: center;
+  transition:
+    background 0.2s ease,
+    border-color 0.2s ease;
+}
+
+.statBox:hover {
+  background: rgba(255, 255, 255, 0.05);
+  border-color: rgba(255, 255, 255, 0.1);
+}
+
+.statLabel {
+  font-size: 0.75rem;
+  font-weight: 700;
+  color: #94a3b8;
+  text-transform: uppercase;
+  letter-spacing: 0.07em;
+  margin-bottom: 0.5rem;
+}
+
+.statVal {
+  font-size: 1.75rem;
+  font-weight: 800;
+  color: #f1f5f9;
+}
+
+.form {
+  display: flex;
+  flex-direction: column;
+  gap: 1.5rem;
+}
+
+.fieldGroup {
+  display: flex;
+  flex-direction: column;
+  gap: 0.5rem;
+}
+
+.label {
+  font-size: 0.85rem;
+  font-weight: 600;
+  color: #94a3b8;
+  text-transform: uppercase;
+  letter-spacing: 0.05em;
+}
+
+.input {
+  background: rgba(15, 23, 42, 0.6);
+  border: 1px solid rgba(255, 255, 255, 0.1);
+  border-radius: 12px;
+  padding: 0.85rem 1rem;
+  color: #ffffff;
+  font-size: 1rem;
+  transition: border-color 0.2s ease;
+}
+
+.input:focus {
+  outline: none;
+  border-color: #10b981;
+  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
+}
+
+.avatarPicker {
+  display: flex;
+  justify-content: center;
+  gap: 0.85rem;
+  margin-top: 0.5rem;
+}
+
+.avatarOption {
+  font-size: 2rem;
+  background: rgba(255, 255, 255, 0.03);
+  border: 2px solid transparent;
+  border-radius: 50%;
+  width: 54px;
+  height: 54px;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  cursor: pointer;
+  transition:
+    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
+    border-color 0.2s ease,
+    background 0.2s ease;
+}
+
+.avatarOption:hover {
+  transform: translateY(-2px) scale(1.05);
+  background: rgba(255, 255, 255, 0.08);
+}
+
+.avatarOptionSelected {
+  border-color: #10b981;
+  background: rgba(16, 185, 129, 0.15) !important;
+  transform: scale(1.1);
+}
+
+.actions {
+  display: flex;
+  gap: 1rem;
+  margin-top: 1rem;
+}
+
+.saveButton {
+  flex: 2;
+  background: linear-gradient(95deg, #10b981 0%, #059669 100%);
+  color: #ffffff;
+  border: none;
+  border-radius: 12px;
+  padding: 1rem;
+  font-size: 1rem;
+  font-weight: 700;
+  cursor: pointer;
+  transition:
+    filter 0.2s ease,
+    transform 0.2s ease;
+  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
+}
+
+.saveButton:hover:not(:disabled) {
+  filter: brightness(1.1);
+  transform: translateY(-1px);
+}
+
+.saveButton:disabled {
+  background: #334155;
+  color: #64748b;
+  cursor: not-allowed;
+  box-shadow: none;
+}
+
+.logoutButton {
+  flex: 1;
+  background: rgba(239, 68, 68, 0.1);
+  color: #ef4444;
+  border: 1px solid rgba(239, 68, 68, 0.3);
+  border-radius: 12px;
+  padding: 1rem;
+  font-size: 1rem;
+  font-weight: 700;
+  cursor: pointer;
+  transition:
+    background 0.2s ease,
+    color 0.2s ease;
+}
+
+.logoutButton:hover {
+  background: #ef4444;
+  color: #ffffff;
+}
+
+.errorMessage {
+  background: rgba(239, 68, 68, 0.1);
+  border: 1px solid rgba(239, 68, 68, 0.3);
+  color: #ef4444;
+  border-radius: 12px;
+  padding: 0.85rem 1rem;
+  font-size: 0.9rem;
+  margin-bottom: 1.5rem;
+  text-align: left;
+  line-height: 1.4;
+}
+
+.successMessage {
+  background: rgba(16, 185, 129, 0.1);
+  border: 1px solid rgba(16, 185, 129, 0.3);
+  color: #10b981;
+  border-radius: 12px;
+  padding: 0.85rem 1rem;
+  font-size: 0.9rem;
+  margin-bottom: 1.5rem;
+  text-align: left;
+  line-height: 1.4;
+}
diff --git a/apps/frontend/src/core/store/useAuthStore.ts b/apps/frontend/src/core/store/useAuthStore.ts
new file mode 100644
index 0000000..80a03aa
--- /dev/null
+++ b/apps/frontend/src/core/store/useAuthStore.ts
@@ -0,0 +1,16 @@
+import { create } from 'zustand';
+import { UserProfile } from '../../app/actions/auth';
+
+interface AuthState {
+  user: UserProfile | null;
+  isAuthenticated: boolean;
+  setUser: (user: UserProfile | null) => void;
+  logout: () => void;
+}
+
+export const useAuthStore = create<AuthState>((set) => ({
+  user: null,
+  isAuthenticated: false,
+  setUser: (user) => set({ user, isAuthenticated: !!user }),
+  logout: () => set({ user: null, isAuthenticated: false }),
+}));
diff --git a/apps/frontend/src/middleware.ts b/apps/frontend/src/middleware.ts
new file mode 100644
index 0000000..afb3d19
--- /dev/null
+++ b/apps/frontend/src/middleware.ts
@@ -0,0 +1,28 @@
+import { NextResponse } from 'next/server';
+import type { NextRequest } from 'next/server';
+
+export function middleware(request: NextRequest) {
+  const token = request.cookies.get('token')?.value;
+
+  if (request.nextUrl.pathname.startsWith('/profile')) {
+    if (!token) {
+      const url = request.nextUrl.clone();
+      url.pathname = '/auth';
+      return NextResponse.redirect(url);
+    }
+  }
+
+  if (request.nextUrl.pathname.startsWith('/auth')) {
+    if (token) {
+      const url = request.nextUrl.clone();
+      url.pathname = '/profile';
+      return NextResponse.redirect(url);
+    }
+  }
+
+  return NextResponse.next();
+}
+
+export const config = {
+  matcher: ['/profile/:path*', '/auth/:path*'],
+};
diff --git a/tests/e2e/auth.spec.ts b/tests/e2e/auth.spec.ts
new file mode 100644
index 0000000..7939ce2
--- /dev/null
+++ b/tests/e2e/auth.spec.ts
@@ -0,0 +1,45 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('User Authentication & Profile Flow', () => {
+  test.beforeEach(async ({ page }) => {
+    await page.context().clearCookies();
+  });
+
+  test('should register, update profile, and logout', async ({ page }) => {
+    await page.goto('/auth');
+    await expect(page.locator('h1')).toHaveText('Log In');
+
+    await page.click('button:has-text("Register now")');
+    await expect(page.locator('h1')).toHaveText('Register');
+
+    await page.click('button[type="submit"]');
+    await expect(page.locator('[role="alert"]').first()).toContainText('Username cannot be empty');
+
+    const uniqueUsername = `testuser_${Date.now()}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+
+    await page.click('button[type="submit"]');
+
+    await expect(page).toHaveURL(/\/profile/);
+    await expect(page.locator('h1')).toHaveText(uniqueUsername);
+
+    await expect(page.locator('text=Wasted Calories')).toBeVisible();
+    await expect(page.locator('text=Logic Violations')).toBeVisible();
+
+    await page.fill('#username', `${uniqueUsername}_updated`);
+    await page.click('button[aria-label="Clown"]');
+
+    await page.click('button:has-text("Save Profile")');
+
+    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
+    await expect(page.locator('h1')).toHaveText(`${uniqueUsername}_updated`);
+
+    await page.click('button:has-text("Logout")');
+    await expect(page).toHaveURL(/\/auth/);
+    await expect(page.locator('h1')).toHaveText('Log In');
+
+    await page.goto('/profile');
+    await expect(page).toHaveURL(/\/auth/);
+  });
+});
diff --git a/tests/unit/backend/auth/auth.service.spec.ts b/tests/unit/backend/auth/auth.service.spec.ts
new file mode 100644
index 0000000..f13c4fb
--- /dev/null
+++ b/tests/unit/backend/auth/auth.service.spec.ts
@@ -0,0 +1,155 @@
+import { Test, TestingModule } from '@nestjs/testing';
+import { AuthService } from '../../../../apps/backend/src/auth/auth.service';
+import { DRIZZLE } from '../../../../apps/backend/src/database/database.module';
+import { JwtService } from '@nestjs/jwt';
+import { BadRequestException, UnauthorizedException } from '@nestjs/common';
+import * as bcrypt from 'bcrypt';
+
+
+jest.mock('bcrypt', () => ({
+  hash: jest.fn().mockResolvedValue('hashed-password'),
+  compare: jest.fn(),
+}));
+
+describe('AuthService', () => {
+  let service: AuthService;
+  let dbMock: any;
+  let jwtServiceMock: any;
+
+  beforeEach(async () => {
+    dbMock = {
+      select: jest.fn().mockReturnThis(),
+      from: jest.fn().mockReturnThis(),
+      where: jest.fn().mockReturnThis(),
+      limit: jest.fn(),
+      insert: jest.fn().mockReturnThis(),
+      values: jest.fn().mockReturnThis(),
+      returning: jest.fn(),
+      update: jest.fn().mockReturnThis(),
+      set: jest.fn().mockReturnThis(),
+    };
+
+    jwtServiceMock = {
+      sign: jest.fn().mockReturnValue('mock-jwt-token'),
+    };
+
+    const module: TestingModule = await Test.createTestingModule({
+      providers: [
+        AuthService,
+        {
+          provide: DRIZZLE,
+          useValue: dbMock,
+        },
+        {
+          provide: JwtService,
+          useValue: jwtServiceMock,
+        },
+      ],
+    }).compile();
+
+    service = module.get<AuthService>(AuthService);
+  });
+
+  describe('register', () => {
+    it('should successfully register a new user', async () => {
+      dbMock.limit.mockResolvedValue([]);
+      
+      const createdUser = {
+        id: 'new-uuid',
+        username: 'newuser',
+        passwordHash: 'hashed-password',
+        avatar: 'default_avatar',
+        wastedCalories: 0,
+        logicViolations: 0,
+        createdAt: new Date(),
+        updatedAt: new Date(),
+      };
+      dbMock.returning.mockResolvedValue([createdUser]);
+
+      const result = await service.register('newuser', 'password123');
+
+      expect(dbMock.select).toHaveBeenCalled();
+      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
+      expect(dbMock.insert).toHaveBeenCalled();
+      expect(jwtServiceMock.sign).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data.token).toBe('mock-jwt-token');
+      expect(result.data.user.username).toBe('newuser');
+    });
+
+    it('should throw BadRequestException if user already exists', async () => {
+      dbMock.limit.mockResolvedValue([{ id: 'existing-id' }]);
+
+      await expect(service.register('existinguser', 'password123')).rejects.toThrow(
+        BadRequestException,
+      );
+    });
+  });
+
+  describe('login', () => {
+    it('should successfully log in a user with correct credentials', async () => {
+      const user = {
+        id: 'user-id',
+        username: 'testuser',
+        passwordHash: 'hashed-password',
+        avatar: 'default_avatar',
+        wastedCalories: 100,
+        logicViolations: 2,
+        createdAt: new Date(),
+        updatedAt: new Date(),
+      };
+      dbMock.limit.mockResolvedValue([user]);
+      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
+
+      const result = await service.login('testuser', 'password123');
+
+      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
+      expect(result.success).toBe(true);
+      expect(result.data.token).toBe('mock-jwt-token');
+      expect(result.data.user.id).toBe('user-id');
+    });
+
+    it('should throw UnauthorizedException for invalid username', async () => {
+      dbMock.limit.mockResolvedValue([]);
+
+      await expect(service.login('nonexistent', 'password123')).rejects.toThrow(
+        UnauthorizedException,
+      );
+    });
+
+    it('should throw UnauthorizedException for incorrect password', async () => {
+      const user = { username: 'testuser', passwordHash: 'hashed-password' };
+      dbMock.limit.mockResolvedValue([user]);
+      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
+
+      await expect(service.login('testuser', 'wrongpass')).rejects.toThrow(
+        UnauthorizedException,
+      );
+    });
+  });
+
+  describe('updateProfile', () => {
+    it('should successfully update profile username and avatar', async () => {
+      dbMock.limit.mockResolvedValue([]);
+
+      const updatedUser = {
+        id: 'user-id',
+        username: 'newusername',
+        passwordHash: 'hashed-password',
+        avatar: 'avatar_clown',
+        wastedCalories: 100,
+        logicViolations: 2,
+        createdAt: new Date(),
+        updatedAt: new Date(),
+      };
+      dbMock.returning.mockResolvedValue([updatedUser]);
+
+      const result = await service.updateProfile('user-id', 'newusername', 'avatar_clown');
+
+      expect(dbMock.update).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data.username).toBe('newusername');
+      expect(result.data.avatar).toBe('avatar_clown');
+    });
+  });
+});

</diff>
