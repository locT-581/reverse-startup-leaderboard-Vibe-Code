'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { actionGetLeaderboard, LeaderboardPost } from '../../../app/actions/leaderboard';
import { actionReportPost } from '../../../app/actions/posts';
import { socket } from '../../../core/api/socket.client';
import GoldenRaspberryBadge from './GoldenRaspberryBadge';
import CommentSection from './CommentSection';
import { useAuthStore } from '../../../core/store/useAuthStore';
import EvasiveButton from '../../anti-ux/components/EvasiveButton';
import SabotageSelectionModal from '../../sabotage/components/SabotageSelectionModal';
import { useChaosStore } from '../../../core/store/useChaosStore';
import styles from './LeaderboardGrid.module.css';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

const AVATAR_LABEL_MAP: Record<string, string> = {
  avatar_clown: 'Clown',
  avatar_turtle: 'Turtle',
  avatar_trash: 'Trash Can',
  avatar_bug: 'Bug',
  avatar_ghost: 'Ghost',
  default_avatar: 'Avatar'
};

export default function LeaderboardGrid() {
  const [posts, setPosts] = useState<LeaderboardPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentUser = useAuthStore((state) => state.user);
  const activeSabotages = useChaosStore((state) => state.activeSabotages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSabotagePost, setSelectedSabotagePost] = useState<{
    id: string;
    title: string;
    authorId: string;
  } | null>(null);
  const [reportingStates, setReportingStates] = useState<{ [postId: string]: boolean }>({});
  const [reportingError, setReportingError] = useState<{ [postId: string]: string | null }>({});
  const [isReporting, startReportTransition] = useTransition();

  const handleReport = (postId: string, authorId: string) => {
    if (currentUser?.id === authorId) {
      setReportingError((prev) => ({
        ...prev,
        [postId]: "Why are you reporting yourself? That's too logical, stop it!",
      }));
      return;
    }

    setReportingError((prev) => ({ ...prev, [postId]: null }));
    setReportingStates((prev) => ({ ...prev, [postId]: true }));

    startReportTransition(async () => {
      try {
        const response = await actionReportPost(postId);
        if (!response.success) {
          setReportingError((prev) => ({
            ...prev,
            [postId]: response.error?.message || 'Failed to report logic.',
          }));
        }
      } finally {
        setReportingStates((prev) => ({ ...prev, [postId]: false }));
      }
    });
  };

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
          const isExpanded = expandedPostId === post.id;

          // Check if this post is targeted by active sabotages where current user is NOT the author
          const postSabotages = activeSabotages.filter(
            (s) => s.targetId === post.id && s.authorId !== currentUser?.id && s.effectType !== 'deduct_calories'
          );
          const isDistorted = postSabotages.length > 0;
          const rowDistortionClasses = postSabotages.map((s) => `post-${s.effectType}`).join(' ');

          return (
            <div
              key={post.id}
              className={`${styles.postRowWrapper} ${isFirst ? styles.firstPlace : ''}`}
            >
              <div
                className={`${styles.postRow} ${rowDistortionClasses}`}
                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                role="button"
                aria-expanded={isExpanded}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedPostId(isExpanded ? null : post.id);
                  }
                }}
              >
                {/* Screen Reader Bypass - read clean text block if distorted */}
                {isDistorted && (
                  <div className={styles.srOnly}>
                    Rank {index + 1}. Innovator: {post.author.username}{post.author.logicViolations >= 5 ? ' (Penalized with a clown hat)' : ''}. Idea: {post.title} - {post.content}. Wasted calories: {post.wastedCalories} kcal.
                  </div>
                )}

                <div className={styles.colRank} aria-hidden={isDistorted ? "true" : undefined}>
                  <span className={styles.rankBadge}>{index + 1}</span>
                </div>
                <div className={styles.colAuthor} aria-hidden={isDistorted ? "true" : undefined}>
                  <span
                    className={`${styles.authorAvatar} ${post.author.logicViolations >= 5 ? styles.penalizedAvatar : ''}`}
                    role="img"
                    aria-label={
                      post.author.logicViolations >= 5
                        ? `${AVATAR_LABEL_MAP[post.author.avatar] || 'Avatar'} - penalized with a clown hat`
                        : (AVATAR_LABEL_MAP[post.author.avatar] || 'Avatar')
                    }
                  >
                    {AVATAR_MAP[post.author.avatar] || '👤'}
                  </span>
                  <span className={styles.authorName}>
                    {post.author.username}
                    {post.author.logicViolations >= 5 && (
                      <span className={styles.srOnly}> (Penalized with a clown hat)</span>
                    )}
                    {post.author.isMercyActive && (
                      <span className={styles.mercyBadge} title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>
                    )}
                    <span className={styles.violationsBadge} title={`Logic Violations: ${post.author.logicViolations || 0}`}>
                      🚨 {post.author.logicViolations || 0}
                    </span>
                  </span>
                </div>
                <div className={styles.colTitle} aria-hidden={isDistorted ? "true" : undefined}>
                  <div className={styles.postTitleText}>{post.title}</div>
                  <p className={styles.postSnippet}>{post.content}</p>
                  {reportingError[post.id] && (
                    <span
                      className={styles.reportErrorMsg}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⚠️ {reportingError[post.id]}
                    </span>
                  )}
                </div>
                <div className={styles.colScore}>
                  <div className={styles.scoreContainer}>
                    <span className={styles.scoreValue} aria-hidden={isDistorted ? "true" : undefined}>
                      {post.wastedCalories} kcal
                    </span>
                    {isFirst && (
                      <div className={styles.badgeWrapper} aria-hidden={isDistorted ? "true" : undefined}>
                        <GoldenRaspberryBadge />
                      </div>
                    )}
                    <div className={styles.actionButtons}>
                      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <EvasiveButton targetId={post.id} targetType="post" />
                      </div>
                      {currentUser && (
                        <>
                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <button
                              className={styles.sabotageBtn}
                              onClick={() => {
                                setSelectedSabotagePost({
                                  id: post.id,
                                  title: post.title,
                                  authorId: post.author.id,
                                });
                                setIsModalOpen(true);
                              }}
                              aria-label={`Sabotage post by ${post.author.username}`}
                            >
                              Sabotage 😈
                            </button>
                          </div>
                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <button
                              className={styles.reportLogicBtn}
                              onClick={() => handleReport(post.id, post.author.id)}
                              disabled={isReporting && !!reportingStates[post.id]}
                              aria-label={`Report logic in post by ${post.author.username}`}
                            >
                              {isReporting && reportingStates[post.id] ? 'Reporting... ⏳' : 'Report Logic 🚨'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <CommentSection post={post} currentUser={currentUser} />
              )}
            </div>
          );
        })}
      </div>
      {selectedSabotagePost && (
        <SabotageSelectionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSabotagePost(null);
          }}
          postId={selectedSabotagePost.id}
          postTitle={selectedSabotagePost.title}
          postAuthorId={selectedSabotagePost.authorId}
        />
      )}
    </div>
  );
}
