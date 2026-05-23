'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import HostileInput from '@/domains/anti-ux/components/HostileInput';
import { LeaderboardPost } from '@/app/actions/leaderboard';
import { UserProfile } from '@/app/actions/auth';
import { actionCreateComment } from '@/app/actions/posts';
import AdCaptchaModal from '@/domains/anti-ux/components/AdCaptchaModal';
import EvasiveButton from '@/domains/anti-ux/components/EvasiveButton';
import { useMercyStore } from '@/core/store/useMercyStore';
import styles from './CommentSection.module.css';
import MarkdownRenderer from '@/shared/ui/MarkdownRenderer';

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

interface CommentSectionProps {
  post: LeaderboardPost;
  currentUser: UserProfile | null;
}

export default function CommentSection({ post, currentUser }: CommentSectionProps) {
  const mercyActive = useMercyStore((state) => state.isMercyActive);
  const [commentText, setCommentText] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);

  const comments = post.comments || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasError || !commentText.trim()) return;

    if (mercyActive) {
      handleCaptchaSuccess();
    } else {
      setIsCaptchaOpen(true);
    }
  };

  const handleCaptchaSuccess = () => {
    setSubmitError(null);

    startTransition(async () => {
      const res = await actionCreateComment(post.id, commentText);

      if (res.success) {
        setCommentText('');
        setHasError(false);
      } else {
        const errMsg = res.error?.message || 'Gửi giải pháp thất bại.';
        setSubmitError(errMsg);
        throw new Error(errMsg);
      }
    });
  };

  const isButtonDisabled = isPending || hasError || !commentText.trim();

  return (
    <div className={styles.commentsContainer} onClick={(e) => e.stopPropagation()}>
      <h3 className={styles.commentsHeader}>Giải pháp Đề xuất ({comments.length})</h3>

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>Chưa có giải pháp nào được đề xuất. Hãy thử đề xuất một giải pháp bên dưới nếu bạn dám.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentRow}>
              <span
                className={`${styles.commentAvatar} ${comment.author.logicViolations >= 5 ? styles.penalizedAvatar : ''}`}
                role="img"
                aria-label={
                  comment.author.logicViolations >= 5
                    ? `${AVATAR_LABEL_MAP[comment.author.avatar] || 'Ảnh đại diện'} - bị phạt đội mũ hề`
                    : (AVATAR_LABEL_MAP[comment.author.avatar] || 'Ảnh đại diện')
                }
              >
                {AVATAR_MAP[comment.author.avatar] || '👤'}
              </span>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>
                    {comment.author.username}
                    {comment.author.logicViolations >= 5 && (
                      <span className={styles.srOnly}> (Bị phạt đội mũ hề)</span>
                    )}
                    {comment.author.isMercyActive && (
                      <span className={styles.mercyBadge} title="Chế độ Trẻ chập chững đang hoạt động" style={{ marginLeft: '4px' }}>👶</span>
                    )}
                    <span className={styles.violationsBadge} title={`Vi phạm logic: ${comment.author.logicViolations || 0}`}>
                      🚨 {comment.author.logicViolations || 0}
                    </span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.commentCalories}>Lãng phí {comment.wastedCalories} kcal</span>
                    <EvasiveButton targetId={comment.id} targetType="comment" />
                  </div>
                </div>
                <div className={styles.commentText}>
                  <MarkdownRenderer text={comment.content} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {currentUser ? (
        <>
          <form onSubmit={handleSubmit} className={styles.newCommentForm}>
            <h4 className={styles.formTitle}>Đề xuất Giải pháp Phức tạp hóa (Overengineered)</h4>
            <HostileInput
              type="textarea"
              id={`comment-input-${post.id}`}
              value={commentText}
              onChange={setCommentText}
              placeholder="Nhập giải pháp phức tạp của bạn vào đây... Nó bắt buộc phải dài hơn bài viết gốc."
              validationType="comment"
              originalPostLength={post.content.length}
              onErrorChange={setHasError}
              label="Nội dung Bình luận Giải pháp"
              hideLabelVisually={true}
            />
            {submitError && (
              <div className={styles.submitError} role="alert">
                ⚠️ {submitError}
              </div>
            )}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isButtonDisabled}
            >
              {isPending ? 'Đang gửi Giải pháp...' : 'Gửi Giải pháp'}
            </button>
          </form>
          <AdCaptchaModal
            isOpen={isCaptchaOpen}
            onClose={() => setIsCaptchaOpen(false)}
            onSuccess={handleCaptchaSuccess}
            bypass={mercyActive}
          />
        </>
      ) : (
        <div className={styles.authPrompt}>
          Bạn muốn đề xuất giải pháp?{' '}
          <Link href="/auth" className={styles.authLink}>
            Đăng nhập
          </Link>{' '}
          trước.
        </div>
      )}
    </div>
  );
}
