import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { LeaderboardGateway } from './leaderboard.gateway';

export interface LeaderboardPost {
  id: string;
  title: string;
  content: string;
  wastedCalories: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
}

export function calculateScoreHelper(content: string): number {
  if (!content) return 0;
  let score = 0;

  // 1. Word Count: +5 per word (whitespace-separated)
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  score += words.length * 5;

  // 2. Capitalization Scream: if > 30% of alphabetic characters are uppercase, +50
  const alphabeticChars = content.replace(/[^a-zA-Z]/g, '');
  if (alphabeticChars.length > 0) {
    const uppercaseChars = content.replace(/[^A-Z]/g, '');
    const ratio = uppercaseChars.length / alphabeticChars.length;
    if (ratio > 0.3) {
      score += 50;
    }
  }

  // 3. Over-engineering Penalty: if contains markdown code blocks (```), +100
  if (content.includes('```')) {
    score += 100;
  }

  // 4. Length Modifier: > 1000 chars +150; < 100 chars -50
  const len = content.length;
  if (len > 1000) {
    score += 150;
  } else if (len < 100) {
    score -= 50;
  }

  // 5. Frustration Punctuation: +5 per occurrence of !, ?, or ... (capped at +50)
  let frustrationCount = 0;

  // Count ...
  const dotRegex = /\.\.\./g;
  const dotsMatch = content.match(dotRegex);
  if (dotsMatch) {
    frustrationCount += dotsMatch.length;
  }

  // Count ! and ?
  const puncRegex = /[!?]/g;
  const puncsMatch = content.match(puncRegex);
  if (puncsMatch) {
    frustrationCount += puncsMatch.length;
  }

  score += Math.min(frustrationCount, 10) * 5;

  return score;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(forwardRef(() => LeaderboardGateway))
    private readonly leaderboardGateway: LeaderboardGateway,
  ) { }

  async broadcastUpdate(): Promise<void> {
    if (this.leaderboardGateway && typeof this.leaderboardGateway.broadcastLeaderboard === 'function') {
      await this.leaderboardGateway.broadcastLeaderboard();
    }
  }

  calculateScore(content: string): number {
    return calculateScoreHelper(content);
  }

  async getLeaderboard(): Promise<{ success: boolean; data: LeaderboardPost[] }> {
    const rawPosts = await this.db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        content: schema.posts.content,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        author: {
          id: schema.users.id,
          username: schema.users.username,
          avatar: schema.users.avatar,
        },
      })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id));

    // Calculate score dynamically to ensure strict correctness
    const postsWithScores = rawPosts.map((post) => ({
      ...post,
      wastedCalories: this.calculateScore(post.content),
    }));

    // Sort descending by score, and sub-sort by createdAt descending for stability
    postsWithScores.sort((a, b) => {
      if (b.wastedCalories !== a.wastedCalories) {
        return b.wastedCalories - a.wastedCalories;
      }
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });

    return {
      success: true,
      data: postsWithScores,
    };
  }
}

