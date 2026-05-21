import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { LeaderboardService, calculateScoreHelper } from '../leaderboard/leaderboard.service';

@Injectable()
export class PostsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly leaderboardService: LeaderboardService,
  ) { }

  private readonly buzzwords = [
    'synergy', 'paradigm', 'bandwidth', 'leverage', 'monetize', 'disruptive', 'deliverables',
    'kpi', 'okr', 'cloud-native', 'game-changer', 'circle back', 'touch base',
    'low-hanging fruit', 'deep dive', 'microservices', 'ecosystem', 'scalability', 'scale',
    'pivoting', 'pivot'
  ];

  private countBuzzwords(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    let tempText = text.toLowerCase();
    let count = 0;

    // Sort by length descending to match longer words first (e.g. 'scalability' before 'scale')
    const sortedWords = [...this.buzzwords].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
      // Escape regex special characters
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Require word boundary if starts/ends with alphanumeric
      const startBoundary = /^\w/.test(word) ? '\\b' : '';
      const endBoundary = /\w$/.test(word) ? '\\b' : '';
      const regex = new RegExp(startBoundary + escapedWord + endBoundary, 'gi');

      const matches = tempText.match(regex);
      if (matches) {
        count += matches.length;
        // Replace with spaces of equivalent length to prevent overlap matching
        tempText = tempText.replace(regex, (m) => ' '.repeat(m.length));
      }
    }
    return count;
  }

  async createPost(authorId: string, title: string, content: string) {
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (trimmedTitle.length < 10 || this.countBuzzwords(trimmedTitle) < 2) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Your title lacks sufficient synergy. Please leverage additional paradigms.' },
      });
    }

    if (trimmedContent.length < 50 || this.countBuzzwords(trimmedContent) < 3) {
      throw new BadRequestException({
        success: false,
        error: { message: 'This explanation is dangerously legible. Inject more synergy.' },
      });
    }

    const score = calculateScoreHelper(trimmedContent);

    const [newPost] = await this.db.insert(schema.posts).values({
      title: trimmedTitle,
      content: trimmedContent,
      wastedCalories: score,
      authorId,
    }).returning();

    try {
      await this.leaderboardService.broadcastUpdate();
    } catch (e) {
      console.error('Failed to broadcast leaderboard update after post creation:', e);
    }

    return {
      success: true,
      data: newPost,
    };
  }

  async createComment(authorId: string, postId: string, content: string) {
    const [post] = await this.db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, postId));

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { message: 'Post not found.' },
      });
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (trimmedContent.length <= post.content.length) {
      throw new BadRequestException({
        success: false,
        error: { message: `Your solution has insufficient volume. It must strictly exceed the original post's length of ${post.content.length} characters.` },
      });
    }

    const score = calculateScoreHelper(trimmedContent);

    const [newComment] = await this.db.insert(schema.comments).values({
      postId,
      content: trimmedContent,
      wastedCalories: score,
      authorId,
    }).returning();

    try {
      await this.leaderboardService.broadcastUpdate();
    } catch (e) {
      console.error('Failed to broadcast leaderboard update after comment creation:', e);
    }

    return {
      success: true,
      data: newComment,
    };
  }

  async vote(userId: string, targetId: string, targetType: 'post' | 'comment') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Invalid targetId format. Must be a valid UUID.' },
      });
    }

    if (targetType === 'post') {
      const [post] = await this.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.id, targetId));

      if (!post) {
        throw new NotFoundException({
          success: false,
          error: { message: 'Post not found.' },
        });
      }

      if (post.authorId === userId) {
        throw new BadRequestException({
          success: false,
          error: { message: 'You cannot vote on your own post.' },
        });
      }

      const [updatedPost] = await this.db
        .update(schema.posts)
        .set({ wastedCalories: sql`${schema.posts.wastedCalories} + 50` })
        .where(eq(schema.posts.id, targetId))
        .returning();

      try {
        await this.leaderboardService.broadcastUpdate();
      } catch (e) {
        console.error('Failed to broadcast leaderboard update after post vote:', e);
      }

      return {
        success: true,
        data: updatedPost,
      };
    } else {
      const [comment] = await this.db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.id, targetId));

      if (!comment) {
        throw new NotFoundException({
          success: false,
          error: { message: 'Comment not found.' },
        });
      }

      if (comment.authorId === userId) {
        throw new BadRequestException({
          success: false,
          error: { message: 'You cannot vote on your own comment.' },
        });
      }

      const [updatedComment] = await this.db
        .update(schema.comments)
        .set({ wastedCalories: sql`${schema.comments.wastedCalories} + 50` })
        .where(eq(schema.comments.id, targetId))
        .returning();

      try {
        await this.leaderboardService.broadcastUpdate();
      } catch (e) {
        console.error('Failed to broadcast leaderboard update after comment vote:', e);
      }

      return {
        success: true,
        data: updatedComment,
      };
    }
  }
}
