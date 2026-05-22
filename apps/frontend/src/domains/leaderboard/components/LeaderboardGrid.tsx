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
import MarkdownRenderer from '../../../shared/ui/MarkdownRenderer';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

const AVATAR_LABEL_MAP: Record<string, string> = {
  avatar_clown: 'Hề',
  avatar_turtle: 'Rùa',
  avatar_trash: 'Thùng rác',
  avatar_bug: 'Bọ',
  avatar_ghost: 'Ma',
  default_avatar: 'Ảnh đại diện'
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
  const [shareStatus, setShareStatus] = useState<{ [postId: string]: boolean }>({});

  const handleSharePost = (postId: string) => {
    const permalink = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(permalink).then(() => {
      setShareStatus((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setShareStatus((prev) => ({ ...prev, [postId]: false }));
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy link:', err);
    });
  };


  const handleReport = (postId: string, authorId: string) => {
    if (currentUser?.id === authorId) {
      setReportingError((prev) => ({
        ...prev,
        [postId]: "Tại sao bạn lại tự báo cáo chính mình? Làm vậy quá logic đấy, dừng lại đi!",
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
            [postId]: response.error?.message || 'Báo cáo logic thất bại.',
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
        setError(response.error?.message || 'Tải dữ liệu bảng xếp hạng thất bại.');
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
        <p>Đang tải danh sách kém hiệu quả điểm cao...</p>
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
        <p>Chưa có calo lãng phí nào. Ai đó cần phải viết code tệ ngay đi!</p>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      <div className={styles.headerRow}>
        <div className={styles.colRank}>Hạng</div>
        <div className={styles.colAuthor}>Nhà đổi mới</div>
        <div className={styles.colTitle}>Ý tưởng</div>
        <div className={styles.colScore}>Calo Lãng phí</div>
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
                    Hạng {index + 1}. Nhà đổi mới: {post.author.username}{post.author.logicViolations >= 5 ? ' (Bị phạt đội mũ hề)' : ''}. Ý tưởng: {post.title} - {post.content}. Calo lãng phí: {post.wastedCalories} kcal.
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
                        ? `${AVATAR_LABEL_MAP[post.author.avatar] || 'Ảnh đại diện'} - bị phạt đội mũ hề`
                        : (AVATAR_LABEL_MAP[post.author.avatar] || 'Ảnh đại diện')
                    }
                  >
                    {AVATAR_MAP[post.author.avatar] || '👤'}
                  </span>
                  <span className={styles.authorName}>
                    <span className={styles.usernameText} title={post.author.username}>
                      {post.author.username}
                    </span>
                    {post.author.logicViolations >= 5 && (
                      <span className={styles.srOnly}> (Bị phạt đội mũ hề)</span>
                    )}
                    {post.author.isMercyActive && (
                      <span className={styles.mercyBadge} title="Chế độ Trẻ chập chững đang hoạt động">👶</span>
                    )}
                    <span className={styles.violationsBadge} title={`Vi phạm logic: ${post.author.logicViolations || 0}`}>
                      🚨 {post.author.logicViolations || 0}
                    </span>
                  </span>
                </div>
                <div className={styles.colTitle} aria-hidden={isDistorted ? "true" : undefined}>
                  <div className={styles.postTitleText}>{post.title}</div>
                  <div className={styles.postSnippet}>
                    <MarkdownRenderer text={post.content} />
                  </div>
                  {reportingError[post.id] && (
                    <span
                      className={styles.reportErrorMsg}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⚠️ {reportingError[post.id]}
                    </span>
                  )}
                  <div className={styles.actionButtons}>
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <button
                        className={styles.shareBtn}
                        onClick={() => handleSharePost(post.id)}
                        aria-label={`Chia sẻ liên kết cho bài viết: ${post.title}`}
                        data-testid="share-post-btn"
                      >
                        {shareStatus[post.id] ? 'Đã sao chép! ✓' : 'Chia sẻ 🔗'}
                      </button>
                    </div>
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
                            aria-label={`Phá hoại bài viết của ${post.author.username}`}
                          >
                            Phá hoại 😈
                          </button>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <button
                            className={styles.reportLogicBtn}
                            onClick={() => handleReport(post.id, post.author.id)}
                            disabled={isReporting && !!reportingStates[post.id]}
                            aria-label={`Báo cáo logic trong bài viết của ${post.author.username}`}
                          >
                            {isReporting && reportingStates[post.id] ? 'Đang báo cáo... ⏳' : 'Báo cáo Logic 🚨'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
