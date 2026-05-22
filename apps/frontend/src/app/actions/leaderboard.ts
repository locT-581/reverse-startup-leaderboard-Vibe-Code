'use server';

export interface LeaderboardPost {
  id: string;
  title: string;
  content: string;
  wastedCalories: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatar: string;
    isMercyActive: boolean;
    logicViolations: number;
  };
  comments?: Array<{
    id: string;
    postId: string;
    content: string;
    wastedCalories: number;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      username: string;
      avatar: string;
      isMercyActive: boolean;
      logicViolations: number;
    };
  }>;
}

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
};

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

import { extractErrorMessage } from './utils';

export async function actionGetLeaderboard(): Promise<ActionResponse<LeaderboardPost[]>> {
  try {
    const res = await fetch(`${BACKEND_URL}/leaderboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 }, // Ensure dynamic fetching
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: {
          message: extractErrorMessage(data, 'Failed to contact the leaderboard engine. The server is probably taking an unannounced coffee break.'),
          code: data.error?.code || 'BACKEND_ERROR',
        },
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'Failed to contact the leaderboard engine. The server is probably taking a coffee break.',
        code: 'NETWORK_ERROR',
      },
    };
  }
}
