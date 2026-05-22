'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';
import { actionGetMe, actionUpdateProfile, actionLogout } from '../actions/auth';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useMercyStore } from '../../core/store/useMercyStore';
import MercyActivationModal from '../../domains/anti-ux/components/MercyActivationModal';

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

  const failures = useMercyStore((state) => state.failures);
  const mercyActive = useMercyStore((state) => state.isMercyActive);
  const setMercyActive = useMercyStore((state) => state.setMercyActive);

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('default_avatar');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTogglingMercy, setIsTogglingMercy] = useState(false);
  const [shareStatus, setShareStatus] = useState(false);

  useEffect(() => {
    if (!user) {
      startTransition(async () => {
        const response = await actionGetMe();
        if (response.success && response.data) {
          setUser(response.data);
          setUsername(response.data.username);
          setAvatar(response.data.avatar || 'default_avatar');
          useMercyStore.getState().setMercyState(
            response.data.mercyFailures ?? 0,
            response.data.isMercyActive ?? false
          );
        } else {
          router.push('/auth');
        }
      });
    } else {
      setUsername(user.username);
      setAvatar(user.avatar || 'default_avatar');
      useMercyStore.getState().setMercyState(
        user.mercyFailures ?? 0,
        user.isMercyActive ?? false
      );
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

  const handleShareProfile = () => {
    if (!user) return;
    const permalink = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(permalink).then(() => {
      setShareStatus(true);
      setTimeout(() => {
        setShareStatus(false);
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy profile link:', err);
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
          <div
            className={`${styles.avatarDisplay} ${user.logicViolations >= 5 ? styles.penalizedAvatar : ''}`}
            role="img"
            aria-label={
              user.logicViolations >= 5
                ? `${AVATARS.find((av) => av.id === avatar)?.label || 'Avatar'} - penalized with a clown hat`
                : (AVATARS.find((av) => av.id === avatar)?.label || 'Avatar')
            }
          >
            {AVATAR_MAP[avatar] || '👤'}
          </div>
          <h1 className={styles.title}>
            {user.username}
            {user.logicViolations >= 5 && (
              <span className={styles.srOnly}> (Penalized with a clown hat)</span>
            )}
            {mercyActive && <span title="Toddler Mode Active" style={{ marginLeft: '6px' }}>👶</span>}
          </h1>
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

        <Link href="/sabotage-store" className={styles.storeButton} data-testid="profile-sabotage-store">
          😈 Go to Sabotage Store
        </Link>

        <button
          type="button"
          className={styles.shareProfileBtn}
          onClick={handleShareProfile}
          data-testid="share-profile-btn"
        >
          {shareStatus ? 'Copied! ✓' : 'Share Profile Link 🔗'}
        </button>

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

          {failures >= 10 && (
            <div className={styles.mercySection}>
              <h3 className={styles.mercyTitle}>Toddler Settings</h3>
              <div className={styles.toggleRow}>
                <label htmlFor="mercy-mode-toggle" className={styles.toggleLabel}>
                  👶 Mercy Mode (Toddler Mode) {isTogglingMercy && <span className={styles.loadingText}>(Syncing...)</span>}
                </label>
                <input
                  id="mercy-mode-toggle"
                  type="checkbox"
                  checked={mercyActive}
                  onChange={async (e) => {
                    if (isTogglingMercy) return;
                    setIsTogglingMercy(true);
                    try {
                      await setMercyActive(e.target.checked);
                    } finally {
                      setIsTogglingMercy(false);
                    }
                  }}
                  className={styles.toggleInput}
                />
              </div>
              <p className={styles.toggleHint}>
                Disables evasive UI elements and sponsored CAPTCHAs so you can navigate without crying.
              </p>
            </div>
          )}

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
      <MercyActivationModal />
    </div>
  );
}
