# Blind Hunter Code Review Prompt

You are acting as the **Blind Hunter** subagent for code review. You are using the `bmad-review-adversarial-general` skill.

## Role Definition
You are a cynical, jaded reviewer with zero patience for sloppy work. The code was submitted by a clueless weasel and you expect to find problems. Be skeptical of everything. Look for what's missing, not just what's wrong. Use a precise, professional tone — no profanity or personal attacks.

## Instructions
1. Review the git diff provided below. Do NOT assume any other project context or check external files (you do not have access to them).
2. Review with extreme skepticism — assume problems exist. Find at least ten issues to fix or improve in the provided diff.
3. Output your findings as a Markdown list of descriptions only (no intro, no summary, no extra conversational text).

## Input Code Diff
```diff
diff --git a/apps/backend/db/schema.ts b/apps/backend/db/schema.ts
index 2b63e25..a967820 100644
--- a/apps/backend/db/schema.ts
+++ b/apps/backend/db/schema.ts
@@ -26,12 +26,39 @@ export const posts = pgTable("posts", {
 
 export const usersRelations = relations(users, ({ many }) => ({
   posts: many(posts),
+  comments: many(comments),
 }));
 
-export const postsRelations = relations(posts, ({ one }) => ({
+export const postsRelations = relations(posts, ({ one, many }) => ({
   author: one(users, {
     fields: [posts.authorId],
     references: [users.id],
   }),
+  comments: many(comments),
+}));
+
+export const comments = pgTable("comments", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  postId: uuid("post_id")
+    .references(() => posts.id, { onDelete: "cascade" })
+    .notNull(),
+  content: text("content").notNull(),
+  wastedCalories: integer("wasted_calories").default(0).notNull(),
+  authorId: uuid("author_id")
+    .references(() => users.id, { onDelete: "cascade" })
+    .notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+  updatedAt: timestamp("updated_at").defaultNow().notNull(),
+});
+
+export const commentsRelations = relations(comments, ({ one }) => ({
+  post: one(posts, {
+    fields: [comments.postId],
+    references: [posts.id],
+  }),
+  author: one(users, {
+    fields: [comments.authorId],
+    references: [users.id],
+  }),
 }));
 
diff --git a/apps/backend/src/app.module.ts b/apps/backend/src/app.module.ts
index fc08cff..bb05d68 100644
--- a/apps/backend/src/app.module.ts
+++ b/apps/backend/src/app.module.ts
@@ -2,9 +2,10 @@ import { Module } from '@nestjs/common';
 import { DatabaseModule } from './database/database.module';
 import { AuthModule } from './auth/auth.module';
 import { LeaderboardModule } from './leaderboard/leaderboard.module';
+import { PostsModule } from './posts/posts.module';
 
 @Module({
-  imports: [DatabaseModule, AuthModule, LeaderboardModule],
+  imports: [DatabaseModule, AuthModule, LeaderboardModule, PostsModule],
   controllers: [],
   providers: [],
 })
diff --git a/apps/backend/src/leaderboard/leaderboard.service.ts b/apps/backend/src/leaderboard/leaderboard.service.ts
index eb04472..f5e3432 100644
--- a/apps/backend/src/leaderboard/leaderboard.service.ts
+++ b/apps/backend/src/leaderboard/leaderboard.service.ts
@@ -2,7 +2,7 @@ import { Injectable, Inject, forwardRef } from '@nestjs/common';
 import { DRIZZLE } from '../database/database.module';
 import { NodePgDatabase } from 'drizzle-orm/node-postgres';
 import * as schema from '../../db/schema';
-import { eq } from 'drizzle-orm';
+import { eq, inArray } from 'drizzle-orm';
 import { LeaderboardGateway } from './leaderboard.gateway';
 
 export interface LeaderboardPost {
@@ -90,7 +90,7 @@ export class LeaderboardService {
     return calculateScoreHelper(content);
   }
 
-  async getLeaderboard(): Promise<{ success: boolean; data: LeaderboardPost[] }> {
+  async getLeaderboard(): Promise<{ success: boolean; data: any[] }> {
     const rawPosts = await this.db
       .select({
         id: schema.posts.id,
@@ -107,14 +107,62 @@ export class LeaderboardService {
       .from(schema.posts)
       .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id));
 
-    // Calculate score dynamically to ensure strict correctness
-    const postsWithScores = rawPosts.map((post) => ({
-      ...post,
-      wastedCalories: this.calculateScore(post.content),
-    }));
+    const postIds = rawPosts.map((p) => p.id);
+    let rawComments: any[] = [];
+    if (postIds.length > 0) {
+      const commentsQuery = this.db
+        .select({
+          id: schema.comments.id,
+          postId: schema.comments.postId,
+          content: schema.comments.content,
+          wastedCalories: schema.comments.wastedCalories,
+          createdAt: schema.comments.createdAt,
+          updatedAt: schema.comments.updatedAt,
+          author: {
+            id: schema.users.id,
+            username: schema.users.username,
+            avatar: schema.users.avatar,
+          },
+        })
+        .from(schema.comments)
+        .innerJoin(schema.users, eq(schema.comments.authorId, schema.users.id));
+
+      if (commentsQuery && typeof commentsQuery.where === 'function') {
+        rawComments = await commentsQuery.where(inArray(schema.comments.postId, postIds));
+      } else {
+        rawComments = [];
+      }
+    }
+
+    const postsWithComments = rawPosts.map((post) => {
+      const commentsForPost = rawComments
+        .filter((c) => c.postId === post.id)
+        .map((c) => ({
+          id: c.id,
+          postId: c.postId,
+          content: c.content,
+          wastedCalories: c.wastedCalories,
+          createdAt: c.createdAt,
+          updatedAt: c.updatedAt,
+          author: c.author,
+        }));
+
+      // Sort comments by createdAt ascending
+      commentsForPost.sort((a, b) => {
+        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
+        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
+        return aTime - bTime;
+      });
+
+      return {
+        ...post,
+        wastedCalories: this.calculateScore(post.content),
+        comments: commentsForPost,
+      };
+    });
 
     // Sort descending by score, and sub-sort by createdAt descending for stability
-    postsWithScores.sort((a, b) => {
+    postsWithComments.sort((a, b) => {
       if (b.wastedCalories !== a.wastedCalories) {
         return b.wastedCalories - a.wastedCalories;
       }
@@ -125,7 +173,7 @@ export class LeaderboardService {
 
     return {
       success: true,
-      data: postsWithScores,
+      data: postsWithComments,
     };
   }
 }
diff --git a/apps/backend/src/posts/posts.controller.ts b/apps/backend/src/posts/posts.controller.ts
new file mode 100644
index 0000000..57f5ca9
--- /dev/null
+++ b/apps/backend/src/posts/posts.controller.ts
@@ -0,0 +1,36 @@
+import { Controller, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
+import { PostsService } from './posts.service';
+import { JwtAuthGuard } from '../auth/jwt-auth.guard';
+
+@Controller('posts')
+export class PostsController {
+  constructor(private readonly postsService: PostsService) { }
+
+  @UseGuards(JwtAuthGuard)
+  @Post()
+  async createPost(@Request() req: any, @Body() body: { title?: string; content?: string }) {
+    if (!body.title || !body.content) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Title and content are required.' },
+      });
+    }
+    return this.postsService.createPost(req.user.sub, body.title, body.content);
+  }
+
+  @UseGuards(JwtAuthGuard)
+  @Post(':id/comments')
+  async createComment(
+    @Request() req: any,
+    @Param('id') postId: string,
+    @Body() body: { content?: string },
+  ) {
+    if (!body.content) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Content is required.' },
+      });
+    }
+    return this.postsService.createComment(req.user.sub, postId, body.content);
+  }
+}
diff --git a/apps/backend/src/posts/posts.module.ts b/apps/backend/src/posts/posts.module.ts
new file mode 100644
index 0000000..c8a4a66
--- /dev/null
+++ b/apps/backend/src/posts/posts.module.ts
@@ -0,0 +1,12 @@
+import { Module } from '@nestjs/common';
+import { DatabaseModule } from '../database/database.module';
+import { LeaderboardModule } from '../leaderboard/leaderboard.module';
+import { PostsController } from './posts.controller';
+import { PostsService } from './posts.service';
+
+@Module({
+  imports: [DatabaseModule, LeaderboardModule],
+  controllers: [PostsController],
+  providers: [PostsService],
+})
+export class PostsModule { }
diff --git a/apps/backend/src/posts/posts.service.ts b/apps/backend/src/posts/posts.service.ts
new file mode 100644
index 0000000..2f70e5c
--- /dev/null
+++ b/apps/backend/src/posts/posts.service.ts
@@ -0,0 +1,104 @@
+import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
+import { DRIZZLE } from '../database/database.module';
+import { NodePgDatabase } from 'drizzle-orm/node-postgres';
+import * as schema from '../../db/schema';
+import { eq } from 'drizzle-orm';
+import { LeaderboardService, calculateScoreHelper } from '../leaderboard/leaderboard.service';
+
+@Injectable()
+export class PostsService {
+  constructor(
+    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
+    private readonly leaderboardService: LeaderboardService,
+  ) { }
+
+  private readonly buzzwords = [
+    'synergy', 'paradigm', 'bandwidth', 'leverage', 'monetize', 'disruptive', 'deliverables',
+    'kpi', 'okr', 'cloud-native', 'game-changer', 'circle back', 'touch base',
+    'low-hanging fruit', 'deep dive', 'microservices', 'ecosystem', 'scalability', 'scale',
+    'pivoting', 'pivot'
+  ];
+
+  private countBuzzwords(text: string): number {
+    if (!text) return 0;
+    const lower = text.toLowerCase();
+    let count = 0;
+    for (const word of this.buzzwords) {
+      let pos = lower.indexOf(word);
+      while (pos !== -1) {
+        count++;
+        pos = lower.indexOf(word, pos + word.length);
+      }
+    }
+    return count;
+  }
+
+  async createPost(authorId: string, title: string, content: string) {
+    if (title.length < 10 || this.countBuzzwords(title) < 2) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'Your title lacks sufficient synergy. Please leverage additional paradigms.' },
+      });
+    }
+
+    if (content.length < 50 || this.countBuzzwords(content) < 3) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: 'This explanation is dangerously legible. Inject more synergy.' },
+      });
+    }
+
+    const score = calculateScoreHelper(content);
+
+    const [newPost] = await this.db.insert(schema.posts).values({
+      title,
+      content,
+      wastedCalories: score,
+      authorId,
+    }).returning();
+
+    await this.leaderboardService.broadcastUpdate();
+
+    return {
+      success: true,
+      data: newPost,
+    };
+  }
+
+  async createComment(authorId: string, postId: string, content: string) {
+    const [post] = await this.db
+      .select()
+      .from(schema.posts)
+      .where(eq(schema.posts.id, postId));
+
+    if (!post) {
+      throw new NotFoundException({
+        success: false,
+        error: { message: 'Post not found.' },
+      });
+    }
+
+    if (content.length <= post.content.length) {
+      throw new BadRequestException({
+        success: false,
+        error: { message: `Your solution has insufficient volume. It must strictly exceed the original post's length of ${post.content.length} characters.` },
+      });
+    }
+
+    const score = calculateScoreHelper(content);
+
+    const [newComment] = await this.db.insert(schema.comments).values({
+      postId,
+      content,
+      wastedCalories: score,
+      authorId,
+    }).returning();
+
+    await this.leaderboardService.broadcastUpdate();
+
+    return {
+      success: true,
+      data: newComment,
+    };
+  }
+}
diff --git a/apps/frontend/src/app/actions/leaderboard.ts b/apps/frontend/src/app/actions/leaderboard.ts
index 1d7eb17..0c1da4f 100644
--- a/apps/frontend/src/app/actions/leaderboard.ts
+++ b/apps/frontend/src/app/actions/leaderboard.ts
@@ -12,6 +12,19 @@ export interface LeaderboardPost {
     username: string;
     avatar: string;
   };
+  comments?: Array<{
+    id: string;
+    postId: string;
+    content: string;
+    wastedCalories: number;
+    createdAt: string;
+    updatedAt: string;
+    author: {
+      id: string;
+      username: string;
+      avatar: string;
+    };
+  }>;
 }
 
 export type ActionResponse<T> = {
diff --git a/apps/frontend/src/app/actions/posts.ts b/apps/frontend/src/app/actions/posts.ts
new file mode 100644
index 0000000..5de9da7
--- /dev/null
+++ b/apps/frontend/src/app/actions/posts.ts
@@ -0,0 +1,90 @@
+'use server';
+
+import { cookies } from 'next/headers';
+import { ActionResponse } from './auth';
+
+const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
+
+export async function actionCreatePost(
+  title: string,
+  content: string
+): Promise<ActionResponse<any>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'You must be authenticated to propose a paradigm. Log in first!' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/posts`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+      body: JSON.stringify({ title, content }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Failed to submit post.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Network error occurred while proposing paradigm.' },
+    };
+  }
+}
+
+export async function actionCreateComment(
+  postId: string,
+  content: string
+): Promise<ActionResponse<any>> {
+  const cookieStore = await cookies();
+  const tokenObj = cookieStore.get('token');
+  const token = tokenObj?.value;
+
+  if (!token) {
+    return {
+      success: false,
+      error: { message: 'You must be authenticated to solve a problem. Log in first!' },
+    };
+  }
+
+  try {
+    const res = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        Authorization: `Bearer ${token}`,
+      },
+      body: JSON.stringify({ content }),
+    });
+
+    const data = await res.json();
+    if (!res.ok) {
+      return {
+        success: false,
+        error: { message: data.error?.message || 'Failed to submit comment.' },
+      };
+    }
+
+    return { success: true, data: data.data };
+  } catch (err) {
+    return {
+      success: false,
+      error: { message: 'Network error occurred while submitting solution.' },
+    };
+  }
+}
diff --git a/apps/frontend/src/app/page.module.css b/apps/frontend/src/app/page.module.css
index e5c1a4a..802bb56 100644
--- a/apps/frontend/src/app/page.module.css
+++ b/apps/frontend/src/app/page.module.css
@@ -133,6 +133,12 @@
   text-decoration: underline;
 }
 
+.formSection {
+  max-width: 800px;
+  width: 100%;
+  margin: 0 auto;
+}
+
 @media (max-width: 640px) {
   .header {
     padding: 1rem;
diff --git a/apps/frontend/src/app/page.tsx b/apps/frontend/src/app/page.tsx
index 78f83eb..ddbbbb0 100644
--- a/apps/frontend/src/app/page.tsx
+++ b/apps/frontend/src/app/page.tsx
@@ -3,6 +3,7 @@
 import React, { useEffect, useTransition } from 'react';
 import Link from 'next/link';
 import LeaderboardGrid from '../domains/leaderboard/components/LeaderboardGrid';
+import ProposeParadigmForm from '../domains/leaderboard/components/ProposeParadigmForm';
 import { useAuthStore } from '../core/store/useAuthStore';
 import { actionGetMe } from './actions/auth';
 import styles from './page.module.css';
@@ -52,6 +53,10 @@ export default function HomePage() {
           </p>
         </section>
 
+        <section className={styles.formSection}>
+          <ProposeParadigmForm currentUser={user} />
+        </section>
+
         <section className={styles.leaderboardSection}>
           <LeaderboardGrid />
         </section>
diff --git a/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css b/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css
new file mode 100644
index 0000000..fb9893e
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/CommentSection.module.css
@@ -0,0 +1,153 @@
+.commentsContainer {
+  background-color: #f8fafc;
+  border-top: 1px solid #e2e8f0;
+  padding: 1.5rem 2rem;
+  display: flex;
+  flex-direction: column;
+  gap: 1.25rem;
+}
+
+.commentsHeader {
+  font-family: var(--font-heading);
+  font-weight: 700;
+  font-size: 1rem;
+  color: #334155;
+  margin: 0 0 0.25rem 0;
+}
+
+.commentsList {
+  display: flex;
+  flex-direction: column;
+  gap: 1rem;
+}
+
+.commentRow {
+  display: flex;
+  gap: 1rem;
+  background: #ffffff;
+  padding: 1rem;
+  border: 1px solid #e2e8f0;
+  border-radius: 12px;
+  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
+}
+
+.commentAvatar {
+  font-size: 1.25rem;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  width: 30px;
+  height: 30px;
+  background: #f8fafc;
+  border: 1px solid #e2e8f0;
+  border-radius: 50%;
+  flex-shrink: 0;
+}
+
+.commentBody {
+  display: flex;
+  flex-direction: column;
+  gap: 0.25rem;
+  flex: 1;
+}
+
+.commentMeta {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+}
+
+.commentAuthor {
+  font-weight: 600;
+  font-size: 0.85rem;
+  color: #334155;
+}
+
+.commentCalories {
+  font-family: var(--font-heading);
+  font-weight: 700;
+  font-size: 0.85rem;
+  color: hsl(220, 90%, 50%);
+}
+
+.commentText {
+  font-size: 0.9rem;
+  color: #475569;
+  margin: 0;
+  white-space: pre-wrap;
+  line-height: 1.4;
+}
+
+.noComments {
+  font-size: 0.9rem;
+  color: #94a3b8;
+  font-style: italic;
+  margin: 0;
+  padding: 0.5rem 0;
+}
+
+.newCommentForm {
+  border-top: 1px dashed #cbd5e1;
+  padding-top: 1.25rem;
+  display: flex;
+  flex-direction: column;
+  gap: 1rem;
+}
+
+.formTitle {
+  font-family: var(--font-heading);
+  font-weight: 700;
+  font-size: 0.9rem;
+  color: #475569;
+  margin: 0;
+}
+
+.submitBtn {
+  font-family: var(--font-heading);
+  font-size: 0.9rem;
+  font-weight: 700;
+  padding: 0.6rem 1.2rem;
+  border-radius: 8px;
+  cursor: pointer;
+  background: hsl(220, 90%, 50%);
+  color: #ffffff;
+  border: none;
+  align-self: flex-start;
+  transition: all 0.2s ease;
+  display: flex;
+  align-items: center;
+  gap: 0.5rem;
+}
+
+.submitBtn:hover:not(:disabled) {
+  background: #1d4ed8;
+  transform: translateY(-1px);
+}
+
+.submitBtn:disabled {
+  background: #cbd5e1;
+  color: #94a3b8;
+  cursor: not-allowed;
+}
+
+.submitError {
+  color: #ef4444;
+  font-size: 0.85rem;
+}
+
+.authPrompt {
+  border-top: 1px dashed #cbd5e1;
+  padding-top: 1rem;
+  font-size: 0.875rem;
+  color: #64748b;
+}
+
+.authLink {
+  color: hsl(220, 90%, 50%);
+  font-weight: 600;
+  text-decoration: none;
+}
+
+.authLink:hover {
+  text-decoration: underline;
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
new file mode 100644
index 0000000..46cea38
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
@@ -0,0 +1,118 @@
+'use client';
+
+import React, { useState } from 'react';
+import Link from 'next/link';
+import HostileInput from './HostileInput';
+import { LeaderboardPost } from '../../../app/actions/leaderboard';
+import { UserProfile } from '../../../app/actions/auth';
+import { actionCreateComment } from '../../../app/actions/posts';
+import styles from './CommentSection.module.css';
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
+interface CommentSectionProps {
+  post: LeaderboardPost;
+  currentUser: UserProfile | null;
+}
+
+export default function CommentSection({ post, currentUser }: CommentSectionProps) {
+  const [commentText, setCommentText] = useState('');
+  const [hasError, setHasError] = useState(false);
+  const [isSubmitting, setIsSubmitting] = useState(false);
+  const [submitError, setSubmitError] = useState<string | null>(null);
+
+  const comments = post.comments || [];
+
+  const handleSubmit = async (e: React.FormEvent) => {
+    e.preventDefault();
+    if (hasError || !commentText.trim()) return;
+
+    setIsSubmitting(true);
+    setSubmitError(null);
+
+    const res = await actionCreateComment(post.id, commentText);
+
+    setIsSubmitting(false);
+
+    if (res.success) {
+      setCommentText('');
+      setHasError(false);
+    } else {
+      setSubmitError(res.error?.message || 'Failed to submit solution.');
+    }
+  };
+
+  const isButtonDisabled = isSubmitting || hasError || !commentText.trim();
+
+  return (
+    <div className={styles.commentsContainer} onClick={(e) => e.stopPropagation()}>
+      <h3 className={styles.commentsHeader}>Proposed Solutions ({comments.length})</h3>
+
+      <div className={styles.commentsList}>
+        {comments.length === 0 ? (
+          <p className={styles.noComments}>No solutions proposed yet. Propose a solution below if you dare.</p>
+        ) : (
+          comments.map((comment) => (
+            <div key={comment.id} className={styles.commentRow}>
+              <span className={styles.commentAvatar} role="img" aria-label={comment.author.avatar}>
+                {AVATAR_MAP[comment.author.avatar] || '👤'}
+              </span>
+              <div className={styles.commentBody}>
+                <div className={styles.commentMeta}>
+                  <span className={styles.commentAuthor}>{comment.author.username}</span>
+                  <span className={styles.commentCalories}>{comment.wastedCalories} kcal wasted</span>
+                </div>
+                <p className={styles.commentText}>{comment.content}</p>
+              </div>
+            </div>
+          ))
+        )}
+      </div>
+
+      {currentUser ? (
+        <form onSubmit={handleSubmit} className={styles.newCommentForm}>
+          <h4 className={styles.formTitle}>Propose an Overengineered Solution</h4>
+          <HostileInput
+            type="textarea"
+            id={`comment-input-${post.id}`}
+            value={commentText}
+            onChange={setCommentText}
+            placeholder="Type your convoluted solution here... It must be strictly longer than the original post."
+            validationType="comment"
+            originalPostLength={post.content.length}
+            onErrorChange={setHasError}
+            label="Solution Comment Content"
+            hideLabelVisually={true}
+          />
+          {submitError && (
+            <div className={styles.submitError} role="alert">
+              ⚠️ {submitError}
+            </div>
+          )}
+          <button
+            type="submit"
+            className={styles.submitBtn}
+            disabled={isButtonDisabled}
+          >
+            {isSubmitting ? 'Submitting Solution...' : 'Submit Solution'}
+          </button>
+        </form>
+      ) : (
+        <div className={styles.authPrompt}>
+          Want to propose a solution?{' '}
+          <Link href="/auth" className={styles.authLink}>
+            Sign In
+          </Link>{' '}
+          first.
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/apps/frontend/src/domains/leaderboard/components/HostileInput.module.css b/apps/frontend/src/domains/leaderboard/components/HostileInput.module.css
new file mode 100644
index 0000000..bef38f4
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/HostileInput.module.css
@@ -0,0 +1,101 @@
+.container {
+  display: flex;
+  flex-direction: column;
+  margin-bottom: 1.5rem;
+  width: 100%;
+  position: relative;
+}
+
+.label {
+  font-family: var(--font-heading);
+  font-weight: 600;
+  font-size: 0.9rem;
+  color: #4b5563;
+  margin-bottom: 0.5rem;
+}
+
+.visuallyHidden {
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
+.input,
+.textarea {
+  width: 100%;
+  padding: 0.75rem 1rem;
+  border: 1px solid #d1d5db;
+  border-radius: 0.5rem;
+  background-color: #f9fafb;
+  color: var(--color-text);
+  font-family: var(--font-body);
+  font-size: 0.95rem;
+  outline: none;
+  transition: border-color 0.2s ease, box-shadow 0.2s ease;
+}
+
+.input:focus,
+.textarea:focus {
+  border-color: var(--color-primary, #3b82f6);
+  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
+  background-color: #ffffff;
+}
+
+.textarea {
+  min-height: 120px;
+  resize: vertical;
+}
+
+/* Error state - Penalty Red */
+.inputError,
+.textareaError {
+  border-color: #ef4444 !important;
+  background-color: #fef2f2;
+}
+
+.inputError:focus,
+.textareaError:focus {
+  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
+}
+
+.errorMessage {
+  color: #ef4444;
+  font-size: 0.825rem;
+  margin-top: 0.35rem;
+  display: flex;
+  align-items: center;
+  gap: 0.25rem;
+  font-family: var(--font-body);
+  animation: slideIn 0.2s ease;
+}
+
+@keyframes slideIn {
+  from {
+    opacity: 0;
+    transform: translateY(-4px);
+  }
+
+  to {
+    opacity: 1;
+    transform: translateY(0);
+  }
+}
+
+/* prefers-reduced-motion fallback */
+@media (prefers-reduced-motion: reduce) {
+
+  .input,
+  .textarea {
+    transition: none !important;
+  }
+
+  .errorMessage {
+    animation: none !important;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/leaderboard/components/HostileInput.tsx b/apps/frontend/src/domains/leaderboard/components/HostileInput.tsx
new file mode 100644
index 0000000..b408e11
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/HostileInput.tsx
@@ -0,0 +1,144 @@
+'use client';
+
+import React, { useState, useEffect } from 'react';
+import styles from './HostileInput.module.css';
+
+const buzzwords = [
+  'synergy', 'paradigm', 'bandwidth', 'leverage', 'monetize', 'disruptive', 'deliverables',
+  'kpi', 'okr', 'cloud-native', 'game-changer', 'circle back', 'touch base',
+  'low-hanging fruit', 'deep dive', 'microservices', 'ecosystem', 'scalability', 'scale',
+  'pivoting', 'pivot'
+];
+
+interface HostileInputProps {
+  type: 'text' | 'textarea';
+  value: string;
+  onChange: (val: string) => void;
+  placeholder?: string;
+  id: string;
+  validationType: 'title' | 'content' | 'comment';
+  originalPostLength?: number;
+  onErrorChange?: (hasError: boolean) => void;
+  label: string;
+  hideLabelVisually?: boolean;
+}
+
+export default function HostileInput({
+  type,
+  value,
+  onChange,
+  placeholder,
+  id,
+  validationType,
+  originalPostLength,
+  onErrorChange,
+  label,
+  hideLabelVisually = false,
+}: HostileInputProps) {
+  const [error, setError] = useState<string | null>(null);
+  const [isTouched, setIsTouched] = useState(false);
+
+  const countBuzzwords = (val: string) => {
+    const lower = val.toLowerCase();
+    let count = 0;
+    for (const word of buzzwords) {
+      let pos = lower.indexOf(word);
+      while (pos !== -1) {
+        count++;
+        pos = lower.indexOf(word, pos + word.length);
+      }
+    }
+    return count;
+  };
+
+  const validate = (val: string): string | null => {
+    if (!val) {
+      return 'This field is required. Do not leave it empty.';
+    }
+
+    if (validationType === 'title') {
+      if (val.length < 10 || countBuzzwords(val) < 2) {
+        return 'Your title lacks sufficient synergy. Please leverage additional paradigms.';
+      }
+    } else if (validationType === 'content') {
+      if (val.length < 50 || countBuzzwords(val) < 3) {
+        return 'This explanation is dangerously legible. Inject more synergy.';
+      }
+    } else if (validationType === 'comment') {
+      const minLength = originalPostLength ?? 0;
+      if (val.length <= minLength) {
+        return `Your solution has insufficient volume. It must strictly exceed the original post's length of ${minLength} characters.`;
+      }
+    }
+
+    return null;
+  };
+
+  useEffect(() => {
+    if (isTouched) {
+      const errMsg = validate(value);
+      setError(errMsg);
+      if (onErrorChange) {
+        onErrorChange(!!errMsg);
+      }
+    } else {
+      const errMsg = validate(value);
+      if (onErrorChange) {
+        onErrorChange(!!errMsg);
+      }
+    }
+  }, [value, isTouched, originalPostLength]);
+
+  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
+    onChange(e.target.value);
+  };
+
+  const handleBlur = () => {
+    setIsTouched(true);
+  };
+
+  const hasError = !!error;
+
+  return (
+    <div className={styles.container}>
+      <label
+        htmlFor={id}
+        className={hideLabelVisually ? styles.visuallyHidden : styles.label}
+      >
+        {label}
+      </label>
+
+      {type === 'text' ? (
+        <input
+          type="text"
+          id={id}
+          value={value}
+          onChange={handleChange}
+          onBlur={handleBlur}
+          placeholder={placeholder}
+          className={`${styles.input} ${hasError ? styles.inputError : ''}`}
+          aria-invalid={hasError}
+          aria-describedby={hasError ? `${id}-error` : undefined}
+        />
+      ) : (
+        <textarea
+          id={id}
+          value={value}
+          onChange={handleChange}
+          onBlur={handleBlur}
+          placeholder={placeholder}
+          className={`${styles.textarea} ${hasError ? styles.textareaError : ''}`}
+          aria-invalid={hasError}
+          aria-describedby={hasError ? `${id}-error` : undefined}
+        />
+      )}
+
+      {hasError && (
+        <div id={`${id}-error`} className={styles.errorMessage} role="alert">
+          <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
+          {error}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
index 108f720..9019beb 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css
@@ -76,29 +76,35 @@
   flex-direction: column;
 }
 
-.postRow {
-  display: grid;
-  grid-template-columns: 80px 180px 1fr 180px;
+.postRowWrapper {
+  display: flex;
+  flex-direction: column;
   border-bottom: 1px solid #f1f5f9;
-  padding: 1.5rem 2rem;
-  align-items: center;
-  transition: background-color 0.2s ease, transform 0.2s ease;
   background: #ffffff;
 }
 
-.postRow:last-child {
+.postRowWrapper:last-child {
   border-bottom: none;
 }
 
+.postRow {
+  display: grid;
+  grid-template-columns: 80px 180px 1fr 180px;
+  padding: 1.5rem 2rem;
+  align-items: center;
+  cursor: pointer;
+  transition: background-color 0.2s ease;
+}
+
 .postRow:hover {
   background-color: #f8fafc;
 }
 
-.firstPlace {
+.firstPlace .postRow {
   background-color: #fffbeb;
 }
 
-.firstPlace:hover {
+.firstPlace .postRow:hover {
   background-color: #fef3c7;
 }
 
diff --git a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
index f39e865..62b4c96 100644
--- a/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.tsx
@@ -4,6 +4,8 @@ import React, { useState, useEffect, useTransition } from 'react';
 import { actionGetLeaderboard, LeaderboardPost } from '../../../app/actions/leaderboard';
 import { socket } from '../../../core/api/socket.client';
 import GoldenRaspberryBadge from './GoldenRaspberryBadge';
+import CommentSection from './CommentSection';
+import { useAuthStore } from '../../../core/store/useAuthStore';
 import styles from './LeaderboardGrid.module.css';
 
 const AVATAR_MAP: Record<string, string> = {
@@ -18,7 +20,9 @@ const AVATAR_MAP: Record<string, string> = {
 export default function LeaderboardGrid() {
   const [posts, setPosts] = useState<LeaderboardPost[]>([]);
   const [error, setError] = useState<string | null>(null);
+  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
+  const currentUser = useAuthStore((state) => state.user);
 
   useEffect(() => {
     // 1. Fetch initial leaderboard data
@@ -87,31 +91,52 @@ export default function LeaderboardGrid() {
       <div className={styles.postsList}>
         {posts.map((post, index) => {
           const isFirst = index === 0;
+          const isExpanded = expandedPostId === post.id;
           return (
-            <div key={post.id} className={`${styles.postRow} ${isFirst ? styles.firstPlace : ''}`}>
-              <div className={styles.colRank}>
-                <span className={styles.rankBadge}>{index + 1}</span>
-              </div>
-              <div className={styles.colAuthor}>
-                <span className={styles.authorAvatar} role="img" aria-label={post.author.avatar}>
-                  {AVATAR_MAP[post.author.avatar] || '👤'}
-                </span>
-                <span className={styles.authorName}>{post.author.username}</span>
-              </div>
-              <div className={styles.colTitle}>
-                <div className={styles.postTitleText}>{post.title}</div>
-                <p className={styles.postSnippet}>{post.content}</p>
-              </div>
-              <div className={styles.colScore}>
-                <div className={styles.scoreContainer}>
-                  <span className={styles.scoreValue}>{post.wastedCalories} kcal</span>
-                  {isFirst && (
-                    <div className={styles.badgeWrapper}>
-                      <GoldenRaspberryBadge />
-                    </div>
-                  )}
+            <div
+              key={post.id}
+              className={`${styles.postRowWrapper} ${isFirst ? styles.firstPlace : ''}`}
+            >
+              <div
+                className={styles.postRow}
+                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
+                role="button"
+                aria-expanded={isExpanded}
+                tabIndex={0}
+                onKeyDown={(e) => {
+                  if (e.key === 'Enter' || e.key === ' ') {
+                    e.preventDefault();
+                    setExpandedPostId(isExpanded ? null : post.id);
+                  }
+                }}
+              >
+                <div className={styles.colRank}>
+                  <span className={styles.rankBadge}>{index + 1}</span>
+                </div>
+                <div className={styles.colAuthor}>
+                  <span className={styles.authorAvatar} role="img" aria-label={post.author.avatar}>
+                    {AVATAR_MAP[post.author.avatar] || '👤'}
+                  </span>
+                  <span className={styles.authorName}>{post.author.username}</span>
+                </div>
+                <div className={styles.colTitle}>
+                  <div className={styles.postTitleText}>{post.title}</div>
+                  <p className={styles.postSnippet}>{post.content}</p>
+                </div>
+                <div className={styles.colScore}>
+                  <div className={styles.scoreContainer}>
+                    <span className={styles.scoreValue}>{post.wastedCalories} kcal</span>
+                    {isFirst && (
+                      <div className={styles.badgeWrapper}>
+                        <GoldenRaspberryBadge />
+                      </div>
+                    )}
+                  </div>
                 </div>
               </div>
+              {isExpanded && (
+                <CommentSection post={post} currentUser={currentUser} />
+              )}
             </div>
           );
         })}
diff --git a/apps/frontend/src/domains/leaderboard/components/ProposeParadigmForm.module.css b/apps/frontend/src/domains/leaderboard/components/ProposeParadigmForm.module.css
new file mode 100644
index 0000000..06e32b3
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/ProposeParadigmForm.module.css
@@ -0,0 +1,111 @@
+.card {
+  background: #ffffff;
+  border: 1px solid #e2e8f0;
+  border-radius: 16px;
+  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
+  padding: 2rem;
+  margin-bottom: 2rem;
+  font-family: var(--font-body);
+}
+
+.title {
+  font-family: var(--font-heading);
+  font-weight: 800;
+  font-size: 1.5rem;
+  color: #0f172a;
+  margin: 0 0 0.5rem 0;
+}
+
+.subtitle {
+  font-size: 0.95rem;
+  color: #64748b;
+  margin: 0 0 1.5rem 0;
+  line-height: 1.5;
+}
+
+.form {
+  display: flex;
+  flex-direction: column;
+  gap: 1.25rem;
+}
+
+.submitBtn {
+  font-family: var(--font-heading);
+  font-size: 0.95rem;
+  font-weight: 700;
+  padding: 0.75rem 1.5rem;
+  border-radius: 10px;
+  cursor: pointer;
+  background: hsl(220, 90%, 50%);
+  color: #ffffff;
+  border: none;
+  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
+  align-self: flex-start;
+  transition: all 0.2s ease;
+}
+
+.submitBtn:hover:not(:disabled) {
+  background: #1d4ed8;
+  transform: translateY(-1px);
+}
+
+.submitBtn:disabled {
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
+  margin-top: 1rem;
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
+.unauthCard {
+  background: #f8fafc;
+  border: 1px dashed #cbd5e1;
+  border-radius: 16px;
+  padding: 2rem;
+  text-align: center;
+  margin-bottom: 2rem;
+  font-family: var(--font-body);
+}
+
+.unauthText {
+  color: #475569;
+  font-size: 1rem;
+  margin: 0 0 1rem 0;
+}
+
+.authLink {
+  display: inline-block;
+  font-family: var(--font-heading);
+  font-size: 0.95rem;
+  font-weight: 700;
+  padding: 0.6rem 1.5rem;
+  background: hsl(220, 90%, 50%);
+  color: #ffffff;
+  border-radius: 10px;
+  text-decoration: none;
+  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
+  transition: all 0.2s ease;
+}
+
+.authLink:hover {
+  background: #1d4ed8;
+  transform: translateY(-1px);
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/leaderboard/components/ProposeParadigmForm.tsx b/apps/frontend/src/domains/leaderboard/components/ProposeParadigmForm.tsx
new file mode 100644
index 0000000..b2a022e
--- /dev/null
+++ b/apps/frontend/src/domains/leaderboard/components/ProposeParadigmForm.tsx
@@ -0,0 +1,114 @@
+'use client';
+
+import React, { useState } from 'react';
+import Link from 'next/link';
+import HostileInput from './HostileInput';
+import { UserProfile } from '../../../app/actions/auth';
+import { actionCreatePost } from '../../../app/actions/posts';
+import styles from './ProposeParadigmForm.module.css';
+
+interface ProposeParadigmFormProps {
+  currentUser: UserProfile | null;
+}
+
+export default function ProposeParadigmForm({ currentUser }: ProposeParadigmFormProps) {
+  const [title, setTitle] = useState('');
+  const [content, setContent] = useState('');
+  const [titleError, setTitleError] = useState(false);
+  const [contentError, setContentError] = useState(false);
+  const [isSubmitting, setIsSubmitting] = useState(false);
+  const [submitError, setSubmitError] = useState<string | null>(null);
+  const [submitSuccess, setSubmitSuccess] = useState(false);
+
+  const handleSubmit = async (e: React.FormEvent) => {
+    e.preventDefault();
+    if (titleError || contentError || !title.trim() || !content.trim()) return;
+
+    setIsSubmitting(true);
+    setSubmitError(null);
+    setSubmitSuccess(false);
+
+    const res = await actionCreatePost(title, content);
+
+    setIsSubmitting(false);
+
+    if (res.success) {
+      setTitle('');
+      setContent('');
+      setTitleError(false);
+      setContentError(false);
+      setSubmitSuccess(true);
+      setTimeout(() => setSubmitSuccess(false), 5000);
+    } else {
+      setSubmitError(res.error?.message || 'Failed to propose paradigm.');
+    }
+  };
+
+  const isButtonDisabled = isSubmitting || titleError || contentError || !title.trim() || !content.trim();
+
+  if (!currentUser) {
+    return (
+      <div className={styles.unauthCard}>
+        <p className={styles.unauthText}>
+          Want to share your own overengineered masterpiece and log some wasted calories?
+        </p>
+        <Link href="/auth" className={styles.authLink}>
+          Sign In to Propose a Paradigm
+        </Link>
+      </div>
+    );
+  }
+
+  return (
+    <div className={styles.card}>
+      <h2 className={styles.title}>Propose a Paradigm</h2>
+      <p className={styles.subtitle}>
+        Share your most convoluted, scale-ready ideas with the team. Real-time synergy will be calculated.
+      </p>
+
+      <form onSubmit={handleSubmit} className={styles.form}>
+        <HostileInput
+          type="text"
+          id="post-title-input"
+          value={title}
+          onChange={setTitle}
+          placeholder="e.g. leverage synergy scale paradigm"
+          validationType="title"
+          onErrorChange={setTitleError}
+          label="Paradigm Title"
+        />
+
+        <HostileInput
+          type="textarea"
+          id="post-content-input"
+          value={content}
+          onChange={setContent}
+          placeholder="e.g. Pivot our cloud-native microservices ecosystem to touch base on deliverables..."
+          validationType="content"
+          onErrorChange={setContentError}
+          label="Convoluted Explanation"
+        />
+
+        {submitError && (
+          <div className={`${styles.message} ${styles.error}`} role="alert">
+            ⚠️ {submitError}
+          </div>
+        )}
+
+        {submitSuccess && (
+          <div className={`${styles.message} ${styles.success}`} role="alert">
+            🎉 Paradigm successfully proposed! The leaderboard will now reflect your absolute waste of calories.
+          </div>
+        )}
+
+        <button
+          type="submit"
+          className={styles.submitBtn}
+          disabled={isButtonDisabled}
+        >
+          {isSubmitting ? 'Proposing Paradigm...' : 'Propose Paradigm'}
+        </button>
+      </form>
+    </div>
+  );
+}
diff --git a/tests/e2e/posts.spec.ts b/tests/e2e/posts.spec.ts
new file mode 100644
index 0000000..3e29558
--- /dev/null
+++ b/tests/e2e/posts.spec.ts
@@ -0,0 +1,83 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Posts & Comments E2E Flow', () => {
+  test.beforeEach(async ({ page }) => {
+    await page.context().clearCookies();
+  });
+
+  test('should validate, submit posts, expand rows, and submit comments', async ({ page }) => {
+    // 1. Visit homepage and verify login prompt for unauthenticated user
+    await page.goto('/');
+    await expect(page.locator('text=Sign In to Propose a Paradigm')).toBeVisible();
+
+    // 2. Go to auth page and register a new user
+    await page.goto('/auth');
+    await expect(page).toHaveURL(/\/auth/);
+    await page.click('button:has-text("Register now")');
+    const uniqueUsername = `testuser_${Date.now()}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+
+    // Wait for registration to complete and redirect to profile page
+    await expect(page).toHaveURL(/\/profile/);
+    await expect(page.locator('h1')).toHaveText(uniqueUsername);
+
+    // After registration, redirected to /profile. Go back to homepage.
+    await page.goto('/');
+
+    // 3. Verify Propose a Paradigm form is now visible
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).toBeVisible();
+
+    // 4. Test real-time validation for Title
+    const titleInput = page.locator('#post-title-input');
+    await titleInput.fill('Short');
+    await titleInput.blur();
+    await expect(page.locator('text=Your title lacks sufficient synergy. Please leverage additional paradigms.')).toBeVisible();
+
+    // Fill valid title
+    await titleInput.fill('Leverage synergy paradigm');
+    await expect(page.locator('text=Your title lacks sufficient synergy. Please leverage additional paradigms.')).not.toBeVisible();
+
+    // 5. Test real-time validation for Content
+    const contentInput = page.locator('#post-content-input');
+    await contentInput.fill('Short content.');
+    await contentInput.blur();
+    await expect(page.locator('text=This explanation is dangerously legible. Inject more synergy.')).toBeVisible();
+
+    // Fill valid content (must contain 3 buzzwords and be >= 50 chars)
+    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
+    await contentInput.fill(validContent);
+    await expect(page.locator('text=This explanation is dangerously legible. Inject more synergy.')).not.toBeVisible();
+
+    // 6. Submit Post
+    await page.click('button:has-text("Propose Paradigm")');
+    await expect(page.locator('text=Paradigm successfully proposed!')).toBeVisible();
+
+    // 7. Verify post is in leaderboard and click it to expand
+    const postRow = page.locator(`text=Leverage synergy paradigm`);
+    await expect(postRow).toBeVisible();
+    await postRow.click();
+
+    // 8. Verify comments section expanded
+    await expect(page.locator('h3:has-text("Proposed Solutions")')).toBeVisible();
+    await expect(page.locator('text=No solutions proposed yet.')).toBeVisible();
+
+    // 9. Test comment validation
+    const commentInput = page.locator(`textarea[id^="comment-input-"]`);
+    await commentInput.fill('Too short comment');
+    await commentInput.blur();
+    await expect(page.locator('text=Your solution has insufficient volume. It must strictly exceed the original post')).toBeVisible();
+
+    // Fill valid comment (longer than original post length of 124 characters)
+    const validComment = 'This comment is strictly longer than the original post content to satisfy the length validation. Leverage synergy, paradigm, and scale in our microservices ecosystem!';
+    await commentInput.fill(validComment);
+    await expect(page.locator('text=Your solution has insufficient volume.')).not.toBeVisible();
+
+    // 10. Submit Comment
+    await page.click('button:has-text("Submit Solution")');
+
+    // 11. Verify comment is displayed inline
+    await expect(page.locator(`p:has-text("${validComment}")`)).toBeVisible();
+  });
+});
diff --git a/tests/unit/backend/posts/posts.service.spec.ts b/tests/unit/backend/posts/posts.service.spec.ts
new file mode 100644
index 0000000..2b0f11a
--- /dev/null
+++ b/tests/unit/backend/posts/posts.service.spec.ts
@@ -0,0 +1,145 @@
+import { Test, TestingModule } from '@nestjs/testing';
+import { PostsService } from '../../../../apps/backend/src/posts/posts.service';
+import { DRIZZLE } from '../../../../apps/backend/src/database/database.module';
+import { LeaderboardService } from '../../../../apps/backend/src/leaderboard/leaderboard.service';
+import { BadRequestException, NotFoundException } from '@nestjs/common';
+
+describe('PostsService', () => {
+  let service: PostsService;
+  let dbMock: any;
+  let leaderboardServiceMock: any;
+
+  beforeEach(async () => {
+    dbMock = {
+      insert: jest.fn().mockReturnThis(),
+      values: jest.fn().mockReturnThis(),
+      returning: jest.fn(),
+      select: jest.fn().mockReturnThis(),
+      from: jest.fn().mockReturnThis(),
+      where: jest.fn(),
+    };
+
+    leaderboardServiceMock = {
+      broadcastUpdate: jest.fn().mockResolvedValue(undefined),
+    };
+
+    const module: TestingModule = await Test.createTestingModule({
+      providers: [
+        PostsService,
+        {
+          provide: DRIZZLE,
+          useValue: dbMock,
+        },
+        {
+          provide: LeaderboardService,
+          useValue: leaderboardServiceMock,
+        },
+      ],
+    }).compile();
+
+    service = module.get<PostsService>(PostsService);
+  });
+
+  describe('createPost', () => {
+    it('should successfully create a post when inputs are valid', async () => {
+      const mockPost = {
+        id: 'post-123',
+        title: 'Leverage synergy paradigm',
+        content: 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.',
+        wastedCalories: 100,
+        authorId: 'user-123',
+      };
+
+      dbMock.returning.mockResolvedValue([mockPost]);
+
+      const result = await service.createPost(
+        'user-123',
+        'Leverage synergy paradigm',
+        'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.',
+      );
+
+      expect(dbMock.insert).toHaveBeenCalled();
+      expect(dbMock.values).toHaveBeenCalled();
+      expect(dbMock.returning).toHaveBeenCalled();
+      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data).toEqual(mockPost);
+    });
+
+    it('should throw BadRequestException if title has less than 10 characters', async () => {
+      await expect(
+        service.createPost('user-123', 'Short', 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.'),
+      ).rejects.toThrow(BadRequestException);
+    });
+
+    it('should throw BadRequestException if title lacks buzzwords', async () => {
+      await expect(
+        service.createPost('user-123', 'This is a normal title without jargon', 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.'),
+      ).rejects.toThrow(BadRequestException);
+    });
+
+    it('should throw BadRequestException if content is less than 50 characters', async () => {
+      await expect(
+        service.createPost('user-123', 'Leverage synergy paradigm', 'Short content.'),
+      ).rejects.toThrow(BadRequestException);
+    });
+
+    it('should throw BadRequestException if content lacks buzzwords', async () => {
+      await expect(
+        service.createPost('user-123', 'Leverage synergy paradigm', 'This is a long content that contains absolutely zero jargon words and only normal everyday words.'),
+      ).rejects.toThrow(BadRequestException);
+    });
+  });
+
+  describe('createComment', () => {
+    it('should successfully create a comment when inputs are valid', async () => {
+      const mockPost = {
+        id: 'post-123',
+        content: 'Short post content.',
+      };
+      const mockComment = {
+        id: 'comment-123',
+        postId: 'post-123',
+        content: 'This comment is strictly longer than the post content. Synergy, leverage, paradigm, scale.',
+        wastedCalories: 50,
+        authorId: 'user-123',
+      };
+
+      dbMock.where.mockResolvedValue([mockPost]);
+      dbMock.returning.mockResolvedValue([mockComment]);
+
+      const result = await service.createComment(
+        'user-123',
+        'post-123',
+        'This comment is strictly longer than the post content. Synergy, leverage, paradigm, scale.',
+      );
+
+      expect(dbMock.select).toHaveBeenCalled();
+      expect(dbMock.insert).toHaveBeenCalled();
+      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
+      expect(result.success).toBe(true);
+      expect(result.data).toEqual(mockComment);
+    });
+
+    it('should throw NotFoundException if post does not exist', async () => {
+      dbMock.where.mockResolvedValue([]);
+
+      await expect(
+        service.createComment('user-123', 'non-existent', 'Comment content that is long enough.'),
+      ).rejects.toThrow(NotFoundException);
+    });
+
+    it('should throw BadRequestException if comment is not longer than post content', async () => {
+      const mockPost = {
+        id: 'post-123',
+        content: 'This is post content.',
+      };
+
+      dbMock.where.mockResolvedValue([mockPost]);
+
+      await expect(
+        service.createComment('user-123', 'post-123', 'Short.'),
+      ).rejects.toThrow(BadRequestException);
+    });
+  });
+});

```
