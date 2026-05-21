'use server';

import { cookies } from 'next/headers';
import { ActionResponse } from './auth';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function actionCreatePost(
  title: string,
  content: string
): Promise<ActionResponse<any>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'You must be authenticated to propose a paradigm. Log in first!' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: { message: data.error?.message || 'Failed to submit post.' },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error occurred while proposing paradigm.' },
    };
  }
}

export async function actionCreateComment(
  postId: string,
  content: string
): Promise<ActionResponse<any>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'You must be authenticated to solve a problem. Log in first!' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: { message: data.error?.message || 'Failed to submit comment.' },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error occurred while submitting solution.' },
    };
  }
}
