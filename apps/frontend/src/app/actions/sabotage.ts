'use server';

import { cookies } from 'next/headers';
import { ActionResponse } from './auth';
import { extractErrorMessage } from './utils';

export interface SabotagePack {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  effectType: 'blur' | 'comic_sans' | 'papyrus' | 'deduct_calories';
  createdAt: string;
  updatedAt: string;
}

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function actionGetSabotagePacks(): Promise<ActionResponse<SabotagePack[]>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'You must be authenticated to browse the Sabotage Store. Log in first!' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/sabotage/packs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token');
      }
      return {
        success: false,
        error: { message: extractErrorMessage(data, 'Failed to fetch Sabotage Packs.') },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error occurred while fetching Sabotage Packs.' },
    };
  }
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface UserInventoryItem {
  effectType: 'blur' | 'comic_sans' | 'papyrus' | 'deduct_calories';
  count: number;
}

export async function actionCreateCheckoutSession(packId: string): Promise<ActionResponse<CheckoutSessionResponse>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'You must be authenticated to purchase items.' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/sabotage/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ packId }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token');
      }
      return {
        success: false,
        error: { message: extractErrorMessage(data, 'Failed to create checkout session.') },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error occurred during checkout initiation.' },
    };
  }
}

export async function actionGetUserInventory(): Promise<ActionResponse<UserInventoryItem[]>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'You must be authenticated to check inventory.' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/sabotage/inventory`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token');
      }
      return {
        success: false,
        error: { message: extractErrorMessage(data, 'Failed to fetch inventory.') },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error occurred while fetching inventory.' },
    };
  }
}

export async function actionDeploySabotage(
  postId: string,
  effectType: string
): Promise<ActionResponse<{ newWastedCalories: number }>> {
  const cookieStore = await cookies();
  const tokenObj = cookieStore.get('token');
  const token = tokenObj?.value;

  if (!token) {
    return {
      success: false,
      error: { message: 'You must be authenticated to deploy sabotage.' },
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/sabotage/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ postId, effectType }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token');
      }
      return {
        success: false,
        error: { message: extractErrorMessage(data, 'Failed to deploy sabotage.') },
      };
    }

    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error occurred while deploying sabotage.' },
    };
  }
}
