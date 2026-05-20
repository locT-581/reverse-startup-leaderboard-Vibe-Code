'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import { actionGetMe, actionUpdateProfile, actionLogout } from '../actions/auth';
import { useAuthStore } from '../../core/store/useAuthStore';

const AVATARS = [
  { id: 'avatar_clown', emoji: '🤡', label: 'Clown' },
  { id: 'avatar_turtle', emoji: '🐢', label: 'Turtle' },
  { id: 'avatar_trash', emoji: '🗑️', label: 'Trash Can' },
  { id: 'avatar_bug', emoji: '🐛', label: 'Bug' },
  { id: 'avatar_ghost', emoji: '👻', label: 'Ghost' },
];

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logoutStore = useAuthStore((state) => state.logout);

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('default_avatar');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      startTransition(async () => {
        const response = await actionGetMe();
        if (response.success && response.data) {
          setUser(response.data);
          setUsername(response.data.username);
          setAvatar(response.data.avatar || 'default_avatar');
        } else {
          router.push('/auth');
        }
      });
    } else {
      setUsername(user.username);
      setAvatar(user.avatar || 'default_avatar');
    }
  }, [user, setUser, router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim()) {
      setError('Username cannot be empty. Stand proud.');
      return;
    }

    startTransition(async () => {
      const response = await actionUpdateProfile(username, avatar);
      if (response.success && response.data) {
        setUser(response.data);
        setSuccess('Profile updated successfully! Leaderboard is reflecting your changes.');
      } else {
        setError(response.error?.message || 'Profile update failed.');
      }
    });
  };

  const handleLogout = async () => {
    setError(null);
    setSuccess(null);
    const response = await actionLogout();
    if (response.success) {
      logoutStore();
      router.push('/auth');
    } else {
      setError('Logout failed. You are stuck here.');
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <h2 className={styles.title}>Loading session...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatarDisplay}>
            {AVATAR_MAP[avatar] || '👤'}
          </div>
          <h1 className={styles.title}>{user.username}</h1>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Wasted Calories</div>
            <div className={styles.statVal}>{user.wastedCalories} kcal</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Logic Violations</div>
            <div className={styles.statVal}>{user.logicViolations}</div>
          </div>
        </div>

        {success && <div className={styles.successMessage}>{success}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              placeholder="e.g. CodeWaster99"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Select Avatar</label>
            <div className={styles.avatarPicker}>
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  aria-label={av.label}
                  className={`${styles.avatarOption} ${avatar === av.id ? styles.avatarOptionSelected : ''
                    }`}
                  onClick={() => setAvatar(av.id)}
                  disabled={isPending}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
              disabled={isPending}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
