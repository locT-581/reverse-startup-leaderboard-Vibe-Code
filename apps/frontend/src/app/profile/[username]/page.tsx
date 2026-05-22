import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { actionGetProfileByUsername } from '../../actions/auth';
import styles from './profile-public.module.css';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const response = await actionGetProfileByUsername(decodedUsername);

  if (!response.success || !response.data) {
    return {
      title: 'User Not Found | Reverse Startup',
      description: 'The requested user profile does not exist in the Hall of Inefficiency.',
    };
  }

  const profile = response.data;
  const description = `${profile.username} has wasted ${profile.wastedCalories} kcal on overengineered paradigms with ${profile.logicViolations} logic violations.`;

  return {
    title: `${profile.username}'s Profile | Reverse Startup`,
    description,
    openGraph: {
      title: `${profile.username}'s Inefficiency Profile`,
      description,
      type: 'profile',
      username: profile.username,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.username}'s Inefficiency Profile`,
      description,
    }
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const response = await actionGetProfileByUsername(decodedUsername);

  if (!response.success || !response.data) {
    notFound();
  }

  const profile = response.data;
  const avatarEmoji = AVATAR_MAP[profile.avatar] || '👤';
  const isPenalized = profile.logicViolations >= 5;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>
          ← Back to Leaderboard
        </Link>
        <div className={styles.header}>
          <div
            className={`${styles.avatarDisplay} ${isPenalized ? styles.penalizedAvatar : ''}`}
            role="img"
            aria-label={
              isPenalized
                ? `${profile.avatar} - penalized with a clown hat`
                : profile.avatar
            }
          >
            {avatarEmoji}
          </div>
          <h1 className={styles.title}>
            {profile.username}
            {isPenalized && <span className={styles.srOnly}> (Penalized with a clown hat)</span>}
            {profile.isMercyActive && <span title="Toddler Mode Active" style={{ marginLeft: '6px' }}>👶</span>}
          </h1>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Wasted Calories</div>
            <div className={styles.statVal}>{profile.wastedCalories} kcal</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Logic Violations</div>
            <div className={styles.statVal}>{profile.logicViolations}</div>
          </div>
        </div>

        <div className={styles.badgeSection}>
          {isPenalized ? (
            <div className={styles.badgePenalty}>
              🤡 Logic Violations Threshold Reached: Clown Hat Overlay Active!
            </div>
          ) : (
            <div className={styles.badgeGood}>
              ✅ Logic Violations are below threshold. No clown hat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
