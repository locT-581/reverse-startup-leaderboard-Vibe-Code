'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { actionGetLeaderboard, LeaderboardPost } from '../../../app/actions/leaderboard';
import { socket } from '../../../core/api/socket.client';
import GoldenRaspberryBadge from './GoldenRaspberryBadge';
import styles from './LeaderboardGrid.module.css';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

export default function LeaderboardGrid() {
  const [posts, setPosts] = useState<LeaderboardPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // 1. Fetch initial leaderboard data
    startTransition(async () => {
      const response = await actionGetLeaderboard();
      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch leaderboard data.');
      }
    });

    // 2. Subscribe to real-time WebSocket updates
    const activeSocket = socket;
    if (activeSocket) {
      if (!activeSocket.connected) {
        activeSocket.connect();
      }

      const handleLeaderboardUpdate = (updatedPosts: LeaderboardPost[]) => {
        setPosts(updatedPosts);
        setError(null); // Clear any previous errors on successful real-time update
      };

      activeSocket.on('leaderboard.updated', handleLeaderboardUpdate);

      return () => {
        activeSocket.off('leaderboard.updated', handleLeaderboardUpdate);
      };
    }
  }, []);

  if (isPending && posts.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} role="status"></div>
        <p>Retrieving high-scoring wastefulness...</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className={styles.errorContainer} role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>No wasted calories yet. Someone needs to write some terrible code, quickly!</p>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      <div className={styles.headerRow}>
        <div className={styles.colRank}>Rank</div>
        <div className={styles.colAuthor}>Innovator</div>
        <div className={styles.colTitle}>Idea</div>
        <div className={styles.colScore}>Wasted Calories</div>
      </div>
      <div className={styles.postsList}>
        {posts.map((post, index) => {
          const isFirst = index === 0;
          return (
            <div key={post.id} className={`${styles.postRow} ${isFirst ? styles.firstPlace : ''}`}>
              <div className={styles.colRank}>
                <span className={styles.rankBadge}>{index + 1}</span>
              </div>
              <div className={styles.colAuthor}>
                <span className={styles.authorAvatar} role="img" aria-label={post.author.avatar}>
                  {AVATAR_MAP[post.author.avatar] || '👤'}
                </span>
                <span className={styles.authorName}>{post.author.username}</span>
              </div>
              <div className={styles.colTitle}>
                <div className={styles.postTitleText}>{post.title}</div>
                <p className={styles.postSnippet}>{post.content}</p>
              </div>
              <div className={styles.colScore}>
                <div className={styles.scoreContainer}>
                  <span className={styles.scoreValue}>{post.wastedCalories} kcal</span>
                  {isFirst && (
                    <div className={styles.badgeWrapper}>
                      <GoldenRaspberryBadge />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
