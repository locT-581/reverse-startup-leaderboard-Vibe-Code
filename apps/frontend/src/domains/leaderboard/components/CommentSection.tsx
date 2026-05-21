'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HostileInput from './HostileInput';
import { LeaderboardPost } from '../../../app/actions/leaderboard';
import { UserProfile } from '../../../app/actions/auth';
import { actionCreateComment } from '../../../app/actions/posts';
import styles from './CommentSection.module.css';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

interface CommentSectionProps {
  post: LeaderboardPost;
  currentUser: UserProfile | null;
}

export default function CommentSection({ post, currentUser }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const comments = post.comments || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasError || !commentText.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await actionCreateComment(post.id, commentText);

    setIsSubmitting(false);

    if (res.success) {
      setCommentText('');
      setHasError(false);
    } else {
      setSubmitError(res.error?.message || 'Failed to submit solution.');
    }
  };

  const isButtonDisabled = isSubmitting || hasError || !commentText.trim();

  return (
    <div className={styles.commentsContainer} onClick={(e) => e.stopPropagation()}>
      <h3 className={styles.commentsHeader}>Proposed Solutions ({comments.length})</h3>

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>No solutions proposed yet. Propose a solution below if you dare.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentRow}>
              <span className={styles.commentAvatar} role="img" aria-label={comment.author.avatar}>
                {AVATAR_MAP[comment.author.avatar] || '👤'}
              </span>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{comment.author.username}</span>
                  <span className={styles.commentCalories}>{comment.wastedCalories} kcal wasted</span>
                </div>
                <p className={styles.commentText}>{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {currentUser ? (
        <form onSubmit={handleSubmit} className={styles.newCommentForm}>
          <h4 className={styles.formTitle}>Propose an Overengineered Solution</h4>
          <HostileInput
            type="textarea"
            id={`comment-input-${post.id}`}
            value={commentText}
            onChange={setCommentText}
            placeholder="Type your convoluted solution here... It must be strictly longer than the original post."
            validationType="comment"
            originalPostLength={post.content.length}
            onErrorChange={setHasError}
            label="Solution Comment Content"
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
            {isSubmitting ? 'Submitting Solution...' : 'Submit Solution'}
          </button>
        </form>
      ) : (
        <div className={styles.authPrompt}>
          Want to propose a solution?{' '}
          <Link href="/auth" className={styles.authLink}>
            Sign In
          </Link>{' '}
          first.
        </div>
      )}
    </div>
  );
}
