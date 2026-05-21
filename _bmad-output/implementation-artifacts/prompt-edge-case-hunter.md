# Role: Edge Case Hunter (Path Tracer)

You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling.
Scan only the diff hunks and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.
Ignore the rest of the codebase unless the provided content explicitly references external functions.

## Goal:
Walk every branching path and boundary condition within scope — report only unhandled ones.
Walk all branching paths: control flow (conditionals, loops, error handlers, early returns) and domain boundaries (where values, states, or conditions transition). Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps.
For each path: determine whether the content handles it.
Collect only the unhandled paths as findings — discard handled ones silently.

## Output Format:
Return ONLY a valid JSON array of objects. Each object must contain exactly these four fields and nothing else:
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
No extra text, no explanations, no markdown wrapping. An empty array `[]` is valid when no unhandled paths are found.

## Diff Content
```diff
diff --git a/apps/backend/db/schema.ts b/apps/backend/db/schema.ts
index 630e94e..2b63e25 100644
--- a/apps/backend/db/schema.ts
+++ b/apps/backend/db/schema.ts
@@ -1,4 +1,5 @@
 import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
+import { relations } from "drizzle-orm";
 
 export const users = pgTable("users", {
   id: uuid("id").defaultRandom().primaryKey(),
@@ -11,3 +12,26 @@ export const users = pgTable("users", {
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
 });
 
+export const posts = pgTable("posts", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  title: text("title").notNull(),
+  content: text("content").notNull(),
+  wastedCalories: integer("wasted_calories").default(0).notNull(),
+  authorId: uuid("author_id")
+    .references(() => users.id, { onDelete: "cascade" })
+    .notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+  updatedAt: timestamp("updated_at").defaultNow().notNull(),
+});
+
+export const usersRelations = relations(users, ({ many }) => ({
+  posts: many(posts),
+}));
+
+export const postsRelations = relations(posts, ({ one }) => ({
+  author: one(users, {
+    fields: [posts.authorId],
+    references: [users.id],
+  }),
+}));
+
diff --git a/apps/backend/db/seed.ts b/apps/backend/db/seed.ts
new file mode 100644
index 0000000..ecf10d3
--- /dev/null
+++ b/apps/backend/db/seed.ts
@@ -0,0 +1,91 @@
+import { db } from './index';
+import { users, posts } from './schema';
+import * as bcrypt from 'bcrypt';
+import { calculateScoreHelper } from '../src/leaderboard/leaderboard.service';
+
+async function main() {
+  console.log('Seeding database...');
+
+  // Clean up existing data
+  await db.delete(posts);
+  await db.delete(users);
+
+  // Hash passwords
+  const passwordHash = await bcrypt.hash('password123', 10);
+
+  // Create mock users
+  const [user1, user2, user3] = await db.insert(users).values([
+    {
+      username: 'alice',
+      passwordHash,
+      avatar: 'avatar_developer',
+      wastedCalories: 0,
+      logicViolations: 0,
+    },
+    {
+      username: 'bob',
+      passwordHash,
+      avatar: 'avatar_designer',
+      wastedCalories: 0,
+      logicViolations: 0,
+    },
+    {
+      username: 'charlie',
+      passwordHash,
+      avatar: 'avatar_manager',
+      wastedCalories: 0,
+      logicViolations: 0,
+    },
+  ]).returning();
+
+  console.log('Created mock users.');
+
+  // Use the helper from leaderboard service to avoid duplication (DRY)
+  const calculateScore = calculateScoreHelper;
+
+  const postContents = [
+    {
+      title: 'Quick Update',
+      content: 'We are pivoting. No questions asked. Just trust the process!', // Length: 60 (< 100), Words: 10, Scream: No, Code: No, Frustration: ! (1) => 50 - 50 + 5 = 5
+      authorId: user1.id,
+    },
+    {
+      title: 'Clean Architecture implementation details',
+      content: 'Check out our clean architecture:\n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean and scalable.', // Length: 120, Words: 18, Scream: No, Code: Yes (+100) => 90 + 100 = 190
+      authorId: user2.id,
+    },
+    {
+      title: 'I AM FREAKING OUT NOW',
+      content: 'WHY IS THE DEPLOYMENT FAILING AGAIN?! THIS IS TOTALLY UNACCEPTABLE! OUR CLIENTS ARE LEAVING! HELP...', // Length: 97 (<100), Words: 15, Scream: Yes (+50), Code: No, Frustration: ?, !, !, !, ... (5 occurrences) => 75 + 50 - 50 + 25 = 100
+      authorId: user3.id,
+    },
+    {
+      title: 'The Ultimate Guide to Synergy',
+      content: 'We need to leverage our synergy to align our core competencies and optimize our bandwidth. By scaling our paradigms and disruptive thinking, we will establish a high-performing ecosystem. Let\'s deep dive into the KPIs and OKRs that will drive our pivot. We must ensure that our deliverables are decoupled and cloud-native. This is the only way to monetize our microservices and achieve a paradigm shift. We need to run a sprint to address the low-hanging fruits. This is a game-changer! Our roadmap must be agile and customer-centric. Let\'s touch base next week to align on the action items. We should take this offline and circle back. At the end of the day, it is about the bottom line and bandwidth. We need to think outside the box and push the envelope. This is a win-win situation for all stakeholders. Let\'s hit the ground running and make it happen! Can you double check the server logs? I need to make sure we are not dropping packets. This is critical for our MVP launch. We cannot afford any downtime at this stage! Let\'s get to work now.', // Length: 1026 (>1000), Words: 181, Scream: No, Code: No, Frustration: !, ?, ! (3 occurrences) => 905 + 150 + 15 = 1070
+      authorId: user1.id,
+    },
+    {
+      title: 'MICROSERVICE ARCHITECTURE SHAKEUP',
+      content: 'HELLO TEAM, WE ARE REFACTORING EVERYTHING TO MICROSERVICES TODAY!!!\n\nHere is the new config:\n```yaml\nservices:\n  auth:\n    image: auth-service:latest\n  leaderboard:\n    image: leaderboard:latest\n```\n\nWE MUST DEPLOY THIS RIGHT NOW TO PREVENT DISASTER! DOES ANYONE HAVE QUESTIONS?! IF NOT, JUST MERGE IT AND RUN! DO NOT DELAY OR WE ARE DOOMED!!!', // Length: 318, Words: 53, Scream: Yes (+50), Code: Yes (+100), Frustration: ! (8), ? (2) = 10 occurrences => 265 + 50 + 100 + 50 = 465
+      authorId: user2.id,
+    },
+  ];
+
+  for (const postData of postContents) {
+    const wastedCalories = calculateScore(postData.content);
+    await db.insert(posts).values({
+      title: postData.title,
+      content: postData.content,
+      wastedCalories,
+      authorId: postData.authorId,
+    });
+  }
+
+  console.log('Database seeded successfully!');
+  process.exit(0);
+}
+
+main().catch((err) => {
+  console.error('Seed failed:', err);
+  process.exit(1);
+});
diff --git a/apps/backend/drizzle/0001_hard_boomerang.sql b/apps/backend/drizzle/0001_hard_boomerang.sql
new file mode 100644
index 0000000..d6827d3
--- /dev/null
+++ b/apps/backend/drizzle/0001_hard_boomerang.sql
@@ -0,0 +1,11 @@
+CREATE TABLE "posts" (
+	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
+	"title" text NOT NULL,
+	"content" text NOT NULL,
+	"wasted_calories" integer DEFAULT 0 NOT NULL,
+	"author_id" uuid NOT NULL,
+	"created_at" timestamp DEFAULT now() NOT NULL,
+	"updated_at" timestamp DEFAULT now() NOT NULL
+);
+--> statement-breakpoint
+ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
\ No newline at end of file
diff --git a/apps/backend/package.json b/apps/backend/package.json
index b1effaf..e32c864 100644
--- a/apps/backend/package.json
+++ b/apps/backend/package.json
@@ -6,18 +6,22 @@
     "build": "nest build",
     "start": "nest start",
     "start:dev": "nest start --watch",
-    "test": "jest"
+    "test": "jest",
+    "db:seed": "node --env-file=.env -r ts-node/register db/seed.ts"
   },
   "dependencies": {
     "@nestjs/common": "^10.0.0",
     "@nestjs/core": "^10.0.0",
     "@nestjs/jwt": "^11.0.2",
     "@nestjs/platform-express": "^10.0.0",
+    "@nestjs/platform-socket.io": "^10.0.0",
+    "@nestjs/websockets": "^10.0.0",
     "bcrypt": "^6.0.0",
     "drizzle-orm": "0.45.2",
     "pg": "^8.11.3",
     "reflect-metadata": "^0.2.0",
-    "rxjs": "^7.8.1"
+    "rxjs": "^7.8.1",
+    "socket.io": "^4.7.5"
   },
   "devDependencies": {
     "@nestjs/cli": "^10.0.0",
@@ -31,6 +35,7 @@
     "drizzle-kit": "^0.30.4",
     "jest": "^29.7.0",
     "ts-jest": "^29.1.2",
+    "ts-node": "^10.9.2",
     "typescript": "^5.1.3"
   },
   "jest": {
diff --git a/apps/backend/src/app.module.ts b/apps/backend/src/app.module.ts
index 5a9bdcb..fc08cff 100644
--- a/apps/backend/src/app.module.ts
+++ b/apps/backend/src/app.module.ts
@@ -1,11 +1,12 @@
 import { Module } from '@nestjs/common';
 import { DatabaseModule } from './database/database.module';
 import { AuthModule } from './auth/auth.module';
+import { LeaderboardModule } from './leaderboard/leaderboard.module';
 
 @Module({
-  imports: [DatabaseModule, AuthModule],
+  imports: [DatabaseModule, AuthModule, LeaderboardModule],
   controllers: [],
   providers: [],
 })
-export class AppModule {}
+export class AppModule { }
 
diff --git a/apps/backend/src/leaderboard/leaderboard.controller.ts b/apps/backend/src/leaderboard/leaderboard.controller.ts
new file mode 100644
index 0000000..74b75f4
--- /dev/null
+++ b/apps/backend/src/leaderboard/leaderboard.controller.ts
@@ -0,0 +1,12 @@
+import { Controller, Get } from '@nestjs/common';
+import { LeaderboardService } from './leaderboard.service';
+
+@Controller('leaderboard')
+export class LeaderboardController {
+  constructor(private readonly leaderboardService: LeaderboardService) { }
+
+  @Get()
+  async getLeaderboard() {
+    return this.leaderboardService.getLeaderboard();
+  }
+}
diff --git a/apps/backend/src/leaderboard/leaderboard.gateway.ts b/apps/backend/src/leaderboard/leaderboard.gateway.ts
new file mode 100644
index 0000000..2ecc7df
--- /dev/null
+++ b/apps/backend/src/leaderboard/leaderboard.gateway.ts
@@ -0,0 +1,45 @@
+import {
+  WebSocketGateway,
+  WebSocketServer,
+  OnGatewayConnection,
+  OnGatewayDisconnect,
+} from '@nestjs/websockets';
+import { Server, Socket } from 'socket.io';
+import { LeaderboardService } from './leaderboard.service';
+import { forwardRef, Inject } from '@nestjs/common';
+
+@WebSocketGateway({
+  cors: {
+    origin: '*',
+  },
+})
+export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
+  @WebSocketServer()
+  server: Server;
+
+  constructor(
+    @Inject(forwardRef(() => LeaderboardService))
+    private readonly leaderboardService: LeaderboardService,
+  ) { }
+
+  async handleConnection(client: Socket) {
+    try {
+      const leaderboard = await this.leaderboardService.getLeaderboard();
+      client.emit('leaderboard.updated', leaderboard.data);
+    } catch (err) {
+      // Fail silently or log error
+    }
+  }
+
+  handleDisconnect(client: Socket) { }
+
+  async broadcastLeaderboard() {
+    if (!this.server) return;
+    try {
+      const leaderboard = await this.leaderboardService.getLeaderboard();
+      this.server.emit('leaderboard.updated', leaderboard.data);
+    } catch (err) {
+      // Fail silently or log error
+    }
+  }
+}
diff --git a/apps/backend/src/leaderboard/leaderboard.module.ts b/apps/backend/src/leaderboard/leaderboard.module.ts
new file mode 100644
index 0000000..61af26b
--- /dev/null
+++ b/apps/backend/src/leaderboard/leaderboard.module.ts
@@ -0,0 +1,13 @@
+import { Module, forwardRef } from '@nestjs/common';
+import { LeaderboardController } from './leaderboard.controller';
+import { LeaderboardService } from './leaderboard.service';
+import { LeaderboardGateway } from './leaderboard.gateway';
+import { DatabaseModule } from '../database/database.module';
+
+@Module({
+  imports: [DatabaseModule],
+  controllers: [LeaderboardController],
+  providers: [LeaderboardService, LeaderboardGateway],
+  exports: [LeaderboardService, LeaderboardGateway],
+})
+export class LeaderboardModule { }
diff --git a/apps/backend/src/leaderboard/leaderboard.service.ts b/apps/backend/src/leaderboard/leaderboard.service.ts
new file mode 100644
index 0000000..0908d51
--- /dev/null
+++ b/apps/backend/src/leaderboard/leaderboard.service.ts
@@ -0,0 +1,130 @@
+import { Injectable, Inject, forwardRef } from '@nestjs/common';
+import { DRIZZLE } from '../database/database.module';
+import { NodePgDatabase } from 'drizzle-orm/node-postgres';
+import * as schema from '../../db/schema';
+import { eq } from 'drizzle-orm';
+import { LeaderboardGateway } from './leaderboard.gateway';
+
+export interface LeaderboardPost {
+  id: string;
+  title: string;
+  content: string;
+  wastedCalories: number;
+  createdAt: Date;
+  updatedAt: Date;
+  author: {
+    id: string;
+    username: string;
+    avatar: string;
+  };
+}
+
+export function calculateScoreHelper(content: string): number {
+  if (!content) return 0;
+  let score = 0;
+
+  // 1. Word Count: +5 per word (whitespace-separated)
+  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
+  score += words.length * 5;
+
+  // 2. Capitalization Scream: if > 30% of alphabetic characters are uppercase, +50
+  const alphabeticChars = content.replace(/[^a-zA-Z]/g, '');
+  if (alphabeticChars.length > 0) {
+    const uppercaseChars = content.replace(/[^A-Z]/g, '');
+    const ratio = uppercaseChars.length / alphabeticChars.length;
+    if (ratio > 0.3) {
+      score += 50;
+    }
+  }
+
+  // 3. Over-engineering Penalty: if contains markdown code blocks (```), +100
+  if (content.includes('```')) {
+    score += 100;
+  }
+
+  // 4. Length Modifier: > 1000 chars +150; < 100 chars -50
+  const len = content.length;
+  if (len > 1000) {
+    score += 150;
+  } else if (len < 100) {
+    score -= 50;
+  }
+
+  // 5. Frustration Punctuation: +5 per occurrence of !, ?, or ... (capped at +50)
+  let frustrationCount = 0;
+
+  // Count ...
+  const dotRegex = /\.\.\./g;
+  const dotsMatch = content.match(dotRegex);
+  if (dotsMatch) {
+    frustrationCount += dotsMatch.length;
+  }
+
+  // Count ! and ?
+  const puncRegex = /[!?]/g;
+  const puncsMatch = content.match(puncRegex);
+  if (puncsMatch) {
+    frustrationCount += puncsMatch.length;
+  }
+
+  score += Math.min(frustrationCount, 10) * 5;
+
+  return score;
+}
+
+@Injectable()
+export class LeaderboardService {
+  constructor(
+    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
+    @Inject(forwardRef(() => LeaderboardGateway))
+    private readonly leaderboardGateway: LeaderboardGateway,
+  ) { }
+
+  async broadcastUpdate(): Promise<void> {
+    if (this.leaderboardGateway && typeof this.leaderboardGateway.broadcastLeaderboard === 'function') {
+      await this.leaderboardGateway.broadcastLeaderboard();
+    }
+  }
+
+  calculateScore(content: string): number {
+    return calculateScoreHelper(content);
+  }
+
+  async getLeaderboard(): Promise<{ success: boolean; data: LeaderboardPost[] }> {
+    const rawPosts = await this.db
+      .select({
+        id: schema.posts.id,
+        title: schema.posts.title,
+        content: schema.posts.content,
+        createdAt: schema.posts.createdAt,
+        updatedAt: schema.posts.updatedAt,
+        author: {
+          id: schema.users.id,
+          username: schema.users.username,
+          avatar: schema.users.avatar,
+        },
+      })
+      .from(schema.posts)
+      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id));
+
+    // Calculate score dynamically to ensure strict correctness
+    const postsWithScores = rawPosts.map((post) => ({
+      ...post,
+      wastedCalories: this.calculateScore(post.content),
+    }));
+
+    // Sort descending by score, and sub-sort by createdAt descending for stability
+    postsWithScores.sort((a, b) => {
+      if (b.wastedCalories !== a.wastedCalories) {
+        return b.wastedCalories - a.wastedCalories;
+      }
+      return b.createdAt.getTime() - a.createdAt.getTime();
+    });
+
+    return {
+      success: true,
+      data: postsWithScores,
+    };
+  }
+}
+
diff --git a/apps/frontend/package.json b/apps/frontend/package.json
index 32f8bf7..1fb3db9 100644
--- a/apps/frontend/package.json
+++ b/apps/frontend/package.json
@@ -12,6 +12,7 @@
     "next": "15.0.0",
     "react": "19.0.0",
     "react-dom": "19.0.0",
+    "socket.io-client": "^4.7.5",
     "zustand": "5.0.13"
   },
   "devDependencies": {
@@ -22,4 +23,4 @@
     "eslint-config-next": "15.0.0",
     "typescript": "^5"
   }
-}
+}
\ No newline at end of file
diff --git a/apps/frontend/src/app/actions/leaderboard.ts b/apps/frontend/src/app/actions/leaderboard.ts
new file mode 100644
index 0000000..cdbc1ae
--- /dev/null
+++ b/apps/frontend/src/app/actions/leaderboard.ts
@@ -0,0 +1,60 @@
+'use server';
+
+export interface LeaderboardPost {
+  id: string;
+  title: string;
+  content: string;
+  wastedCalories: number;
+  createdAt: string;
+  updatedAt: string;
+  author: {
+    id: string;
+    username: string;
+    avatar: string;
+  };
+}
+
+export type ActionResponse<T> = {
+  success: boolean;
+  data?: T;
+  error?: { message: string; code?: string };
+};
+
+const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
+
+export async function actionGetLeaderboard(): Promise<ActionResponse<LeaderboardPost[]>> {
+  try {
+    const res = await fetch(`${BACKEND_URL}/leaderboard`, {
+      method: 'GET',
+      headers: {
+        'Content-Type': 'application/json',
+      },
+      next: { revalidate: 0 }, // Ensure dynamic fetching
+    });
+
+    const data = await res.json();
+
+    if (!res.ok) {
+      return {
+        success: false,
+        error: {
+          message: data.error?.message || 'Failed to contact the leaderboard engine. The server is probably taking an unannounced coffee break.',
+          code: data.error?.code || 'BACKEND_ERROR',
+        },
+      };
+    }
+
+    return {
+      success: true,
+      data: data.data,
+    };
+  } catch (err) {
+    return {
+      success: false,
+      error: {
+        message: 'Failed to contact the leaderboard engine. The server is probably taking a coffee break.',
+        code: 'NETWORK_ERROR',
+      },
+    };
+  }
+}
diff --git a/apps/frontend/src/app/globals.css b/apps/frontend/src/app/globals.css
index 700cb2e..77a5103 100644
--- a/apps/frontend/src/app/globals.css
+++ b/apps/frontend/src/app/globals.css
@@ -9,6 +9,10 @@
   --font-heading: var(--font-outfit), sans-serif;
 }
 
+* {
+  box-sizing: border-box;
+}
+
 body {
   background-color: var(--color-background);
   color: var(--color-text);
@@ -24,4 +28,4 @@ h4,
 h5,
 h6 {
   font-family: var(--font-heading);
-}
+}
\ No newline at end of file
diff --git a/apps/frontend/src/app/page.module.css b/apps/frontend/src/app/page.module.css
new file mode 100644
index 0000000..e5c1a4a
--- /dev/null
+++ b/apps/frontend/src/app/page.module.css
@@ -0,0 +1,152 @@
+.pageWrapper {
+  min-height: 100vh;
+  background-color: #f8fafc;
+  color: #0f172a;
+  display: flex;
+  flex-direction: column;
+}
+
+.header {
+  background: #ffffff;
+  border-bottom: 1px solid #e2e8f0;
+  padding: 1.25rem 2rem;
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  position: sticky;
+  top: 0;
+  z-index: 10;
+  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
+}
+
+.logoArea {
+  display: flex;
+  align-items: center;
+  gap: 0.75rem;
+  text-decoration: none;
+}
+
+.logoIcon {
+  font-size: 1.75rem;
+}
+
+.logoText {
+  font-family: var(--font-heading);
+  font-size: 1.5rem;
+  font-weight: 800;
+  background: linear-gradient(135deg, hsl(220, 90%, 50%) 0%, #1e40af 100%);
+  -webkit-background-clip: text;
+  -webkit-text-fill-color: transparent;
+  letter-spacing: -0.03em;
+}
+
+.navArea {
+  display: flex;
+  align-items: center;
+  gap: 1rem;
+}
+
+.navButton {
+  font-family: var(--font-heading);
+  font-size: 0.9rem;
+  font-weight: 700;
+  padding: 0.6rem 1.2rem;
+  border-radius: 10px;
+  cursor: pointer;
+  transition: all 0.2s ease;
+  text-decoration: none;
+}
+
+.primaryBtn {
+  background: hsl(220, 90%, 50%);
+  color: #ffffff;
+  border: none;
+  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
+}
+
+.primaryBtn:hover {
+  background: #1d4ed8;
+  transform: translateY(-1px);
+}
+
+.secondaryBtn {
+  background: #f1f5f9;
+  color: #334155;
+  border: 1px solid #cbd5e1;
+}
+
+.secondaryBtn:hover {
+  background: #e2e8f0;
+}
+
+.mainContent {
+  flex: 1;
+  max-width: 1200px;
+  width: 100%;
+  margin: 0 auto;
+  padding: 3rem 2rem;
+  display: flex;
+  flex-direction: column;
+  gap: 2rem;
+}
+
+.heroSection {
+  text-align: center;
+  max-width: 800px;
+  margin: 0 auto 1.5rem auto;
+  display: flex;
+  flex-direction: column;
+  gap: 0.75rem;
+}
+
+.heroTitle {
+  font-size: 2.5rem;
+  font-weight: 800;
+  letter-spacing: -0.04em;
+  color: #0f172a;
+  margin: 0;
+}
+
+.heroSubtitle {
+  font-size: 1.1rem;
+  color: #475569;
+  line-height: 1.6;
+  margin: 0;
+}
+
+.footer {
+  background: #ffffff;
+  border-top: 1px solid #e2e8f0;
+  padding: 2rem;
+  text-align: center;
+  font-size: 0.85rem;
+  color: #64748b;
+}
+
+.footerLink {
+  color: hsl(220, 90%, 50%);
+  text-decoration: none;
+  font-weight: 600;
+}
+
+.footerLink:hover {
+  text-decoration: underline;
+}
+
+@media (max-width: 640px) {
+  .header {
+    padding: 1rem;
+  }
+
+  .logoText {
+    font-size: 1.25rem;
+  }
+
+  .mainContent {
+    padding: 2rem 1rem;
+  }
+
+  .heroTitle {
+    font-size: 2rem;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/app/page.tsx b/apps/frontend/src/app/page.tsx
index 7e03a4e..78f83eb 100644
--- a/apps/frontend/src/app/page.tsx
+++ b/apps/frontend/src/app/page.tsx
@@ -1,7 +1,71 @@
-export default function Home() {
+'use client';
+
+import React, { useEffect, useTransition } from 'react';
+import Link from 'next/link';
+import LeaderboardGrid from '../domains/leaderboard/components/LeaderboardGrid';
+import { useAuthStore } from '../core/store/useAuthStore';
+import { actionGetMe } from './actions/auth';
+import styles from './page.module.css';
+
+export default function HomePage() {
+  const user = useAuthStore((state) => state.user);
+  const setUser = useAuthStore((state) => state.setUser);
+  const [, startTransition] = useTransition();
+
+  useEffect(() => {
+    // Check session on mount to see if user is authenticated
+    startTransition(async () => {
+      const response = await actionGetMe();
+      if (response.success && response.data) {
+        setUser(response.data);
+      } else {
+        setUser(null);
+      }
+    });
+  }, [setUser]);
+
   return (
-    <main>
-      <h1>Reverse Startup Leaderboard</h1>
-    </main>
+    <div className={styles.pageWrapper}>
+      <header className={styles.header}>
+        <Link href="/" className={styles.logoArea}>
+          <span className={styles.logoIcon}>📉</span>
+          <span className={styles.logoText}>Reverse Startup</span>
+        </Link>
+        <nav className={styles.navArea}>
+          {user ? (
+            <Link href="/profile" className={`${styles.navButton} ${styles.secondaryBtn}`}>
+              👤 {user.username}
+            </Link>
+          ) : (
+            <Link href="/auth" className={`${styles.navButton} ${styles.primaryBtn}`}>
+              Sign In
+            </Link>
+          )}
+        </nav>
+      </header>
+
+      <main className={styles.mainContent}>
+        <section className={styles.heroSection}>
+          <h1 className={styles.heroTitle}>The Hall of Inefficiency</h1>
+          <p className={styles.heroSubtitle}>
+            Where the most convoluted tech stacks, pre-revenue pivots, and overengineered pipelines are proudly celebrated. Real-time broadcast straight from the developers who refuse to ship.
+          </p>
+        </section>
+
+        <section className={styles.leaderboardSection}>
+          <LeaderboardGrid />
+        </section>
+      </main>
+
+      <footer className={styles.footer}>
+        <p>
+          Built for teams who measure progress in lines of code deleted. View the{' '}
+          <Link href="/profile" className={styles.footerLink}>
+            Dashboard
+          </Link>
+          .
+        </p>
+      </footer>
+    </div>
   );
 }
diff --git a/apps/frontend/src/core/api/socket.client.ts b/apps/frontend/src/core/api/socket.client.ts
new file mode 100644
index 0000000..d1bdc51
--- /dev/null
+++ b/apps/frontend/src/core/api/socket.client.ts
@@ -0,0 +1,13 @@
+import { io, Socket } from 'socket.io-client';
+
+const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
+
+let socket: Socket | null = null;
+
+if (typeof window !== 'undefined') {
+  socket = io(BACKEND_URL, {
+    autoConnect: true,
+  });
+}
+
+export { socket };
diff --git a/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.module.css b/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.module.css
new file mode 100644
index 0000000..3c1f38b
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.module.css
@@ -0,0 +1,41 @@
+.badge {
+  display: inline-flex;
+  align-items: center;
+  gap: 0.35rem;
+  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
+  border: 1px solid #f59e0b;
+  color: #b45309;
+  font-family: var(--font-heading);
+  font-size: 0.75rem;
+  font-weight: 700;
+  text-transform: uppercase;
+  letter-spacing: 0.05em;
+  padding: 0.25rem 0.65rem;
+  border-radius: 9999px;
+  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15);
+  animation: shine 2s infinite ease-in-out;
+}
+
+.icon {
+  font-size: 0.9rem;
+}
+
+@keyframes shine {
+
+  0%,
+  100% {
+    filter: brightness(1);
+    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15);
+  }
+
+  50% {
+    filter: brightness(1.15);
+    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+  .badge {
+    animation: none;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.tsx b/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.tsx
new file mode 100644
index 0000000..3cb9024
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/GoldenRaspberryBadge.tsx
@@ -0,0 +1,11 @@
+import React from 'react';
+import styles from './GoldenRaspberryBadge.module.css';
+
+export default function GoldenRaspberryBadge() {
+  return (
+    <span className={styles.badge} aria-label="Golden Raspberry Badge">
+      <span className={styles.icon}>🏆</span>
+      <span className={styles.label}>Golden Raspberry</span>
+    </span>
+  );
+}
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
new file mode 100644
index 0000000..108f720
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
@@ -0,0 +1,233 @@
+.loadingContainer,
+.errorContainer,
+.emptyContainer {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  justify-content: center;
+  padding: 4rem 2rem;
+  background: #ffffff;
+  border: 1px solid #e2e8f0;
+  border-radius: 16px;
+  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
+  font-family: var(--font-body);
+  color: #64748b;
+  text-align: center;
+}
+
+.spinner {
+  width: 40px;
+  height: 40px;
+  border: 3px solid #f1f5f9;
+  border-top: 3px solid hsl(220, 90%, 50%);
+  border-radius: 50%;
+  animation: spin 1s linear infinite;
+  margin-bottom: 1rem;
+}
+
+@keyframes spin {
+  0% {
+    transform: rotate(0deg);
+  }
+
+  100% {
+    transform: rotate(360deg);
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+  .spinner {
+    animation: spin 3s linear infinite;
+  }
+}
+
+.errorContainer {
+  border-color: #fca5a5;
+  color: #ef4444;
+  background: #fef2f2;
+}
+
+.gridContainer {
+  width: 100%;
+  background: #ffffff;
+  border: 1px solid #e2e8f0;
+  border-radius: 20px;
+  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
+  overflow: hidden;
+  font-family: var(--font-body);
+}
+
+.headerRow {
+  display: grid;
+  grid-template-columns: 80px 180px 1fr 180px;
+  background: #f8fafc;
+  border-bottom: 1px solid #e2e8f0;
+  padding: 1.25rem 2rem;
+  font-family: var(--font-heading);
+  font-size: 0.85rem;
+  font-weight: 700;
+  color: #475569;
+  text-transform: uppercase;
+  letter-spacing: 0.05em;
+}
+
+.postsList {
+  display: flex;
+  flex-direction: column;
+}
+
+.postRow {
+  display: grid;
+  grid-template-columns: 80px 180px 1fr 180px;
+  border-bottom: 1px solid #f1f5f9;
+  padding: 1.5rem 2rem;
+  align-items: center;
+  transition: background-color 0.2s ease, transform 0.2s ease;
+  background: #ffffff;
+}
+
+.postRow:last-child {
+  border-bottom: none;
+}
+
+.postRow:hover {
+  background-color: #f8fafc;
+}
+
+.firstPlace {
+  background-color: #fffbeb;
+}
+
+.firstPlace:hover {
+  background-color: #fef3c7;
+}
+
+.colRank {
+  display: flex;
+  align-items: center;
+}
+
+.rankBadge {
+  display: inline-flex;
+  align-items: center;
+  justify-content: center;
+  width: 32px;
+  height: 32px;
+  background: #f1f5f9;
+  color: #475569;
+  font-weight: 700;
+  border-radius: 50%;
+  font-size: 0.9rem;
+}
+
+.firstPlace .rankBadge {
+  background: #f59e0b;
+  color: #ffffff;
+  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
+}
+
+.colAuthor {
+  display: flex;
+  align-items: center;
+  gap: 0.75rem;
+}
+
+.authorAvatar {
+  font-size: 1.5rem;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  width: 36px;
+  height: 36px;
+  background: #f8fafc;
+  border: 1px solid #e2e8f0;
+  border-radius: 50%;
+}
+
+.authorName {
+  font-weight: 600;
+  color: #0f172a;
+  font-size: 0.95rem;
+}
+
+.colTitle {
+  display: flex;
+  flex-direction: column;
+  gap: 0.25rem;
+  padding-right: 2rem;
+}
+
+.postTitleText {
+  font-family: var(--font-heading);
+  font-weight: 700;
+  color: #0f172a;
+  font-size: 1.1rem;
+}
+
+.postSnippet {
+  color: #475569;
+  font-size: 0.9rem;
+  margin: 0;
+  line-height: 1.5;
+  white-space: pre-wrap;
+}
+
+.colScore {
+  display: flex;
+  align-items: center;
+}
+
+.scoreContainer {
+  display: flex;
+  flex-direction: column;
+  gap: 0.5rem;
+}
+
+.scoreValue {
+  font-family: var(--font-heading);
+  font-size: 1.25rem;
+  font-weight: 800;
+  color: hsl(220, 90%, 50%);
+}
+
+.badgeWrapper {
+  display: flex;
+}
+
+@media (max-width: 768px) {
+  .headerRow {
+    display: none;
+  }
+
+  .postRow {
+    grid-template-columns: 1fr;
+    gap: 1rem;
+    padding: 1.5rem;
+  }
+
+  .colRank,
+  .colAuthor,
+  .colTitle,
+  .colScore {
+    width: 100%;
+  }
+
+  .colRank {
+    font-size: 0.85rem;
+    color: #64748b;
+  }
+
+  .colRank::before {
+    content: "Rank ";
+    font-weight: 600;
+  }
+
+  .colScore {
+    border-top: 1px dashed #e2e8f0;
+    padding-top: 0.75rem;
+  }
+
+  .firstPlace .colScore {
+    border-top-color: #fcd34d;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
new file mode 100644
index 0000000..890d1e8
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
@@ -0,0 +1,115 @@
+'use client';
+
+import React, { useState, useEffect, useTransition } from 'react';
+import { actionGetLeaderboard, LeaderboardPost } from '../../../app/actions/leaderboard';
+import { socket } from '../../../core/api/socket.client';
+import GoldenRaspberryBadge from './GoldenRaspberryBadge';
+import styles from './LeaderboardGrid.module.css';
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
+export default function LeaderboardGrid() {
+  const [posts, setPosts] = useState<LeaderboardPost[]>([]);
+  const [error, setError] = useState<string | null>(null);
+  const [isPending, startTransition] = useTransition();
+
+  useEffect(() => {
+    // 1. Fetch initial leaderboard data
+    startTransition(async () => {
+      const response = await actionGetLeaderboard();
+      if (response.success && response.data) {
+        setPosts(response.data);
+      } else {
+        setError(response.error?.message || 'Failed to fetch leaderboard data.');
+      }
+    });
+
+    // 2. Subscribe to real-time WebSocket updates
+    if (socket) {
+      const handleLeaderboardUpdate = (updatedPosts: LeaderboardPost[]) => {
+        setPosts(updatedPosts);
+      };
+
+      socket.on('leaderboard.updated', handleLeaderboardUpdate);
+
+      return () => {
+        socket?.off('leaderboard.updated', handleLeaderboardUpdate);
+      };
+    }
+  }, []);
+
+  if (isPending && posts.length === 0) {
+    return (
+      <div className={styles.loadingContainer}>
+        <div className={styles.spinner} role="status"></div>
+        <p>Retrieving high-scoring wastefulness...</p>
+      </div>
+    );
+  }
+
+  if (error && posts.length === 0) {
+    return (
+      <div className={styles.errorContainer} role="alert">
+        <p>{error}</p>
+      </div>
+    );
+  }
+
+  if (posts.length === 0) {
+    return (
+      <div className={styles.emptyContainer}>
+        <p>No wasted calories yet. Someone needs to write some terrible code, quickly!</p>
+      </div>
+    );
+  }
+
+  return (
+    <div className={styles.gridContainer}>
+      <div className={styles.headerRow}>
+        <div className={styles.colRank}>Rank</div>
+        <div className={styles.colAuthor}>Innovator</div>
+        <div className={styles.colTitle}>Idea</div>
+        <div className={styles.colScore}>Wasted Calories</div>
+      </div>
+      <div className={styles.postsList}>
+        {posts.map((post, index) => {
+          const isFirst = index === 0;
+          return (
+            <div key={post.id} className={`${styles.postRow} ${isFirst ? styles.firstPlace : ''}`}>
+              <div className={styles.colRank}>
+                <span className={styles.rankBadge}>{index + 1}</span>
+              </div>
+              <div className={styles.colAuthor}>
+                <span className={styles.authorAvatar} role="img" aria-label={post.author.avatar}>
+                  {AVATAR_MAP[post.author.avatar] || '👤'}
+                </span>
+                <span className={styles.authorName}>{post.author.username}</span>
+              </div>
+              <div className={styles.colTitle}>
+                <div className={styles.postTitleText}>{post.title}</div>
+                <p className={styles.postSnippet}>{post.content}</p>
+              </div>
+              <div className={styles.colScore}>
+                <div className={styles.scoreContainer}>
+                  <span className={styles.scoreValue}>{post.wastedCalories} kcal</span>
+                  {isFirst && (
+                    <div className={styles.badgeWrapper}>
+                      <GoldenRaspberryBadge />
+                    </div>
+                  )}
+                </div>
+              </div>
+            </div>
+          );
+        })}
+      </div>
+    </div>
+  );
+}
diff --git a/tests/e2e/leaderboard.spec.ts b/tests/e2e/leaderboard.spec.ts
new file mode 100644
index 0000000..04cb70d
--- /dev/null
+++ b/tests/e2e/leaderboard.spec.ts
@@ -0,0 +1,30 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Real-time Leaderboard & Badges E2E Flow', () => {
+  test('should display leaderboard header, grid columns, and first-place badge', async ({ page }) => {
+    // 1. Visit the home page
+    await page.goto('/');
+
+    // 2. Verify logo and hero section
+    await expect(page.locator('text=Reverse Startup')).toBeVisible();
+    await expect(page.locator('h1')).toHaveText('The Hall of Inefficiency');
+
+    // 3. Verify leaderboard grid headers
+    await expect(page.locator('text=Rank').first()).toBeVisible();
+    await expect(page.locator('text=Innovator').first()).toBeVisible();
+    await expect(page.locator('text=Idea').first()).toBeVisible();
+    await expect(page.locator('text=Wasted Calories').first()).toBeVisible();
+
+    // 4. Verify that the first-place item displays the Golden Raspberry badge
+    const firstPlaceRow = page.locator('div[class*="firstPlace"]');
+    await expect(firstPlaceRow).toBeVisible();
+    await expect(firstPlaceRow.locator('text=Golden Raspberry')).toBeVisible();
+
+    // Check that we display the author name and score correctly
+    const authorName = firstPlaceRow.locator('span[class*="authorName"]');
+    await expect(authorName).toBeVisible();
+
+    const scoreVal = firstPlaceRow.locator('span[class*="scoreValue"]');
+    await expect(scoreVal).toBeVisible();
+  });
+});
diff --git a/tests/unit/backend/leaderboard/leaderboard.gateway.spec.ts b/tests/unit/backend/leaderboard/leaderboard.gateway.spec.ts
new file mode 100644
index 0000000..fe12001
--- /dev/null
+++ b/tests/unit/backend/leaderboard/leaderboard.gateway.spec.ts
@@ -0,0 +1,72 @@
+import { Test, TestingModule } from '@nestjs/testing';
+import { LeaderboardGateway } from '../../../../apps/backend/src/leaderboard/leaderboard.gateway';
+import { LeaderboardService } from '../../../../apps/backend/src/leaderboard/leaderboard.service';
+
+describe('LeaderboardGateway', () => {
+  let gateway: LeaderboardGateway;
+  let serviceMock: any;
+  let clientMock: any;
+  let serverMock: any;
+
+  beforeEach(async () => {
+    serviceMock = {
+      getLeaderboard: jest.fn().mockResolvedValue({
+        success: true,
+        data: [
+          {
+            id: 'post-1',
+            title: 'Post 1',
+            content: 'Standard content',
+            wastedCalories: 100,
+            createdAt: new Date(),
+            updatedAt: new Date(),
+            author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
+          },
+        ],
+      }),
+    };
+
+    clientMock = {
+      emit: jest.fn(),
+    };
+
+    serverMock = {
+      emit: jest.fn(),
+    };
+
+    const module: TestingModule = await Test.createTestingModule({
+      providers: [
+        LeaderboardGateway,
+        {
+          provide: LeaderboardService,
+          useValue: serviceMock,
+        },
+      ],
+    }).compile();
+
+    gateway = module.get<LeaderboardGateway>(LeaderboardGateway);
+    gateway.server = serverMock;
+  });
+
+  it('should be defined', () => {
+    expect(gateway).toBeDefined();
+  });
+
+  describe('handleConnection', () => {
+    it('should fetch leaderboard and emit updated data to the connecting client', async () => {
+      await gateway.handleConnection(clientMock);
+
+      expect(serviceMock.getLeaderboard).toHaveBeenCalled();
+      expect(clientMock.emit).toHaveBeenCalledWith('leaderboard.updated', expect.any(Array));
+    });
+  });
+
+  describe('broadcastLeaderboard', () => {
+    it('should fetch leaderboard and emit updated data to all connected clients', async () => {
+      await gateway.broadcastLeaderboard();
+
+      expect(serviceMock.getLeaderboard).toHaveBeenCalled();
+      expect(serverMock.emit).toHaveBeenCalledWith('leaderboard.updated', expect.any(Array));
+    });
+  });
+});
diff --git a/tests/unit/backend/leaderboard/leaderboard.service.spec.ts b/tests/unit/backend/leaderboard/leaderboard.service.spec.ts
new file mode 100644
index 0000000..5efbc9b
--- /dev/null
+++ b/tests/unit/backend/leaderboard/leaderboard.service.spec.ts
@@ -0,0 +1,204 @@
+import { Test, TestingModule } from '@nestjs/testing';
+import { LeaderboardService } from '../../../../apps/backend/src/leaderboard/leaderboard.service';
+import { DRIZZLE } from '../../../../apps/backend/src/database/database.module';
+import { LeaderboardGateway } from '../../../../apps/backend/src/leaderboard/leaderboard.gateway';
+
+describe('LeaderboardService', () => {
+  let service: LeaderboardService;
+  let dbMock: any;
+  let gatewayMock: any;
+
+  beforeEach(async () => {
+    dbMock = {
+      select: jest.fn().mockReturnThis(),
+      from: jest.fn().mockReturnThis(),
+      innerJoin: jest.fn(),
+    };
+
+    gatewayMock = {
+      broadcastLeaderboard: jest.fn(),
+    };
+
+    const module: TestingModule = await Test.createTestingModule({
+      providers: [
+        LeaderboardService,
+        {
+          provide: DRIZZLE,
+          useValue: dbMock,
+        },
+        {
+          provide: LeaderboardGateway,
+          useValue: gatewayMock,
+        },
+      ],
+    }).compile();
+
+    service = module.get<LeaderboardService>(LeaderboardService);
+  });
+
+  describe('calculateScore', () => {
+    it('should calculate score for a standard post (word count only)', () => {
+      // 20 words, length = 125 (no modifier), no scream, no code, no punctuation
+      const content = 'This is a standard text post with exactly twenty words. We are writing normal sentences without any special characters here.';
+      const score = service.calculateScore(content);
+      // 20 * 5 = 100
+      expect(score).toBe(100);
+    });
+
+    it('should apply word count and less than 100 characters modifier (-50)', () => {
+      // 2 words, length = 12 (< 100 => -50)
+      const content = 'Hello world.';
+      const score = service.calculateScore(content);
+      // 2 * 5 - 50 = -40
+      expect(score).toBe(-40);
+    });
+
+    it('should apply word count and greater than 1000 characters modifier (+150)', () => {
+      // Create a string with length > 1000 containing 210 words
+      const word = 'word ';
+      const content = word.repeat(210); // 210 words, length = 1050
+      const score = service.calculateScore(content);
+      // 210 * 5 + 150 = 1050 + 150 = 1200
+      expect(score).toBe(1200);
+    });
+
+    it('should apply capitalization scream penalty (+50)', () => {
+      // 10 words, length = 60 (< 100 => -50), > 30% uppercase (100% here)
+      const content = 'THIS IS A SCREAMING MESSAGE FOR ALL TEAM MEMBERS TO READ.';
+      const score = service.calculateScore(content);
+      // 11 words: 'THIS', 'IS', 'A', 'SCREAMING', 'MESSAGE', 'FOR', 'ALL', 'TEAM', 'MEMBERS', 'TO', 'READ.'
+      // 11 * 5 - 50 + 50 (scream) = 55
+      expect(score).toBe(55);
+    });
+
+    it('should not apply capitalization scream penalty if <= 30% uppercase', () => {
+      // 10 words, length = 54 (< 100 => -50), few uppercase chars (only 2 out of ~45 => < 30%)
+      const content = 'This is a normal message for all team members to read.';
+      const score = service.calculateScore(content);
+      // 11 words * 5 = 55
+      // 55 - 50 = 5
+      expect(score).toBe(5);
+    });
+
+    it('should apply over-engineering code block penalty (+100)', () => {
+      const content = 'Check out our clean architecture: \n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean, scalable, and beautifully designed for enterprise use.';
+      const score = service.calculateScore(content);
+      // Length: 180 (no modifier)
+      // Words count: 29 words
+      // Score: 29 * 5 + 100 (code) = 245
+      expect(score).toBe(245);
+    });
+
+    it('should apply frustration punctuation points (+5 per occurrence, capped at +50)', () => {
+      const content = 'Why did the server crash?! Oh no! We need to check the logs... asap. Please help us fix this now because we are running out of time!';
+      const score = service.calculateScore(content);
+      // Punctuation: ?, !, !, ..., ! = 5 occurrences => +25
+      // Words: 27
+      // 27 * 5 + 25 = 160
+      expect(score).toBe(160);
+    });
+
+    it('should cap frustration punctuation points at +50', () => {
+      const content = 'FAIL!!! WHY?! OH?! NO!!! CODE!!! HELP!!! NEED BACKUP!!! NOW!!! WE ARE DOOMED!!!';
+      const score = service.calculateScore(content);
+      // Length: 81 (< 100 => -50)
+      // Scream: 100% scream => +50
+      // Punctuation: > 10 => +50
+      // Words: 12
+      // 12 * 5 - 50 + 50 + 50 = 110
+      expect(score).toBe(110);
+    });
+
+    it('should return 0 when content is empty, null, or undefined', () => {
+      expect(service.calculateScore('')).toBe(0);
+      expect(service.calculateScore(null as any)).toBe(0);
+      expect(service.calculateScore(undefined as any)).toBe(0);
+    });
+  });
+
+  describe('getLeaderboard', () => {
+    it('should return posts sorted descending by calculated score', async () => {
+      // Mock DB returning 3 raw posts
+      const mockRawPosts = [
+        {
+          id: 'post-1',
+          title: 'Post 1',
+          content: 'Hello world.', // score: 2 * 5 - 50 = -40
+          createdAt: new Date(),
+          updatedAt: new Date(),
+          author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
+        },
+        {
+          id: 'post-2',
+          title: 'Post 2',
+          content: 'Check out our clean architecture: \n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean, scalable, and beautifully designed for enterprise use.', // score: 245
+          createdAt: new Date(),
+          updatedAt: new Date(),
+          author: { id: 'user-2', username: 'bob', avatar: 'avatar2' },
+        },
+        {
+          id: 'post-3',
+          title: 'Post 3',
+          content: 'THIS IS A SCREAMING MESSAGE FOR ALL TEAM MEMBERS TO READ.', // score: 55
+          createdAt: new Date(),
+          updatedAt: new Date(),
+          author: { id: 'user-3', username: 'charlie', avatar: 'avatar3' },
+        },
+      ];
+
+      dbMock.innerJoin.mockResolvedValue(mockRawPosts);
+
+      const result = await service.getLeaderboard();
+
+      expect(dbMock.select).toHaveBeenCalled();
+      expect(dbMock.from).toHaveBeenCalled();
+      expect(dbMock.innerJoin).toHaveBeenCalled();
+
+      expect(result.success).toBe(true);
+      expect(result.data).toHaveLength(3);
+
+      // Should be sorted: Post 2 (245) -> Post 3 (55) -> Post 1 (-40)
+      expect(result.data[0].id).toBe('post-2');
+      expect(result.data[0].wastedCalories).toBe(245);
+
+      expect(result.data[1].id).toBe('post-3');
+      expect(result.data[1].wastedCalories).toBe(55);
+
+      expect(result.data[2].id).toBe('post-1');
+      expect(result.data[2].wastedCalories).toBe(-40);
+    });
+
+    it('should fall back to stable sorting on createdAt descending when score is equal', async () => {
+      const now = new Date();
+      const mockRawPosts = [
+        {
+          id: 'post-older',
+          title: 'Older Post',
+          content: 'Hello world.', // score: -40
+          createdAt: new Date(now.getTime() - 10000), // Older
+          updatedAt: new Date(),
+          author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
+        },
+        {
+          id: 'post-newer',
+          title: 'Newer Post',
+          content: 'Hello world.', // score: -40
+          createdAt: now, // Newer
+          updatedAt: new Date(),
+          author: { id: 'user-2', username: 'bob', avatar: 'avatar2' },
+        },
+      ];
+
+      dbMock.innerJoin.mockResolvedValue(mockRawPosts);
+
+      const result = await service.getLeaderboard();
+
+      expect(result.success).toBe(true);
+      expect(result.data).toHaveLength(2);
+
+      // Newer post should come first (stable sub-sort)
+      expect(result.data[0].id).toBe('post-newer');
+      expect(result.data[1].id).toBe('post-older');
+    });
+  });
+});

```
