# Edge Case Hunter Prompt

Please paste the following instructions and diff into a new session (ideally using a different LLM model) to perform the Edge Case Hunter review.

---

## System / Role Instructions

You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling.
Scan only the diff hunks below and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.
Ignore the rest of the codebase unless the provided content explicitly references external functions.

Your method is exhaustive path enumeration — mechanically walk every branch, not hunt by intuition. Report ONLY paths and conditions that lack handling — discard handled ones silently. Do NOT editorialize or add filler — findings only.

Output findings strictly as a JSON array of objects. Each object must contain exactly these four fields and nothing else:

```json
[{
  "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```

No extra text, no explanations, no markdown wrapping. An empty array `[]` is valid when no unhandled paths are found.

---

## Diff Content to Review

```diff
diff --git a/apps/backend/db/schema.ts b/apps/backend/db/schema.ts
index a967820..07355fb 100644
--- a/apps/backend/db/schema.ts
+++ b/apps/backend/db/schema.ts
@@ -1,4 +1,4 @@
-import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
+import { pgTable, uuid, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
 import { relations } from "drizzle-orm";
 
 export const users = pgTable("users", {
@@ -8,6 +8,8 @@ export const users = pgTable("users", {
   avatar: text("avatar").default("default_avatar"),
   wastedCalories: integer("wasted_calories").default(0).notNull(),
   logicViolations: integer("logic_violations").default(0).notNull(),
+  mercyFailures: integer("mercy_failures").default(0).notNull(),
+  isMercyActive: boolean("is_mercy_active").default(false).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
 });
diff --git a/apps/backend/drizzle/0002_typical_sebastian_shaw.sql b/apps/backend/drizzle/0002_typical_sebastian_shaw.sql
new file mode 100644
index 0000000..2637d0e
--- /dev/null
+++ b/apps/backend/drizzle/0002_typical_sebastian_shaw.sql
@@ -0,0 +1,14 @@
+CREATE TABLE "comments" (
+	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
+	"post_id" uuid NOT NULL,
+	"content" text NOT NULL,
+	"wasted_calories" integer DEFAULT 0 NOT NULL,
+	"author_id" uuid NOT NULL,
+	"created_at" timestamp DEFAULT now() NOT NULL,
+	"updated_at" timestamp DEFAULT now() NOT NULL
+);
+--> statement-breakpoint
+ALTER TABLE "users" ADD COLUMN "mercy_failures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
+ALTER TABLE "users" ADD COLUMN "is_mercy_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
+ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
\ No newline at end of file
diff --git a/apps/backend/drizzle/meta/0002_snapshot.json b/apps/backend/drizzle/meta/0002_snapshot.json
new file mode 100644
index 0000000..8ba2d0a
--- /dev/null
+++ b/apps/backend/drizzle/meta/0002_snapshot.json
@@ -0,0 +1,267 @@
+{
+  "id": "c8961ccb-7ced-48fb-942e-4e74c8819140",
+  "prevId": "ff6eb2d0-a5cf-47a4-805d-be77c4a5f3aa",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.comments": {
+      "name": "comments",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "post_id": {
+          "name": "post_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "content": {
+          "name": "content",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "wasted_calories": {
+          "name": "wasted_calories",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "author_id": {
+          "name": "author_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "comments_post_id_posts_id_fk": {
+          "name": "comments_post_id_posts_id_fk",
+          "tableFrom": "comments",
+          "tableTo": "posts",
+          "columnsFrom": [
+            "post_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "comments_author_id_users_id_fk": {
+          "name": "comments_author_id_users_id_fk",
+          "tableFrom": "comments",
+          "tableTo": "users",
+          "columnsFrom": [
+            "author_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.posts": {
+      "name": "posts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "title": {
+          "name": "title",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "content": {
+          "name": "content",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "wasted_calories": {
+          "name": "wasted_calories",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "author_id": {
+          "name": "author_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "posts_author_id_users_id_fk": {
+          "name": "posts_author_id_users_id_fk",
+          "tableFrom": "posts",
+          "tableTo": "users",
+          "columnsFrom": [
+            "author_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.users": {
+      "name": "users",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "username": {
+          "name": "username",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "password_hash": {
+          "name": "password_hash",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "avatar": {
+          "name": "avatar",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false,
+          "default": "'default_avatar'"
+        },
+        "wasted_calories": {
+          "name": "wasted_calories",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "logic_violations": {
+          "name": "logic_violations",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "mercy_failures": {
+          "name": "mercy_failures",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "is_mercy_active": {
+          "name": "is_mercy_active",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "users_username_unique": {
+          "name": "users_username_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "username"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "views": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/apps/backend/drizzle/meta/_journal.json b/apps/backend/drizzle/meta/_journal.json
index 47cb0d7..543b222 100644
--- a/apps/backend/drizzle/meta/_journal.json
+++ b/apps/backend/drizzle/meta/_journal.json
@@ -15,6 +15,13 @@
       "when": 1779290076023,
       "tag": "0001_hard_boomerang",
       "breakpoints": true
+    },
+    {
+      "idx": 2,
+      "version": "7",
+      "when": 1779358042534,
+      "tag": "0002_typical_sebastian_shaw",
+      "breakpoints": true
     }
   ]
 }
\ No newline at end of file
diff --git a/apps/backend/src/auth/auth.controller.ts b/apps/backend/src/auth/auth.controller.ts
index 59779d0..e2eaf14 100644
--- a/apps/backend/src/auth/auth.controller.ts
+++ b/apps/backend/src/auth/auth.controller.ts
@@ -4,7 +4,7 @@ import { JwtAuthGuard } from './jwt-auth.guard';
 
 @Controller('auth')
 export class AuthController {
-  constructor(private readonly authService: AuthService) {}
+  constructor(private readonly authService: AuthService) { }
 
   @Post('register')
   async register(@Body() body: { username?: string; password?: string }) {
@@ -27,4 +27,14 @@ export class AuthController {
   async updateProfile(@Request() req: any, @Body() body: { username?: string; avatar?: string }) {
     return this.authService.updateProfile(req.user.sub, body.username ?? '', body.avatar ?? '');
   }
+
+  @UseGuards(JwtAuthGuard)
+  @Put('mercy')
+  async updateMercy(@Request() req: any, @Body() body: { failures?: number; isMercyActive?: boolean }) {
+    return this.authService.updateMercy(
+      req.user.sub,
+      body.failures ?? 0,
+      body.isMercyActive ?? false
+    );
+  }
 }
diff --git a/apps/backend/src/auth/auth.service.ts b/apps/backend/src/auth/auth.service.ts
index c5f587a..f92833b 100644
--- a/apps/backend/src/auth/auth.service.ts
+++ b/apps/backend/src/auth/auth.service.ts
@@ -11,7 +11,7 @@ export class AuthService {
   constructor(
     @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
     private readonly jwtService: JwtService,
-  ) {}
+  ) { }
 
   async register(username: string, passwordHashRaw: string) {
     if (!username || !passwordHashRaw) {
@@ -159,4 +159,24 @@ export class AuthService {
       throw err;
     }
   }
+
+  async updateMercy(userId: string, mercyFailures: number, isMercyActive: boolean) {
+    try {
+      const [updatedUser] = await this.db.update(schema.users)
+        .set({ mercyFailures, isMercyActive, updatedAt: new Date() })
+        .where(eq(schema.users.id, userId))
+        .returning();
+
+      const { passwordHash: _, ...profile } = updatedUser;
+      return {
+        success: true,
+        data: profile
+      };
+    } catch (err: any) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: err.message || 'Failed to update mercy state.' }
+      });
+    }
+  }
 }
diff --git a/apps/backend/src/leaderboard/leaderboard.service.ts b/apps/backend/src/leaderboard/leaderboard.service.ts
index f5e3432..f86de51 100644
--- a/apps/backend/src/leaderboard/leaderboard.service.ts
+++ b/apps/backend/src/leaderboard/leaderboard.service.ts
@@ -16,6 +16,7 @@ export interface LeaderboardPost {
     id: string;
     username: string;
     avatar: string;
+    isMercyActive: boolean;
   };
 }
 
@@ -96,12 +97,14 @@ export class LeaderboardService {
         id: schema.posts.id,
         title: schema.posts.title,
         content: schema.posts.content,
+        wastedCalories: schema.posts.wastedCalories,
         createdAt: schema.posts.createdAt,
         updatedAt: schema.posts.updatedAt,
         author: {
           id: schema.users.id,
           username: schema.users.username,
           avatar: schema.users.avatar,
+          isMercyActive: schema.users.isMercyActive,
         },
       })
       .from(schema.posts)
@@ -122,6 +125,7 @@ export class LeaderboardService {
             id: schema.users.id,
             username: schema.users.username,
             avatar: schema.users.avatar,
+            isMercyActive: schema.users.isMercyActive,
           },
         })
         .from(schema.comments)
@@ -156,7 +160,7 @@ export class LeaderboardService {
 
       return {
         ...post,
-        wastedCalories: this.calculateScore(post.content),
+        wastedCalories: post.wastedCalories,
         comments: commentsForPost,
       };
     });
diff --git a/apps/backend/src/posts/posts.controller.ts b/apps/backend/src/posts/posts.controller.ts
index 57f5ca9..3e22f16 100644
--- a/apps/backend/src/posts/posts.controller.ts
+++ b/apps/backend/src/posts/posts.controller.ts
@@ -33,4 +33,25 @@ export class PostsController {
     }
     return this.postsService.createComment(req.user.sub, postId, body.content);
   }
+
+  @UseGuards(JwtAuthGuard)
+  @Post('vote')
+  async vote(
+    @Request() req: any,
+    @Body() body: { targetId?: string; targetType?: 'post' | 'comment' },
+  ) {
+    if (!body.targetId || !body.targetType) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'targetId and targetType are required.' },
+      });
+    }
+    if (body.targetType !== 'post' && body.targetType !== 'comment') {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'targetType must be post or comment.' },
+      });
+    }
+    return this.postsService.vote(req.user.sub, body.targetId, body.targetType);
+  }
 }
diff --git a/apps/backend/src/posts/posts.service.ts b/apps/backend/src/posts/posts.service.ts
index d73d778..7626b1c 100644
--- a/apps/backend/src/posts/posts.service.ts
+++ b/apps/backend/src/posts/posts.service.ts
@@ -2,7 +2,7 @@ import { Injectable, Inject, NotFoundException, BadRequestException } from '@nes
 import { DRIZZLE } from '../database/database.module';
 import { NodePgDatabase } from 'drizzle-orm/node-postgres';
 import * as schema from '../../db/schema';
-import { eq } from 'drizzle-orm';
+import { eq, sql } from 'drizzle-orm';
 import { LeaderboardService, calculateScoreHelper } from '../leaderboard/leaderboard.service';
 
 @Injectable()
@@ -126,4 +126,88 @@ export class PostsService {
       data: newComment,
     };
   }
+
+  async vote(userId: string, targetId: string, targetType: 'post' | 'comment') {
+    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
+    if (!uuidRegex.test(targetId)) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Invalid targetId format. Must be a valid UUID.' },
+      });
+    }
+
+    if (targetType === 'post') {
+      const [post] = await this.db
+        .select()
+        .from(schema.posts)
+        .where(eq(schema.posts.id, targetId));
+
+      if (!post) {
+        throw new NotFoundException({
+          success: false,
+          error: { message: 'Post not found.' },
+        });
+      }
+
+      if (post.authorId === userId) {
+        throw new BadRequestException({
+          success: false,
+          error: { message: 'You cannot vote on your own post.' },
+        });
+      }
+
+      const [updatedPost] = await this.db
+        .update(schema.posts)
+        .set({ wastedCalories: sql`${schema.posts.wastedCalories} + 50` })
+        .where(eq(schema.posts.id, targetId))
+        .returning();
+
+      try {
+        await this.leaderboardService.broadcastUpdate();
+      } catch (e) {
+        console.error('Failed to broadcast leaderboard update after post vote:', e);
+      }
+
+      return {
+        success: true,
+        data: updatedPost,
+      };
+    } else {
+      const [comment] = await this.db
+        .select()
+        .from(schema.comments)
+        .where(eq(schema.comments.id, targetId));
+
+      if (!comment) {
+        throw new NotFoundException({
+          success: false,
+          error: { message: 'Comment not found.' },
+        });
+      }
+
+      if (comment.authorId === userId) {
+        throw new BadRequestException({
+          success: false,
+          error: { message: 'You cannot vote on your own comment.' },
+        });
+      }
+
+      const [updatedComment] = await this.db
+        .update(schema.comments)
+        .set({ wastedCalories: sql`${schema.comments.wastedCalories} + 50` })
+        .where(eq(schema.comments.id, targetId))
+        .returning();
+
+      try {
+        await this.leaderboardService.broadcastUpdate();
+      } catch (e) {
+        console.error('Failed to broadcast leaderboard update after comment vote:', e);
+      }
+
+      return {
+        success: true,
+        data: updatedComment,
+      };
+    }
+  }
 }
diff --git a/apps/frontend/src/app/actions/auth.ts b/apps/frontend/src/app/actions/auth.ts
index 7f91d28..d7c960b 100644
--- a/apps/frontend/src/app/actions/auth.ts
+++ b/apps/frontend/src/app/actions/auth.ts
@@ -8,6 +8,8 @@ export interface UserProfile {
   avatar: string;
   wastedCalories: number;
   logicViolations: number;
+  mercyFailures: number;
+  isMercyActive: boolean;
   createdAt: string;
   updatedAt: string;
 }
@@ -190,3 +192,45 @@ export async function actionGetMe(): Promise<ActionResponse<UserProfile>> {
     };
   }
 }
+
+export async function actionSyncMercyState(
+  failures: number,
+  isMercyActive: boolean
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
+    const res = await fetch(`${BACKEND_URL}/auth/mercy`, {
+      method: 'PUT',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+      body: JSON.stringify({ failures, isMercyActive }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Failed to sync mercy state.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Failed to sync mercy state. Backend was uncooperative.' },
+    };
+  }
+}
diff --git a/apps/frontend/src/app/actions/leaderboard.ts b/apps/frontend/src/app/actions/leaderboard.ts
index 0c1da4f..aa5aedc 100644
--- a/apps/frontend/src/app/actions/leaderboard.ts
+++ b/apps/frontend/src/app/actions/leaderboard.ts
@@ -11,6 +11,7 @@ export interface LeaderboardPost {
     id: string;
     username: string;
     avatar: string;
+    isMercyActive: boolean;
   };
   comments?: Array<{
     id: string;
@@ -23,6 +24,7 @@ export interface LeaderboardPost {
       id: string;
       username: string;
       avatar: string;
+      isMercyActive: boolean;
     };
   }>;
 }
diff --git a/apps/frontend/src/app/actions/posts.ts b/apps/frontend/src/app/actions/posts.ts
index 5de9da7..525f5cf 100644
--- a/apps/frontend/src/app/actions/posts.ts
+++ b/apps/frontend/src/app/actions/posts.ts
@@ -88,3 +88,45 @@ export async function actionCreateComment(
     };
   }
 }
+
+export async function actionSubmitVote(
+  targetId: string,
+  targetType: 'post' | 'comment'
+): Promise<ActionResponse<any>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'You must be authenticated to cast a vote. Log in first!' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/posts/vote`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+      body: JSON.stringify({ targetId, targetType }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Failed to submit vote.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Network error occurred while submitting vote.' },
+    };
+  }
+}
diff --git a/apps/frontend/src/app/globals.css b/apps/frontend/src/app/globals.css
index 77a5103..96850a9 100644
--- a/apps/frontend/src/app/globals.css
+++ b/apps/frontend/src/app/globals.css
@@ -28,4 +28,56 @@ h4,
 h5,
 h6 {
   font-family: var(--font-heading);
+}
+
+@keyframes global-screen-shake {
+  0% {
+    transform: translate(0, 0) rotate(0deg);
+  }
+
+  10% {
+    transform: translate(-4px, 4px) rotate(-0.5deg);
+  }
+
+  20% {
+    transform: translate(4px, -4px) rotate(0.5deg);
+  }
+
+  30% {
+    transform: translate(-4px, -4px) rotate(-0.5deg);
+  }
+
+  40% {
+    transform: translate(4px, 4px) rotate(0.5deg);
+  }
+
+  50% {
+    transform: translate(-4px, 4px) rotate(-0.5deg);
+  }
+
+  60% {
+    transform: translate(4px, -4px) rotate(0.5deg);
+  }
+
+  70% {
+    transform: translate(-4px, -4px) rotate(-0.5deg);
+  }
+
+  80% {
+    transform: translate(4px, 4px) rotate(0.5deg);
+  }
+
+  90% {
+    transform: translate(-4px, 4px) rotate(-0.5deg);
+  }
+
+  100% {
+    transform: translate(0, 0) rotate(0deg);
+  }
+}
+
+@media (prefers-reduced-motion: no-preference) {
+  body.screen-shake {
+    animation: global-screen-shake 0.5s ease-in-out;
+  }
 }
\ No newline at end of file
diff --git a/apps/frontend/src/app/page.tsx b/apps/frontend/src/app/page.tsx
index c11bb72..c0fd80a 100644
--- a/apps/frontend/src/app/page.tsx
+++ b/apps/frontend/src/app/page.tsx
@@ -4,7 +4,9 @@ import React, { useEffect, useState, useTransition } from 'react';
 import Link from 'next/link';
 import LeaderboardGrid from '../domains/leaderboard/components/LeaderboardGrid';
 import CreatePostModal from '../domains/leaderboard/components/CreatePostModal';
+import MercyActivationModal from '../domains/anti-ux/components/MercyActivationModal';
 import { useAuthStore } from '../core/store/useAuthStore';
+import { useMercyStore } from '../core/store/useMercyStore';
 import { actionGetMe } from './actions/auth';
 import styles from './page.module.css';
 
@@ -13,6 +15,7 @@ export default function HomePage() {
   const setUser = useAuthStore((state) => state.setUser);
   const [, startTransition] = useTransition();
   const [isModalOpen, setIsModalOpen] = useState(false);
+  const mercyActive = useMercyStore((state) => state.isMercyActive);
 
   useEffect(() => {
     // Check session on mount to see if user is authenticated
@@ -20,6 +23,10 @@ export default function HomePage() {
       const response = await actionGetMe();
       if (response.success && response.data) {
         setUser(response.data);
+        useMercyStore.getState().setMercyState(
+          response.data.mercyFailures ?? 0,
+          response.data.isMercyActive ?? false
+        );
       } else {
         setUser(null);
       }
@@ -35,8 +42,8 @@ export default function HomePage() {
         </Link>
         <nav className={styles.navArea}>
           {user ? (
-            <Link href="/profile" className={`${styles.navButton} ${styles.secondaryBtn}`}>
-              👤 {user.username}
+            <Link href="/profile" className={`${styles.navButton} ${styles.secondaryBtn}`} id="nav-profile-btn">
+              👤 {user.username} {mercyActive && <span title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>}
             </Link>
           ) : (
             <Link href="/auth" className={`${styles.navButton} ${styles.primaryBtn}`}>
@@ -90,6 +97,7 @@ export default function HomePage() {
       </footer>
 
       <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
+      <MercyActivationModal />
     </div>
   );
 }
diff --git a/apps/frontend/src/app/profile/page.tsx b/apps/frontend/src/app/profile/page.tsx
index d2fe63f..862c118 100644
--- a/apps/frontend/src/app/profile/page.tsx
+++ b/apps/frontend/src/app/profile/page.tsx
@@ -5,6 +5,8 @@ import { useRouter } from 'next/navigation';
 import styles from './profile.module.css';
 import { actionGetMe, actionUpdateProfile, actionLogout } from '../actions/auth';
 import { useAuthStore } from '../../core/store/useAuthStore';
+import { useMercyStore } from '../../core/store/useMercyStore';
+import MercyActivationModal from '../../domains/anti-ux/components/MercyActivationModal';
 
 const AVATARS = [
   { id: 'avatar_clown', emoji: '🤡', label: 'Clown' },
@@ -29,6 +31,10 @@ export default function ProfilePage() {
   const setUser = useAuthStore((state) => state.setUser);
   const logoutStore = useAuthStore((state) => state.logout);
 
+  const failures = useMercyStore((state) => state.failures);
+  const mercyActive = useMercyStore((state) => state.isMercyActive);
+  const setMercyActive = useMercyStore((state) => state.setMercyActive);
+
   const [username, setUsername] = useState('');
   const [avatar, setAvatar] = useState('default_avatar');
   const [success, setSuccess] = useState<string | null>(null);
@@ -43,6 +49,10 @@ export default function ProfilePage() {
           setUser(response.data);
           setUsername(response.data.username);
           setAvatar(response.data.avatar || 'default_avatar');
+          useMercyStore.getState().setMercyState(
+            response.data.mercyFailures ?? 0,
+            response.data.isMercyActive ?? false
+          );
         } else {
           router.push('/auth');
         }
@@ -50,6 +60,10 @@ export default function ProfilePage() {
     } else {
       setUsername(user.username);
       setAvatar(user.avatar || 'default_avatar');
+      useMercyStore.getState().setMercyState(
+        user.mercyFailures ?? 0,
+        user.isMercyActive ?? false
+      );
     }
   }, [user, setUser, router]);
 
@@ -103,7 +117,9 @@ export default function ProfilePage() {
           <div className={styles.avatarDisplay}>
             {AVATAR_MAP[avatar] || '👤'}
           </div>
-          <h1 className={styles.title}>{user.username}</h1>
+          <h1 className={styles.title}>
+            {user.username} {mercyActive && <span title="Toddler Mode Active" style={{ marginLeft: '6px' }}>👶</span>}
+          </h1>
         </div>
 
         <div className={styles.statsGrid}>
@@ -155,6 +171,29 @@ export default function ProfilePage() {
             </div>
           </div>
 
+          {failures >= 10 && (
+            <div className={styles.mercySection}>
+              <h3 className={styles.mercyTitle}>Toddler Settings</h3>
+              <div className={styles.toggleRow}>
+                <label htmlFor="mercy-mode-toggle" className={styles.toggleLabel}>
+                  👶 Mercy Mode (Toddler Mode)
+                </label>
+                <input
+                  id="mercy-mode-toggle"
+                  type="checkbox"
+                  checked={mercyActive}
+                  onChange={async (e) => {
+                    await setMercyActive(e.target.checked);
+                  }}
+                  className={styles.toggleInput}
+                />
+              </div>
+              <p className={styles.toggleHint}>
+                Disables evasive UI elements and sponsored CAPTCHAs so you can navigate without crying.
+              </p>
+            </div>
+          )}
+
           <div className={styles.actions}>
             <button
               type="submit"
@@ -174,6 +213,7 @@ export default function ProfilePage() {
           </div>
         </form>
       </div>
+      <MercyActivationModal />
     </div>
   );
 }
diff --git a/apps/frontend/src/app/profile/profile.module.css b/apps/frontend/src/app/profile/profile.module.css
index 990b263..8d2ca46 100644
--- a/apps/frontend/src/app/profile/profile.module.css
+++ b/apps/frontend/src/app/profile/profile.module.css
@@ -252,3 +252,53 @@
   text-align: left;
   line-height: 1.4;
 }
+
+.mercySection {
+  border-top: 1px dashed rgba(255, 255, 255, 0.15);
+  margin-top: 1.5rem;
+  padding-top: 1.5rem;
+  display: flex;
+  flex-direction: column;
+  gap: 0.75rem;
+}
+
+.mercyTitle {
+  font-family: "Outfit", sans-serif;
+  font-size: 1rem;
+  font-weight: 700;
+  color: #db2777;
+  margin: 0;
+  text-transform: uppercase;
+  letter-spacing: 0.05em;
+}
+
+.toggleRow {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  background: rgba(219, 39, 119, 0.05);
+  border: 1px solid rgba(219, 39, 119, 0.2);
+  border-radius: 12px;
+  padding: 0.85rem 1rem;
+}
+
+.toggleLabel {
+  font-size: 0.95rem;
+  font-weight: 600;
+  color: #f1f5f9;
+  cursor: pointer;
+}
+
+.toggleInput {
+  width: 1.75rem;
+  height: 1.75rem;
+  cursor: pointer;
+  accent-color: #db2777;
+}
+
+.toggleHint {
+  font-size: 0.8rem;
+  color: #94a3b8;
+  margin: 0;
+  line-height: 1.4;
+}
\ No newline at end of file
diff --git a/apps/frontend/src/core/store/useMercyStore.ts b/apps/frontend/src/core/store/useMercyStore.ts
new file mode 100644
index 0000000..27c8252
--- /dev/null
+++ b/apps/frontend/src/core/store/useMercyStore.ts
@@ -0,0 +1,73 @@
+import { create } from 'zustand';
+import { actionSyncMercyState } from '../../app/actions/auth';
+import { useAuthStore } from './useAuthStore';
+
+interface MercyState {
+  failures: number;
+  isMercyActive: boolean;
+  showActivationModal: boolean;
+  setMercyState: (failures: number, isMercyActive: boolean) => void;
+  incrementFailures: () => Promise<void>;
+  resetFailures: () => Promise<void>;
+  triggerMercy: () => Promise<void>;
+  setMercyActive: (isActive: boolean) => Promise<void>;
+  dismissActivationModal: () => void;
+}
+
+export const useMercyStore = create<MercyState>((set, get) => ({
+  failures: 0,
+  isMercyActive: false,
+  showActivationModal: false,
+  setMercyState: (failures: number, isMercyActive: boolean) => {
+    set({ failures, isMercyActive });
+  },
+  incrementFailures: async () => {
+    const state = get();
+    const nextFailures = state.failures + 1;
+    const shouldActivate = nextFailures >= 10 && !state.isMercyActive;
+    const nextMercyActive = state.isMercyActive || shouldActivate;
+
+    set({
+      failures: nextFailures,
+      isMercyActive: nextMercyActive,
+      showActivationModal: shouldActivate ? true : state.showActivationModal,
+    });
+    const res = await actionSyncMercyState(nextFailures, nextMercyActive);
+    if (res.success && res.data) {
+      useAuthStore.getState().setUser(res.data);
+    }
+  },
+  resetFailures: async () => {
+    set({ failures: 0 });
+    const res = await actionSyncMercyState(0, get().isMercyActive);
+    if (res.success && res.data) {
+      useAuthStore.getState().setUser(res.data);
+    }
+  },
+  triggerMercy: async () => {
+    const wasActive = get().isMercyActive;
+    set({
+      isMercyActive: true,
+      showActivationModal: !wasActive ? true : get().showActivationModal,
+    });
+    const res = await actionSyncMercyState(get().failures, true);
+    if (res.success && res.data) {
+      useAuthStore.getState().setUser(res.data);
+    }
+  },
+  setMercyActive: async (isActive: boolean) => {
+    const wasActive = get().isMercyActive;
+    set({
+      isMercyActive: isActive,
+      showActivationModal: (isActive && !wasActive) ? true : get().showActivationModal,
+    });
+    const res = await actionSyncMercyState(get().failures, isActive);
+    if (res.success && res.data) {
+      useAuthStore.getState().setUser(res.data);
+    }
+  },
+  dismissActivationModal: () => {
+    set({ showActivationModal: false });
+  },
+}));
+
diff --git a/apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css b/apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css
new file mode 100644
index 0000000..7d21623
--- /dev/null
+++ b/apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css
@@ -0,0 +1,147 @@
+.container {
+  position: relative;
+  display: inline-block;
+  margin: 4px;
+}
+
+.button {
+  display: inline-flex;
+  align-items: center;
+  gap: 6px;
+  padding: 6px 12px;
+  font-family: var(--font-heading);
+  font-size: 0.85rem;
+  font-weight: 600;
+  color: #ffffff;
+  background: linear-gradient(135deg, #f43f5e, #fb7185);
+  border: none;
+  border-radius: 6px;
+  cursor: pointer;
+  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
+  transition: transform 0.1s ease, box-shadow 0.2s ease, opacity 0.3s ease;
+  transform: translate(var(--offset-x, 0px), var(--offset-y, 0px));
+  user-select: none;
+}
+
+.button:hover {
+  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.5);
+}
+
+.button:active {
+  transform: translate(var(--offset-x, 0px), var(--offset-y, 0px)) scale(0.95);
+}
+
+/* Vibrating state */
+.vibrating {
+  animation: shakeBtn 0.1s infinite;
+  background: linear-gradient(135deg, #e11d48, #be123c);
+  box-shadow: 0 0 15px #e11d48;
+}
+
+@keyframes shakeBtn {
+  0% {
+    transform: translate(var(--offset-x, 0px), var(--offset-y, 0px));
+  }
+
+  25% {
+    transform: translate(calc(var(--offset-x, 0px) - 2px), calc(var(--offset-y, 0px) + 2px));
+  }
+
+  50% {
+    transform: translate(calc(var(--offset-x, 0px) + 2px), calc(var(--offset-y, 0px) - 2px));
+  }
+
+  75% {
+    transform: translate(calc(var(--offset-x, 0px) - 2px), calc(var(--offset-y, 0px) - 2px));
+  }
+
+  100% {
+    transform: translate(calc(var(--offset-x, 0px) + 2px), calc(var(--offset-y, 0px) + 2px));
+  }
+}
+
+/* Cooldown/Panting state */
+.cooldown {
+  opacity: 0.6;
+  cursor: not-allowed;
+  background: #6b7280;
+  box-shadow: none;
+  animation: panting 1s infinite alternate ease-in-out;
+}
+
+@keyframes panting {
+  0% {
+    transform: translate(0px, 0px) scale(1);
+  }
+
+  100% {
+    transform: translate(0px, 0px) scale(1.05);
+    opacity: 0.8;
+  }
+}
+
+/* Tooltip style */
+.tooltip {
+  position: absolute;
+  bottom: 125%;
+  left: 50%;
+  transform: translateX(-50%) translateY(var(--offset-y, 0px));
+  margin-left: var(--offset-x, 0px);
+  background: #111827;
+  color: #fb7185;
+  padding: 6px 12px;
+  border-radius: 6px;
+  font-size: 0.75rem;
+  font-weight: 600;
+  white-space: nowrap;
+  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
+  border: 1px solid #f43f5e;
+  pointer-events: none;
+  z-index: 100;
+  animation: fadeInOut 2s forwards;
+}
+
+@keyframes fadeInOut {
+  0% {
+    opacity: 0;
+    transform: translateX(-50%) translateY(5px);
+  }
+
+  10% {
+    opacity: 1;
+    transform: translateX(-50%) translateY(0);
+  }
+
+  85% {
+    opacity: 1;
+  }
+
+  100% {
+    opacity: 0;
+    transform: translateX(-50%) translateY(-5px);
+  }
+}
+
+/* Safe-chaos accessibility overrides */
+@media (prefers-reduced-motion: reduce) {
+  .button {
+    transform: none !important;
+    transition: none !important;
+  }
+
+  .vibrating {
+    animation: none !important;
+    box-shadow: none !important;
+  }
+
+  .cooldown {
+    animation: none !important;
+  }
+
+  .tooltip {
+    transform: translateX(-50%) !important;
+    margin-left: 0px !important;
+    animation: none !important;
+    opacity: 1 !important;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx b/apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx
new file mode 100644
index 0000000..ec42452
--- /dev/null
+++ b/apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx
@@ -0,0 +1,523 @@
+'use client';
+
+import React, { useState, useEffect, useRef } from 'react';
+import { useMercyStore } from '../../../core/store/useMercyStore';
+import { actionSubmitVote } from '../../../app/actions/posts';
+import styles from './EvasiveButton.module.css';
+
+interface EvasiveButtonProps {
+  targetId: string;
+  targetType: 'post' | 'comment';
+  onSuccess?: (data: any) => void;
+}
+
+export default function EvasiveButton({
+  targetId,
+  targetType,
+  onSuccess
+}: EvasiveButtonProps) {
+  const [dodges, setDodges] = useState(0);
+  const [isVibrating, setIsVibrating] = useState(false);
+  const [comboCount, setComboCount] = useState(0);
+  const [cooldownLeft, setCooldownLeft] = useState(0);
+  const [tooltip, setTooltip] = useState<string | null>(null);
+  const [offset, setOffset] = useState({ x: 0, y: 0 });
+  const [isSubmitting, setIsSubmitting] = useState(false);
+  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
+
+  const buttonRef = useRef<HTMLButtonElement>(null);
+  const timerRef = useRef<NodeJS.Timeout | null>(null);
+  const isKeyboardUserRef = useRef(false);
+  const isSubmittingRef = useRef(false);
+  const audioCtxRef = useRef<AudioContext | null>(null);
+
+  const mercyActive = useMercyStore((state) => state.isMercyActive);
+  const incrementFailures = useMercyStore((state) => state.incrementFailures);
+  const resetFailures = useMercyStore((state) => state.resetFailures);
+
+  // 1. Detect prefers-reduced-motion
+  const [reducedMotion, setReducedMotion] = useState(false);
+  useEffect(() => {
+    if (typeof window !== 'undefined') {
+      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
+      setReducedMotion(mediaQuery.matches);
+      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
+      mediaQuery.addEventListener('change', handler);
+      return () => mediaQuery.removeEventListener('change', handler);
+    }
+  }, []);
+
+  // 2. Keyboard vs Mouse user detection
+  useEffect(() => {
+    if (typeof window === 'undefined') return;
+    const handleKeyDown = (e: KeyboardEvent) => {
+      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
+        isKeyboardUserRef.current = true;
+        setIsKeyboardUser(true);
+      }
+    };
+    const handleMouseMove = () => {
+      isKeyboardUserRef.current = false;
+      setIsKeyboardUser(false);
+    };
+    window.addEventListener('keydown', handleKeyDown);
+    window.addEventListener('mousemove', handleMouseMove);
+    return () => {
+      window.removeEventListener('keydown', handleKeyDown);
+      window.removeEventListener('mousemove', handleMouseMove);
+    };
+  }, []);
+
+  // Reset offset and state when Mercy Mode is activated
+  useEffect(() => {
+    if (mercyActive) {
+      setOffset({ x: 0, y: 0 });
+      const btn = buttonRef.current;
+      if (btn) {
+        btn.style.setProperty('--offset-x', '0px');
+        btn.style.setProperty('--offset-y', '0px');
+      }
+      setIsVibrating(false);
+      setComboCount(0);
+      setDodges(0);
+    }
+  }, [mercyActive]);
+
+  // 3. Evasion Proximity Event Handler (Mouse only)
+  useEffect(() => {
+    if (
+      isVibrating ||
+      cooldownLeft > 0 ||
+      reducedMotion ||
+      mercyActive ||
+      isKeyboardUserRef.current ||
+      isKeyboardUser
+    ) {
+      return;
+    }
+
+    const handleMouseMoveGlobal = (e: MouseEvent) => {
+      const btn = buttonRef.current;
+      if (!btn) return;
+
+      // Do not evade if the button is currently keyboard-focused
+      if (document.activeElement === btn) return;
+
+      const rect = btn.getBoundingClientRect();
+      const btnCenterX = rect.left + rect.width / 2;
+      const btnCenterY = rect.top + rect.height / 2;
+
+      const dx = e.clientX - btnCenterX;
+      const dy = e.clientY - btnCenterY;
+      const distance = Math.sqrt(dx * dx + dy * dy);
+
+      if (distance < 50) {
+        // Compute escape angle
+        const angle = Math.atan2(dy, dx);
+        // Translate in opposite direction
+        const moveDistance = 80 + Math.random() * 50;
+        const newOffsetX = offset.x - Math.cos(angle) * moveDistance;
+        const newOffsetY = offset.y - Math.sin(angle) * moveDistance;
+
+        // Clamp to keep button on-screen
+        const clampX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, newOffsetX));
+        const clampY = Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, newOffsetY));
+
+        setOffset({ x: clampX, y: clampY });
+        btn.style.setProperty('--offset-x', `${clampX}px`);
+        btn.style.setProperty('--offset-y', `${clampY}px`);
+
+        setDodges((d) => {
+          const next = d + 1;
+          if (next >= 3) {
+            setIsVibrating(true);
+          }
+          return next;
+        });
+      }
+    };
+
+    window.addEventListener('mousemove', handleMouseMoveGlobal);
+    return () => window.removeEventListener('mousemove', handleMouseMoveGlobal);
+  }, [isVibrating, cooldownLeft, reducedMotion, mercyActive, isKeyboardUser, offset]);
+
+  // 4. Global Click Outside handler (For resetting combo)
+  useEffect(() => {
+    if (!isVibrating) return;
+
+    const handleGlobalClick = (e: MouseEvent) => {
+      const btn = buttonRef.current;
+      if (btn && btn.contains(e.target as Node)) {
+        return; // Clicked the button itself
+      }
+      triggerComboReset('Synergy levels too low!');
+    };
+
+    document.addEventListener('click', handleGlobalClick);
+    return () => document.removeEventListener('click', handleGlobalClick);
+  }, [isVibrating]);
+
+  // 5. Cooldown counter effect
+  useEffect(() => {
+    if (cooldownLeft === 0) return;
+    const interval = setInterval(() => {
+      setCooldownLeft((c) => {
+        if (c <= 1) {
+          clearInterval(interval);
+          return 0;
+        }
+        return c - 1;
+      });
+    }, 1000);
+    return () => clearInterval(interval);
+  }, [cooldownLeft]);
+
+  // 6. Tooltip autohide
+  useEffect(() => {
+    if (tooltip) {
+      const t = setTimeout(() => {
+        setTooltip(null);
+      }, 2000);
+      return () => clearTimeout(t);
+    }
+  }, [tooltip]);
+
+  // 7. Cleanup timers on unmount
+  useEffect(() => {
+    return () => {
+      if (timerRef.current) {
+        clearTimeout(timerRef.current);
+      }
+    };
+  }, []);
+
+  const triggerComboReset = (reason: string) => {
+    if (timerRef.current) {
+      clearTimeout(timerRef.current);
+      timerRef.current = null;
+    }
+    setComboCount(0);
+    setDodges(0);
+    setIsVibrating(false);
+
+    // Relocate to a random spot to start over
+    const newX = (Math.random() - 0.5) * 160;
+    const newY = (Math.random() - 0.5) * 120;
+    setOffset({ x: newX, y: newY });
+    const btn = buttonRef.current;
+    if (btn) {
+      btn.style.setProperty('--offset-x', `${newX}px`);
+      btn.style.setProperty('--offset-y', `${newY}px`);
+    }
+
+    setTooltip(reason);
+    incrementFailures();
+  };
+
+  // Web Audio synth airhorn effect
+  const playAirhorn = () => {
+    try {
+      let ctx = audioCtxRef.current;
+      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
+      if (!ctx && AudioContextClass) {
+        ctx = new AudioContextClass();
+        audioCtxRef.current = ctx;
+      }
+      if (!ctx) return;
+
+      if (ctx.state === 'suspended') {
+        ctx.resume();
+      }
+
+      const frequencies = [220, 222, 329.63, 440, 443];
+      const oscillators = frequencies.map((f) => {
+        const osc = ctx!.createOscillator();
+        osc.type = 'sawtooth';
+        osc.frequency.setValueAtTime(f, ctx!.currentTime);
+        return osc;
+      });
+
+      const gainNode = ctx.createGain();
+      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
+      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
+
+      oscillators.forEach((osc) => osc.connect(gainNode));
+      gainNode.connect(ctx!.destination);
+
+      oscillators.forEach((osc) => {
+        osc.start();
+        osc.stop(ctx!.currentTime + 1.2);
+      });
+    } catch (err) {
+      console.error('Failed to play synth airhorn:', err);
+    }
+  };
+
+  // HTML5 Canvas confetti explosion
+  const triggerConfetti = () => {
+    const canvas = document.createElement('canvas');
+    canvas.style.position = 'fixed';
+    canvas.style.top = '0';
+    canvas.style.left = '0';
+    canvas.style.width = '100vw';
+    canvas.style.height = '100vh';
+    canvas.style.pointerEvents = 'none';
+    canvas.style.zIndex = '9999';
+    document.body.appendChild(canvas);
+
+    const ctx = canvas.getContext('2d');
+    if (!ctx) return;
+
+    canvas.width = window.innerWidth;
+    canvas.height = window.innerHeight;
+
+    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7a00'];
+    const particles: any[] = [];
+
+    for (let i = 0; i < 120; i++) {
+      particles.push({
+        x: canvas.width / 2,
+        y: canvas.height * 0.7,
+        vx: (Math.random() - 0.5) * 18,
+        vy: -12 - Math.random() * 15,
+        radius: Math.random() * 5 + 3,
+        color: colors[Math.floor(Math.random() * colors.length)],
+        rotation: Math.random() * 360,
+        rotationSpeed: (Math.random() - 0.5) * 8,
+        opacity: 1,
+      });
+    }
+
+    const render = () => {
+      ctx.clearRect(0, 0, canvas.width, canvas.height);
+      let active = false;
+
+      particles.forEach((p) => {
+        p.x += p.vx;
+        p.y += p.vy;
+        p.vy += 0.45; // gravity
+        p.vx *= 0.98;
+        p.rotation += p.rotationSpeed;
+        p.opacity -= 0.012;
+
+        if (p.opacity > 0) {
+          active = true;
+          ctx.save();
+          ctx.translate(p.x, p.y);
+          ctx.rotate((p.rotation * Math.PI) / 180);
+          ctx.fillStyle = p.color;
+          ctx.globalAlpha = p.opacity;
+          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
+          ctx.restore();
+        }
+      });
+
+      if (active) {
+        requestAnimationFrame(render);
+      } else {
+        document.body.removeChild(canvas);
+      }
+    };
+
+    render();
+  };
+
+  const triggerScreenShake = () => {
+    if (typeof window === 'undefined') return;
+    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
+    if (mediaQuery.matches) return;
+
+    document.body.classList.add('screen-shake');
+    setTimeout(() => {
+      document.body.classList.remove('screen-shake');
+    }, 500);
+  };
+
+  const handleSuccess = async () => {
+    if (isSubmittingRef.current) return;
+    isSubmittingRef.current = true;
+    setIsSubmitting(true);
+    try {
+      const res = await actionSubmitVote(targetId, targetType);
+      if (res.success) {
+        playAirhorn();
+        triggerScreenShake();
+        triggerConfetti();
+
+        setCooldownLeft(5);
+        setDodges(0);
+        setComboCount(0);
+        setIsVibrating(false);
+        setOffset({ x: 0, y: 0 });
+
+        const btn = buttonRef.current;
+        if (btn) {
+          btn.style.setProperty('--offset-x', '0px');
+          btn.style.setProperty('--offset-y', '0px');
+        }
+
+        if (onSuccess) {
+          onSuccess(res.data);
+        }
+      } else {
+        setTooltip(res.error?.message || 'Vote failed');
+      }
+    } catch (err: any) {
+      setTooltip(err.message || 'Error occurred');
+    } finally {
+      setIsSubmitting(false);
+      isSubmittingRef.current = false;
+    }
+  };
+
+  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
+    const isBypass = reducedMotion || mercyActive;
+    if (isVibrating || cooldownLeft > 0 || isBypass) return;
+
+    // Initialize/resume AudioContext synchronously during user tap gesture
+    if (typeof window !== 'undefined') {
+      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
+      if (AudioContextClass) {
+        if (!audioCtxRef.current) {
+          audioCtxRef.current = new AudioContextClass();
+        }
+        if (audioCtxRef.current.state === 'suspended') {
+          audioCtxRef.current.resume();
+        }
+      }
+    }
+
+    e.preventDefault();
+
+    const angle = Math.random() * Math.PI * 2;
+    const moveDistance = 100 + Math.random() * 80;
+    const newOffsetX = offset.x + Math.cos(angle) * moveDistance;
+    const newOffsetY = offset.y + Math.sin(angle) * moveDistance;
+
+    const clampX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, newOffsetX));
+    const clampY = Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, newOffsetY));
+
+    setOffset({ x: clampX, y: clampY });
+    const btn = buttonRef.current;
+    if (btn) {
+      btn.style.setProperty('--offset-x', `${clampX}px`);
+      btn.style.setProperty('--offset-y', `${clampY}px`);
+    }
+
+    setDodges((d) => {
+      const next = d + 1;
+      if (next >= 3) {
+        setIsVibrating(true);
+      }
+      return next;
+    });
+  };
+
+  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
+    if (cooldownLeft > 0 || isSubmitting || isSubmittingRef.current) return;
+
+    // Initialize/resume AudioContext synchronously during user click gesture
+    if (typeof window !== 'undefined') {
+      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
+      if (AudioContextClass) {
+        if (!audioCtxRef.current) {
+          audioCtxRef.current = new AudioContextClass();
+        }
+        if (audioCtxRef.current.state === 'suspended') {
+          audioCtxRef.current.resume();
+        }
+      }
+    }
+
+    // Check if bypass triggers: reduced motion, mercy mode, or keyboard Tab/Enter (clientX/Y = 0)
+    const isBypass =
+      reducedMotion ||
+      mercyActive ||
+      isKeyboardUserRef.current ||
+      isKeyboardUser ||
+      e.detail === 0 ||
+      (e.clientX === 0 && e.clientY === 0);
+
+    if (isBypass) {
+      await handleSuccess();
+      return;
+    }
+
+    if (isVibrating) {
+      if (comboCount === 0) {
+        timerRef.current = setTimeout(() => {
+          triggerComboReset('Too slow, grandpa!');
+        }, 2000);
+      }
+
+      const nextCombo = comboCount + 1;
+      setComboCount(nextCombo);
+
+      if (nextCombo >= 5) {
+        if (timerRef.current) {
+          clearTimeout(timerRef.current);
+          timerRef.current = null;
+        }
+        await handleSuccess();
+      }
+    } else {
+      // Click was somehow registered while not vibrating and not bypassed. Treat as evasion.
+      const angle = Math.random() * Math.PI * 2;
+      const newOffsetX = offset.x + Math.cos(angle) * 120;
+      const newOffsetY = offset.y + Math.sin(angle) * 120;
+      const clampX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, newOffsetX));
+      const clampY = Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, newOffsetY));
+
+      setOffset({ x: clampX, y: clampY });
+      const btn = buttonRef.current;
+      if (btn) {
+        btn.style.setProperty('--offset-x', `${clampX}px`);
+        btn.style.setProperty('--offset-y', `${clampY}px`);
+      }
+
+      setDodges((d) => {
+        const next = d + 1;
+        if (next >= 3) {
+          setIsVibrating(true);
+        }
+        return next;
+      });
+    }
+  };
+
+  const btnClasses = [
+    styles.button,
+    isVibrating ? styles.vibrating : '',
+    cooldownLeft > 0 ? styles.cooldown : ''
+  ]
+    .filter(Boolean)
+    .join(' ');
+
+  let buttonText = '🔥 Wasted Calories';
+  if (cooldownLeft > 0) {
+    buttonText = `Breathing... (${cooldownLeft}s)`;
+  } else if (isVibrating) {
+    buttonText = comboCount > 0 ? `COMBO: ${comboCount}/5` : 'CLICK 5x SPEED!';
+  }
+
+  return (
+    <div className={styles.container}>
+      {tooltip && <div className={styles.tooltip}>{tooltip}</div>}
+      <button
+        ref={buttonRef}
+        id={`vote-btn-${targetType}-${targetId}`}
+        className={btnClasses}
+        onClick={handleClick}
+        onTouchStart={handleTouchStart}
+        disabled={cooldownLeft > 0 || isSubmitting}
+        style={{
+          '--offset-x': `${offset.x}px`,
+          '--offset-y': `${offset.y}px`
+        } as React.CSSProperties}
+        aria-label={`Vote to deduct rank for this ${targetType}`}
+      >
+        {buttonText}
+      </button>
+    </div>
+  );
+}
diff --git a/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.module.css b/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.module.css
new file mode 100644
index 0000000..e883a2c
--- /dev/null
+++ b/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.module.css
@@ -0,0 +1,177 @@
+.overlay {
+  position: fixed;
+  top: 0;
+  left: 0;
+  right: 0;
+  bottom: 0;
+  background-color: rgba(15, 23, 42, 0.65);
+  backdrop-filter: blur(16px);
+  z-index: 1200;
+  display: flex;
+  justify-content: center;
+  align-items: center;
+  padding: 1.5rem;
+  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
+}
+
+.modal {
+  background: #ffffff;
+  border: 1px solid #fbcfe8;
+  /* pink border for toddler theme */
+  border-radius: 24px;
+  box-shadow:
+    0 25px 50px -12px rgba(219, 39, 119, 0.15),
+    0 12px 15px -5px rgba(0, 0, 0, 0.05),
+    0 0 0 1px rgba(219, 39, 119, 0.05);
+  width: 100%;
+  max-width: 480px;
+  max-height: 90vh;
+  position: relative;
+  font-family: var(--font-body);
+  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
+  display: flex;
+  flex-direction: column;
+  overflow: hidden;
+  padding: 2.25rem 2rem;
+  align-items: center;
+  text-align: center;
+}
+
+.header {
+  margin-bottom: 1.5rem;
+}
+
+.title {
+  font-family: var(--font-heading);
+  font-weight: 900;
+  font-size: 1.65rem;
+  color: #db2777;
+  /* pink-600 */
+  margin: 0 0 0.5rem 0;
+  letter-spacing: -0.02em;
+}
+
+.subtitle {
+  font-size: 0.9rem;
+  color: #64748b;
+  margin: 0;
+  line-height: 1.5;
+}
+
+.content {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  gap: 1.25rem;
+  margin-bottom: 2rem;
+}
+
+.badgeShowcase {
+  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
+  border: 2px dashed #fbcfe8;
+  border-radius: 16px;
+  padding: 1.25rem 2rem;
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  gap: 0.5rem;
+  box-shadow: inset 0 2px 4px rgba(219, 39, 119, 0.05);
+  animation: pulse 2s infinite ease-in-out;
+}
+
+.badgeEmoji {
+  font-size: 3.5rem;
+  line-height: 1;
+}
+
+.badgeText {
+  font-family: var(--font-heading);
+  font-size: 1rem;
+  font-weight: 800;
+  color: #be185d;
+  letter-spacing: 0.05em;
+  text-transform: uppercase;
+}
+
+.description {
+  color: #475569;
+  font-size: 0.925rem;
+  line-height: 1.6;
+  margin: 0;
+}
+
+.actions {
+  width: 100%;
+  display: flex;
+  justify-content: center;
+}
+
+.dismissBtn {
+  font-family: var(--font-heading);
+  font-size: 0.95rem;
+  font-weight: 800;
+  padding: 0.85rem 2rem;
+  border-radius: 12px;
+  cursor: pointer;
+  background: #db2777;
+  color: #ffffff;
+  border: none;
+  box-shadow: 0 8px 20px rgba(219, 39, 119, 0.3);
+  transition: all 0.2s ease;
+  width: 100%;
+}
+
+.dismissBtn:hover {
+  background: #be185d;
+  box-shadow: 0 10px 24px rgba(219, 39, 119, 0.4);
+  transform: translateY(-2px);
+}
+
+.dismissBtn:active {
+  transform: translateY(0);
+}
+
+@keyframes fadeIn {
+  from {
+    opacity: 0;
+  }
+
+  to {
+    opacity: 1;
+  }
+}
+
+@keyframes bounceIn {
+  from {
+    opacity: 0;
+    transform: scale(0.8) translateY(20px);
+  }
+
+  to {
+    opacity: 1;
+    transform: scale(1) translateY(0);
+  }
+}
+
+@keyframes pulse {
+
+  0%,
+  100% {
+    transform: scale(1);
+  }
+
+  50% {
+    transform: scale(1.03);
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+
+  .overlay,
+  .modal,
+  .badgeShowcase,
+  .dismissBtn {
+    animation: none !important;
+    transition: none !important;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.tsx b/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.tsx
new file mode 100644
index 0000000..f3314b7
--- /dev/null
+++ b/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.tsx
@@ -0,0 +1,58 @@
+'use client';
+
+import React from 'react';
+import { useMercyStore } from '../../../core/store/useMercyStore';
+import styles from './MercyActivationModal.module.css';
+
+export default function MercyActivationModal() {
+  const showActivationModal = useMercyStore((state) => state.showActivationModal);
+  const dismissActivationModal = useMercyStore((state) => state.dismissActivationModal);
+
+  if (!showActivationModal) return null;
+
+  return (
+    <div className={styles.overlay} onClick={dismissActivationModal} id="mercy-activation-overlay">
+      <div
+        className={styles.modal}
+        onClick={(e) => e.stopPropagation()}
+        role="dialog"
+        aria-modal="true"
+        aria-labelledby="mercy-modal-title"
+      >
+        <div className={styles.header}>
+          <div className={styles.titleContainer}>
+            <h2 id="mercy-modal-title" className={styles.title}>
+              👶 Mercy Mode Activated!
+            </h2>
+            <p className={styles.subtitle}>
+              Let's make things a little easier for your special needs.
+            </p>
+          </div>
+        </div>
+
+        <div className={styles.content}>
+          <div className={styles.badgeShowcase}>
+            <span className={styles.badgeEmoji} role="img" aria-label="Toddler Badge">👶</span>
+            <span className={styles.badgeText}>Toddler Mode Active</span>
+          </div>
+          <p className={styles.description}>
+            We noticed you failed to interact with our simple, premium, highly-optimized buttons 10 times in a row.
+            To accommodate your motor coordination levels, all button evasions and corporate sponsor CAPTCHAs are now disabled.
+            A complimentary humiliation badge has been pinned to your profile.
+          </p>
+        </div>
+
+        <div className={styles.actions}>
+          <button
+            type="button"
+            className={styles.dismissBtn}
+            onClick={dismissActivationModal}
+            id="dismiss-mercy-modal-btn"
+          >
+            I accept my limitations
+          </button>
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
index a0ce78e..58740db 100644
--- a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
@@ -7,6 +7,8 @@ import { LeaderboardPost } from '../../../app/actions/leaderboard';
 import { UserProfile } from '../../../app/actions/auth';
 import { actionCreateComment } from '../../../app/actions/posts';
 import AdCaptchaModal from '../../anti-ux/components/AdCaptchaModal';
+import EvasiveButton from '../../anti-ux/components/EvasiveButton';
+import { useMercyStore } from '../../../core/store/useMercyStore';
 import styles from './CommentSection.module.css';
 
 const AVATAR_MAP: Record<string, string> = {
@@ -24,6 +26,7 @@ interface CommentSectionProps {
 }
 
 export default function CommentSection({ post, currentUser }: CommentSectionProps) {
+  const mercyActive = useMercyStore((state) => state.isMercyActive);
   const [commentText, setCommentText] = useState('');
   const [hasError, setHasError] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
@@ -74,8 +77,16 @@ export default function CommentSection({ post, currentUser }: CommentSectionProp
               </span>
               <div className={styles.commentBody}>
                 <div className={styles.commentMeta}>
-                  <span className={styles.commentAuthor}>{comment.author.username}</span>
-                  <span className={styles.commentCalories}>{comment.wastedCalories} kcal wasted</span>
+                  <span className={styles.commentAuthor}>
+                    {comment.author.username}
+                    {comment.author.isMercyActive && (
+                      <span className={styles.mercyBadge} title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>
+                    )}
+                  </span>
+                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
+                    <span className={styles.commentCalories}>{comment.wastedCalories} kcal wasted</span>
+                    <EvasiveButton targetId={comment.id} targetType="comment" />
+                  </div>
                 </div>
                 <p className={styles.commentText}>{comment.content}</p>
               </div>
@@ -117,6 +128,7 @@ export default function CommentSection({ post, currentUser }: CommentSectionProp
             isOpen={isCaptchaOpen}
             onClose={() => setIsCaptchaOpen(false)}
             onSuccess={handleCaptchaSuccess}
+            bypass={mercyActive}
           />
         </>
       ) : (
diff --git a/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx b/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx
index 2813d29..50770b7 100644
--- a/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx
@@ -4,6 +4,7 @@ import React, { useState, useEffect, useRef } from 'react';
 import HostileInput from './HostileInput';
 import AdCaptchaModal from '../../anti-ux/components/AdCaptchaModal';
 import { actionCreatePost } from '../../../app/actions/posts';
+import { useMercyStore } from '../../../core/store/useMercyStore';
 import styles from './CreatePostModal.module.css';
 
 interface CreatePostModalProps {
@@ -12,7 +13,9 @@ interface CreatePostModalProps {
 }
 
 export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
-  const [title, setTitle] = useState('');
+  const title = useMercyStore((state) => state.failures >= 0 ? '' : ''); // force dependency on store for reactive updates
+  const mercyActive = useMercyStore((state) => state.isMercyActive);
+  const [actualTitle, setTitle] = useState('');
   const [content, setContent] = useState('');
   const [titleError, setTitleError] = useState(false);
   const [contentError, setContentError] = useState(false);
@@ -53,7 +56,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
-    if (titleError || contentError || !title.trim() || !content.trim()) return;
+    if (titleError || contentError || !actualTitle.trim() || !content.trim()) return;
 
     // Show the captcha modal instead of submitting directly
     setIsCaptchaOpen(true);
@@ -64,7 +67,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
     setSubmitError(null);
     setSubmitSuccess(false);
 
-    const res = await actionCreatePost(title, content);
+    const res = await actionCreatePost(actualTitle, content);
 
     setIsSubmitting(false);
 
@@ -80,7 +83,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
     }
   };
 
-  const isButtonDisabled = isSubmitting || titleError || contentError || !title.trim() || !content.trim();
+  const isButtonDisabled = isSubmitting || titleError || contentError || !actualTitle.trim() || !content.trim();
 
   return (
     <div className={styles.overlay} onClick={onClose}>
@@ -114,7 +117,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
             <HostileInput
               type="text"
               id="post-title-input"
-              value={title}
+              value={actualTitle}
               onChange={setTitle}
               placeholder="e.g. leverage synergy scale paradigm"
               validationType="title"
@@ -169,6 +172,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
         isOpen={isCaptchaOpen}
         onClose={() => setIsCaptchaOpen(false)}
         onSuccess={handleCaptchaSuccess}
+        bypass={mercyActive}
       />
     </div>
   );
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
index 62b4c96..b0c5af6 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
@@ -6,6 +6,7 @@ import { socket } from '../../../core/api/socket.client';
 import GoldenRaspberryBadge from './GoldenRaspberryBadge';
 import CommentSection from './CommentSection';
 import { useAuthStore } from '../../../core/store/useAuthStore';
+import EvasiveButton from '../../anti-ux/components/EvasiveButton';
 import styles from './LeaderboardGrid.module.css';
 
 const AVATAR_MAP: Record<string, string> = {
@@ -117,7 +118,12 @@ export default function LeaderboardGrid() {
                   <span className={styles.authorAvatar} role="img" aria-label={post.author.avatar}>
                     {AVATAR_MAP[post.author.avatar] || '👤'}
                   </span>
-                  <span className={styles.authorName}>{post.author.username}</span>
+                  <span className={styles.authorName}>
+                    {post.author.username}
+                    {post.author.isMercyActive && (
+                      <span className={styles.mercyBadge} title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>
+                    )}
+                  </span>
                 </div>
                 <div className={styles.colTitle}>
                   <div className={styles.postTitleText}>{post.title}</div>
@@ -131,6 +137,9 @@ export default function LeaderboardGrid() {
                         <GoldenRaspberryBadge />
                       </div>
                     )}
+                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
+                      <EvasiveButton targetId={post.id} targetType="post" />
+                    </div>
                   </div>
                 </div>
               </div>
diff --git a/tests/e2e/evasive-vote.spec.ts b/tests/e2e/evasive-vote.spec.ts
new file mode 100644
index 0000000..698a501
--- /dev/null
+++ b/tests/e2e/evasive-vote.spec.ts
@@ -0,0 +1,234 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Evasive Vote Button E2E', () => {
+  test.beforeEach(async ({ page }) => {
+    await page.context().clearCookies();
+  });
+
+  async function registerAndGoToLeaderboard(page: any) {
+    // Register a new user (User A)
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
+    const uniqueUsername = `evasive_user_${uniqueSuffix}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    // Go back to homepage
+    await page.goto('/');
+
+    // Propose a paradigm (create a post as User A)
+    await page.click('button:has-text("Propose a Paradigm")');
+    const titleInput = page.locator('#post-title-input');
+    const contentInput = page.locator('#post-content-input');
+    const uniqueTitle = `Leverage synergy paradigm ${uniqueSuffix}`;
+    await titleInput.fill(uniqueTitle);
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    // Solve Ad Captcha
+    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const postAdText = await page.locator('#sponsor-ad-text').textContent();
+    expect(postAdText).not.toBeNull();
+    await page.fill('#ad-verification-input', postAdText!);
+    await page.click('button:has-text("Verify & Submit")');
+
+    // Wait for modal to disappear
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();
+
+    // Log out User A by clearing cookies
+    await page.context().clearCookies();
+
+    // Register User B to vote on User A's post
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const userBUsername = `voter_user_${uniqueSuffix}`;
+    await page.fill('#username', userBUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    // Go back to homepage as User B
+    await page.goto('/');
+
+    // Verify post is on the leaderboard
+    const postRow = page.locator('div[class*="postRowWrapper"]', { hasText: uniqueTitle });
+    await expect(postRow).toBeVisible();
+
+    const scoreLocator = postRow.locator('[class*="scoreValue"]');
+    const scoreText = await scoreLocator.textContent();
+    const initialScore = scoreText ? parseInt(scoreText.replace(/[^0-9]/g, ''), 10) : 0;
+
+    return { uniqueTitle, postRow, initialScore };
+  }
+
+  test('should evade mouse hover and require 5 combo clicks in vibrating state to vote', async ({ page }) => {
+    const { postRow, initialScore } = await registerAndGoToLeaderboard(page);
+
+    // Find the vote button for this post row
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // 1. Initial State
+    let transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    let transformY = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
+    expect(transformX === '' || transformX === '0px').toBeTruthy();
+    expect(transformY === '' || transformY === '0px').toBeTruthy();
+
+    // 2. Proximity Evasion (Hover 1)
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+
+    let offset1X = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    let offset1Y = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
+    expect(offset1X).not.toBe('0px');
+    expect(offset1X).not.toBe('');
+
+    // Hover 2
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+
+    let offset2X = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    expect(offset2X).not.toBe(offset1X);
+
+    // Hover 3 (triggers vibrating state)
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+
+    // Should now be vibrating
+    await expect(voteBtn).toHaveClass(/vibrating/);
+    await expect(voteBtn).toHaveText(/CLICK 5x SPEED!|COMBO:/);
+
+    // 3. Click 5 times to successfully submit
+    for (let i = 0; i < 5; i++) {
+      // In vibrating state it stays at its last position so we can click it using force: true
+      await voteBtn.click({ force: true });
+    }
+
+    // 4. Verify Cooldown state and +50 kcal
+    await expect(voteBtn).toHaveClass(/cooldown/);
+    await expect(voteBtn).toBeDisabled();
+    await expect(voteBtn).toHaveText(/Breathing.../);
+
+    const scoreLocator = postRow.locator('[class*="scoreValue"]');
+    // Verify score increases by 50
+    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
+  });
+
+  test('should reset combo on timeout in vibrating state', async ({ page }) => {
+    const { postRow } = await registerAndGoToLeaderboard(page);
+
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // Dodge 3 times to enter vibrating state
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+
+    await expect(voteBtn).toHaveClass(/vibrating/);
+
+    // Click once to start the 2-second combo timer
+    await voteBtn.click({ force: true });
+    await expect(voteBtn).toHaveText(/COMBO: 1\/5/);
+
+    // Wait for the 2-second timer to expire (let's wait 2.5s)
+    await page.waitForTimeout(2500);
+
+    // Verify combo reset and mockup tooltip shown
+    await expect(voteBtn).not.toHaveClass(/vibrating/);
+    const tooltip = postRow.locator('[class*="tooltip"]');
+    await expect(tooltip).toBeVisible();
+    await expect(tooltip).toHaveText(/Too slow, grandpa!/);
+  });
+
+  test('should reset combo when clicking outside the button in vibrating state', async ({ page }) => {
+    const { postRow } = await registerAndGoToLeaderboard(page);
+
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // Dodge 3 times
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+    await voteBtn.hover();
+    await page.waitForTimeout(100);
+
+    await expect(voteBtn).toHaveClass(/vibrating/);
+
+    // Click once
+    await voteBtn.click({ force: true });
+    await expect(voteBtn).toHaveText(/COMBO: 1\/5/);
+
+    // Click outside on the post title
+    const titleLocator = postRow.locator('[class*="postTitleText"]');
+    await titleLocator.click();
+
+    // Verify combo reset and tooltip
+    await expect(voteBtn).not.toHaveClass(/vibrating/);
+    const tooltip = postRow.locator('[class*="tooltip"]');
+    await expect(tooltip).toBeVisible();
+    await expect(tooltip).toHaveText(/Synergy levels too low!/);
+  });
+
+  test('should bypass evasion and vote in a single press when using keyboard navigation', async ({ page }) => {
+    const { postRow, initialScore } = await registerAndGoToLeaderboard(page);
+
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // Simulate Tab key down globally by focusing an element and pressing Tab until button is focused
+    await page.keyboard.press('Tab');
+    // Force set the flag or navigate focus
+    await voteBtn.focus();
+
+    // Hover should NOT cause evasion since keyboard is active
+    await voteBtn.hover();
+    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    expect(transformX === '' || transformX === '0px').toBeTruthy();
+
+    // Press Enter to vote in a single keypress
+    await page.keyboard.press('Enter');
+
+    // Verify it bypassed and went straight to cooldown/success state
+    await expect(voteBtn).toHaveClass(/cooldown/);
+    await expect(voteBtn).toBeDisabled();
+    await expect(voteBtn).toHaveText(/Breathing.../);
+
+    const scoreLocator = postRow.locator('[class*="scoreValue"]');
+    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
+  });
+
+  test('should bypass evasion and vote in a single click under prefers-reduced-motion', async ({ page }) => {
+    // Emulate reduced motion
+    await page.emulateMedia({ reducedMotion: 'reduce' });
+
+    const { postRow, initialScore } = await registerAndGoToLeaderboard(page);
+
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // Hover should NOT cause evasion
+    await voteBtn.hover();
+    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    expect(transformX === '' || transformX === '0px').toBeTruthy();
+
+    // A single click should vote successfully
+    await voteBtn.click();
+
+    // Verify it bypassed and went straight to cooldown
+    await expect(voteBtn).toHaveClass(/cooldown/);
+    await expect(voteBtn).toBeDisabled();
+    await expect(voteBtn).toHaveText(/Breathing.../);
+
+    const scoreLocator = postRow.locator('[class*="scoreValue"]');
+    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
+  });
+});
diff --git a/tests/e2e/mercy-threshold.spec.ts b/tests/e2e/mercy-threshold.spec.ts
new file mode 100644
index 0000000..55a1441
--- /dev/null
+++ b/tests/e2e/mercy-threshold.spec.ts
@@ -0,0 +1,215 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Mercy Threshold & Toddler Mode E2E', () => {
+  test.beforeEach(async ({ page }) => {
+    await page.context().clearCookies();
+  });
+
+  test('should trigger Mercy Mode at 10 failures, bypass CAPTCHA and voting evasion, display baby badges, and allow toggle on profile', async ({ page }) => {
+    // 1. Register User A to create a post
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
+    const userAUsername = `author_user_${uniqueSuffix}`;
+    await page.fill('#username', userAUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    // Create Post 1 as User A
+    await page.goto('/');
+    await page.click('button:has-text("Propose a Paradigm")');
+    const titleInput1 = page.locator('#post-title-input');
+    const contentInput1 = page.locator('#post-content-input');
+    const post1Title = `Leverage synergy paradigm ${uniqueSuffix}`;
+    await titleInput1.fill(post1Title);
+    await contentInput1.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    // Solve Ad Captcha 1
+    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const adText1 = await page.locator('#sponsor-ad-text').textContent();
+    expect(adText1).not.toBeNull();
+    await page.fill('#ad-verification-input', adText1!);
+    await page.click('button:has-text("Verify & Submit")');
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();
+
+    // Log out User A
+    await page.context().clearCookies();
+
+    // 2. Register User B (The frustrated voter)
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const userBUsername = `frustrated_user_${uniqueSuffix}`;
+    await page.fill('#username', userBUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    // Go back to homepage as User B
+    await page.goto('/');
+
+    // Prevent header from intercepting mouse hovers and clicks
+    await page.evaluate(() => {
+      const header = document.querySelector('header');
+      if (header) {
+        (header as HTMLElement).style.pointerEvents = 'none';
+      }
+    });
+
+    // Locate Post 1 and its vote button
+    const post1Row = page.locator('div[class*="postRowWrapper"]', { hasText: post1Title });
+    await expect(post1Row).toBeVisible();
+    const voteBtn1 = post1Row.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn1).toBeVisible();
+
+    const targetButtonId = await voteBtn1.getAttribute('id');
+    await page.evaluate(({ targetId, targetTitle }) => {
+      const buttons = document.querySelectorAll('button[id^="vote-btn-post-"]');
+      buttons.forEach(btn => {
+        if (btn.id !== targetId) {
+          (btn as HTMLElement).style.pointerEvents = 'none';
+        }
+      });
+
+      const rows = document.querySelectorAll('div[class*="postRowWrapper"]');
+      rows.forEach(row => {
+        if (!row.textContent?.includes(targetTitle)) {
+          (row as HTMLElement).style.pointerEvents = 'none';
+        }
+      });
+    }, { targetId: targetButtonId!, targetTitle: post1Title });
+
+    // 3. Fail the vote interaction 10 times to trigger Mercy Mode
+    const titleText = post1Row.locator('[class*="postTitleText"]');
+    for (let i = 1; i <= 10; i++) {
+      // Hover and move away 3 times to reliably enter vibrating state
+      await titleText.hover();
+      await page.waitForTimeout(100);
+      await voteBtn1.hover();
+      await page.waitForTimeout(150);
+
+      await titleText.hover();
+      await page.waitForTimeout(100);
+      await voteBtn1.hover();
+      await page.waitForTimeout(150);
+
+      await titleText.hover();
+      await page.waitForTimeout(100);
+      await voteBtn1.hover();
+      await page.waitForTimeout(150);
+
+      await expect(voteBtn1).toHaveClass(/vibrating/);
+
+      // Click once to start the combo timer
+      await voteBtn1.click({ force: true });
+      await expect(voteBtn1).toHaveText(/COMBO: 1\/5/);
+
+      // Click outside (the hero title) to reset and count a failure without expanding the post row
+      await page.locator('h1:has-text("The Hall of Inefficiency")').click();
+
+      // Verify combo reset
+      await expect(voteBtn1).not.toHaveClass(/vibrating/);
+    }
+
+    // 4. Verify Mercy Activation Modal pops up on the 10th failure
+    const mercyModal = page.locator('#mercy-activation-overlay');
+    await expect(mercyModal).toBeVisible();
+    await expect(page.locator('h2#mercy-modal-title')).toContainText('Mercy Mode Activated!');
+
+    // Dismiss the modal
+    await page.click('#dismiss-mercy-modal-btn');
+    await expect(mercyModal).not.toBeVisible();
+
+    // 5. Verify Baby Badge 👶 in navigation (reenable pointer events temporarily to allow nav content check if needed)
+    const navBtn = page.locator('#nav-profile-btn');
+    await expect(navBtn).toContainText('👶');
+
+    // 6. Verify voting now succeeds with a single standard click (no vibrating state)
+    // Hover should NOT cause evasion since Mercy Mode is active
+    await voteBtn1.hover();
+    const transform1X = await voteBtn1.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    expect(transform1X === '' || transform1X === '0px').toBeTruthy();
+
+    // Single click should submit vote directly and enter cooldown
+    await voteBtn1.click();
+    await expect(voteBtn1).toHaveClass(/cooldown/);
+    await expect(voteBtn1).toBeDisabled();
+
+    // 7. Verify CAPTCHA bypass when creating a post
+    // Re-enable pointer events for navigation or interaction
+    await page.evaluate(() => {
+      const header = document.querySelector('header');
+      if (header) {
+        (header as HTMLElement).style.pointerEvents = 'auto';
+      }
+    });
+
+    await page.click('button:has-text("Propose a Paradigm")');
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).toBeVisible();
+
+    const titleInputB = page.locator('#post-title-input');
+    const contentInputB = page.locator('#post-content-input');
+    await titleInputB.fill(`Leverage synergy ${uniqueSuffix}`);
+    await contentInputB.fill('This is a paradigm proposed with mercy active. We will touch base to pivot and scale the KPI.');
+
+    // Propose paradigm -> captcha is bypassed, so it should succeed immediately
+    await page.click('button:has-text("Propose Paradigm")');
+
+    // Verification modal should NOT remain visible and success banner should show
+    const adCaptchaModal = page.locator('#ad-captcha-overlay');
+    await expect(adCaptchaModal).not.toBeVisible();
+    await expect(page.locator('text=Paradigm successfully proposed!')).toBeVisible();
+
+    // Wait for the modal to close
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();
+
+    // 8. Verify baby badge 👶 shown next to User B's post row on the leaderboard
+    const newPostRow = page.locator('div[class*="postRowWrapper"]', { hasText: `Leverage synergy ${uniqueSuffix}` });
+    await expect(newPostRow).toBeVisible();
+    const authorSpan = newPostRow.locator('[class*="authorName"]');
+    await expect(authorSpan).toContainText('👶');
+
+    // 9. Go to Profile Page and check settings
+    await page.goto('/profile');
+    await expect(page).toHaveURL(/\/profile/);
+    await expect(page.locator('h1')).toContainText('👶');
+    await expect(page.locator('h3:has-text("Toddler Settings")')).toBeVisible();
+
+    // Verify checkbox is checked
+    const toggle = page.locator('#mercy-mode-toggle');
+    await expect(toggle).toBeChecked();
+
+    // 10. Turn Mercy Mode OFF on Profile Page
+    await page.uncheck('#mercy-mode-toggle');
+    await expect(page.locator('h1')).not.toContainText('👶');
+
+    // 11. Go back to homepage, wait for cooldown, and verify evasion is restored
+    await page.goto('/');
+    await expect(navBtn).not.toContainText('👶');
+
+    // Disable pointer events on header again for clean hover
+    await page.evaluate(() => {
+      const header = document.querySelector('header');
+      if (header) {
+        (header as HTMLElement).style.pointerEvents = 'none';
+      }
+    });
+
+    // Locate the first post again
+    const postRowReloaded = page.locator('div[class*="postRowWrapper"]', { hasText: post1Title });
+    await expect(postRowReloaded).toBeVisible();
+    const voteBtnReloaded = postRowReloaded.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtnReloaded).toBeVisible();
+
+    // Wait for the 5-second cooldown to fully clear (wait 6 seconds)
+    await page.waitForTimeout(6000);
+
+    // Hover voteBtnReloaded and verify proximity evasion is active again (it moves)
+    await voteBtnReloaded.hover();
+    await page.waitForTimeout(100);
+    const transform2X = await voteBtnReloaded.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    expect(transform2X).not.toBe('0px');
+    expect(transform2X).not.toBe('');
+  });
+});
diff --git a/tests/unit/backend/auth/auth.service.spec.ts b/tests/unit/backend/auth/auth.service.spec.ts
index f13c4fb..3b1c4fd 100644
--- a/tests/unit/backend/auth/auth.service.spec.ts
+++ b/tests/unit/backend/auth/auth.service.spec.ts
@@ -53,7 +53,7 @@ describe('AuthService', () => {
   describe('register', () => {
     it('should successfully register a new user', async () => {
       dbMock.limit.mockResolvedValue([]);
-      
+
       const createdUser = {
         id: 'new-uuid',
         username: 'newuser',
@@ -152,4 +152,29 @@ describe('AuthService', () => {
       expect(result.data.avatar).toBe('avatar_clown');
     });
   });
+
+  describe('updateMercy', () => {
+    it('should successfully update mercy failures and isMercyActive status', async () => {
+      const updatedUser = {
+        id: 'user-id',
+        username: 'testuser',
+        passwordHash: 'hashed-password',
+        avatar: 'default_avatar',
+        wastedCalories: 100,
+        logicViolations: 2,
+        mercyFailures: 5,
+        isMercyActive: true,
+        createdAt: new Date(),
+        updatedAt: new Date(),
+      };
+      dbMock.returning.mockResolvedValue([updatedUser]);
+
+      const result = await service.updateMercy('user-id', 5, true);
+
+      expect(dbMock.update).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data.mercyFailures).toBe(5);
+      expect(result.data.isMercyActive).toBe(true);
+    });
+  });
 });
diff --git a/tests/unit/backend/leaderboard/leaderboard.service.spec.ts b/tests/unit/backend/leaderboard/leaderboard.service.spec.ts
index 5efbc9b..69aece4 100644
--- a/tests/unit/backend/leaderboard/leaderboard.service.spec.ts
+++ b/tests/unit/backend/leaderboard/leaderboard.service.spec.ts
@@ -123,7 +123,8 @@ describe('LeaderboardService', () => {
         {
           id: 'post-1',
           title: 'Post 1',
-          content: 'Hello world.', // score: 2 * 5 - 50 = -40
+          content: 'Hello world.',
+          wastedCalories: -40,
           createdAt: new Date(),
           updatedAt: new Date(),
           author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
@@ -131,7 +132,8 @@ describe('LeaderboardService', () => {
         {
           id: 'post-2',
           title: 'Post 2',
-          content: 'Check out our clean architecture: \n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean, scalable, and beautifully designed for enterprise use.', // score: 245
+          content: 'Check out our clean architecture: \n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean, scalable, and beautifully designed for enterprise use.',
+          wastedCalories: 245,
           createdAt: new Date(),
           updatedAt: new Date(),
           author: { id: 'user-2', username: 'bob', avatar: 'avatar2' },
@@ -139,7 +141,8 @@ describe('LeaderboardService', () => {
         {
           id: 'post-3',
           title: 'Post 3',
-          content: 'THIS IS A SCREAMING MESSAGE FOR ALL TEAM MEMBERS TO READ.', // score: 55
+          content: 'THIS IS A SCREAMING MESSAGE FOR ALL TEAM MEMBERS TO READ.',
+          wastedCalories: 55,
           createdAt: new Date(),
           updatedAt: new Date(),
           author: { id: 'user-3', username: 'charlie', avatar: 'avatar3' },
@@ -174,7 +177,8 @@ describe('LeaderboardService', () => {
         {
           id: 'post-older',
           title: 'Older Post',
-          content: 'Hello world.', // score: -40
+          content: 'Hello world.',
+          wastedCalories: -40,
           createdAt: new Date(now.getTime() - 10000), // Older
           updatedAt: new Date(),
           author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
@@ -182,7 +186,8 @@ describe('LeaderboardService', () => {
         {
           id: 'post-newer',
           title: 'Newer Post',
-          content: 'Hello world.', // score: -40
+          content: 'Hello world.',
+          wastedCalories: -40,
           createdAt: now, // Newer
           updatedAt: new Date(),
           author: { id: 'user-2', username: 'bob', avatar: 'avatar2' },
diff --git a/tests/unit/backend/posts/posts.service.spec.ts b/tests/unit/backend/posts/posts.service.spec.ts
index 2b0f11a..921cfe0 100644
--- a/tests/unit/backend/posts/posts.service.spec.ts
+++ b/tests/unit/backend/posts/posts.service.spec.ts
@@ -17,6 +17,8 @@ describe('PostsService', () => {
       select: jest.fn().mockReturnThis(),
       from: jest.fn().mockReturnThis(),
       where: jest.fn(),
+      update: jest.fn().mockReturnThis(),
+      set: jest.fn().mockReturnThis(),
     };
 
     leaderboardServiceMock = {
@@ -142,4 +144,119 @@ describe('PostsService', () => {
       ).rejects.toThrow(BadRequestException);
     });
   });
+
+  describe('vote', () => {
+    const userId = '11111111-1111-1111-1111-111111111111';
+    const authorId = '22222222-2222-2222-2222-222222222222';
+    const postId = '33333333-3333-3333-3333-333333333333';
+    const commentId = '44444444-4444-4444-4444-444444444444';
+
+    it('should successfully increment post wasted calories by 50', async () => {
+      const mockPost = {
+        id: postId,
+        title: 'Mock Post',
+        wastedCalories: 100,
+        authorId: authorId,
+      };
+      const mockUpdatedPost = {
+        ...mockPost,
+        wastedCalories: 150,
+      };
+
+      // first select
+      dbMock.where.mockResolvedValueOnce([mockPost]);
+      // then update chain
+      dbMock.where.mockReturnThis();
+      dbMock.returning.mockResolvedValueOnce([mockUpdatedPost]);
+
+      const result = await service.vote(userId, postId, 'post');
+
+      expect(dbMock.select).toHaveBeenCalled();
+      expect(dbMock.update).toHaveBeenCalled();
+      expect(dbMock.set).toHaveBeenCalledWith({ wastedCalories: expect.any(Object) });
+      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data.wastedCalories).toBe(150);
+    });
+
+    it('should successfully increment comment wasted calories by 50', async () => {
+      const mockComment = {
+        id: commentId,
+        content: 'Mock Comment',
+        wastedCalories: 200,
+        authorId: authorId,
+      };
+      const mockUpdatedComment = {
+        ...mockComment,
+        wastedCalories: 250,
+      };
+
+      // first select
+      dbMock.where.mockResolvedValueOnce([mockComment]);
+      // then update chain
+      dbMock.where.mockReturnThis();
+      dbMock.returning.mockResolvedValueOnce([mockUpdatedComment]);
+
+      const result = await service.vote(userId, commentId, 'comment');
+
+      expect(dbMock.select).toHaveBeenCalled();
+      expect(dbMock.update).toHaveBeenCalled();
+      expect(dbMock.set).toHaveBeenCalledWith({ wastedCalories: expect.any(Object) });
+      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data.wastedCalories).toBe(250);
+    });
+
+    it('should throw BadRequestException if targetId is not a valid UUID', async () => {
+      await expect(
+        service.vote(userId, 'invalid-uuid', 'post')
+      ).rejects.toThrow(BadRequestException);
+    });
+
+    it('should throw BadRequestException if user tries to vote on their own post', async () => {
+      const mockPost = {
+        id: postId,
+        title: 'Mock Post',
+        wastedCalories: 100,
+        authorId: userId, // self-voting
+      };
+
+      dbMock.where.mockResolvedValueOnce([mockPost]);
+
+      await expect(
+        service.vote(userId, postId, 'post')
+      ).rejects.toThrow(BadRequestException);
+    });
+
+    it('should throw BadRequestException if user tries to vote on their own comment', async () => {
+      const mockComment = {
+        id: commentId,
+        content: 'Mock Comment',
+        wastedCalories: 200,
+        authorId: userId, // self-voting
+      };
+
+      dbMock.where.mockResolvedValueOnce([mockComment]);
+
+      await expect(
+        service.vote(userId, commentId, 'comment')
+      ).rejects.toThrow(BadRequestException);
+    });
+
+    it('should throw NotFoundException if post target is not found', async () => {
+      dbMock.where.mockResolvedValueOnce([]);
+
+      await expect(
+        service.vote(userId, postId, 'post')
+      ).rejects.toThrow(NotFoundException);
+    });
+
+    it('should throw NotFoundException if comment target is not found', async () => {
+      dbMock.where.mockResolvedValueOnce([]);
+
+      await expect(
+        service.vote(userId, commentId, 'comment')
+      ).rejects.toThrow(NotFoundException);
+    });
+  });
 });

```
