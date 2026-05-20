'use server';

import { cookies } from 'next/headers';

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  wastedCalories: number;
  logicViolations: number;
  createdAt: string;
  updatedAt: string;
}

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function actionRegister(
  username?: string,
  password?: string
): Promise<ActionResponse<{ token: string; user: UserProfile }>> {
  if (!username || !password) {
    return {
      success: false,
      error: { message: 'Username and password are required. Do not make me ask again.' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: { message: data.error?.message || 'Registration failed. The universe is against you.' },
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('token', data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Failed to contact backend. Maybe it does not like you.' },
    };
  }
}

export async function actionLogin(
  username?: string,
  password?: string
): Promise<ActionResponse<{ token: string; user: UserProfile }>> {
  if (!username || !password) {
    return {
      success: false,
      error: { message: 'Username and password are required. Memory issues?' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: { message: data.error?.message || 'Invalid credentials. Password memory failure?' },
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('token', data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Failed to contact backend. Try checking if it is even running.' },
    };
  }
}

export async function actionUpdateProfile(
  username: string,
  avatar: string
): Promise<ActionResponse<UserProfile>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'Unauthorized. Log in first, please.' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, avatar }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: { message: data.error?.message || 'Profile update failed. Try to make a valid request.' },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Failed to update profile. Server did not feel like responding.' },
    };
  }
}

export async function actionLogout(): Promise<ActionResponse<null>> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return { success: true, data: null };
}

export async function actionGetMe(): Promise<ActionResponse<UserProfile>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'No active session.' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: { message: data.error?.message || 'Session verification failed.' },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Could not reach session server.' },
    };
  }
}
