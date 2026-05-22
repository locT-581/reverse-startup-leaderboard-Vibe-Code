import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { actionGetPostById } from '../../actions/posts';
import styles from './post-detail.module.css';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const response = await actionGetPostById(id);

  if (!response.success || !response.data) {
    return {
      title: 'Post Not Found | Reverse Startup',
      description: 'The requested overengineered paradigm does not exist.',
    };
  }

  const post = response.data;
  const description = `${post.author.username} wasted ${post.wastedCalories} kcal proposing this paradigm. Read the convoluted explanation and solutions.`;

  return {
    title: `${post.title} | Reverse Startup`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      authors: [post.author.username],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    }
  };
}

export default async function PublicPostPage({ params }: Props) {
  const { id } = await params;
  const response = await actionGetPostById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const post = response.data;
  const authorAvatar = AVATAR_MAP[post.author.avatar] || '👤';
  const isAuthorPenalized = post.author.logicViolations >= 5;
  const comments = post.comments || [];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>
          ← Back to Leaderboard
        </Link>

        <article className={styles.postHeader}>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <div className={styles.authorMeta}>
            <div
              className={`${styles.authorAvatar} ${isAuthorPenalized ? styles.penalizedAvatar : ''}`}
              role="img"
              aria-label={
                isAuthorPenalized
                  ? `${post.author.avatar} - penalized with a clown hat`
                  : post.author.avatar
              }
            >
              {authorAvatar}
            </div>
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>
                {post.author.username}
                {isAuthorPenalized && <span className={styles.srOnly}> (Penalized with a clown hat)</span>}
                {post.author.isMercyActive && <span title="Toddler Mode Active">👶</span>}
                <span className={styles.violationsBadge} title={`Logic Violations: ${post.author.logicViolations}`}>
                  🚨 {post.author.logicViolations}
                </span>
              </span>
              <span className={styles.postStats}>
                Wasted <strong>{post.wastedCalories} kcal</strong> on this paradigm
              </span>
            </div>
          </div>
        </article>

        <section className={styles.postContent}>
          {post.content}
        </section>

        <section className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>Proposed Solutions ({comments.length})</h2>
          {comments.length === 0 ? (
            <p className={styles.noComments}>No solutions proposed yet. The problem remains beautifully unresolved.</p>
          ) : (
            <div className={styles.commentsList}>
              {comments.map((comment: any) => {
                const commentAvatar = AVATAR_MAP[comment.author.avatar] || '👤';
                const isCommenterPenalized = comment.author.logicViolations >= 5;

                return (
                  <div key={comment.id} className={styles.commentRow}>
                    <div
                      className={`${styles.commentAvatar} ${isCommenterPenalized ? styles.penalizedAvatar : ''}`}
                      role="img"
                      aria-label={
                        isCommenterPenalized
                          ? `${comment.author.avatar} - penalized with a clown hat`
                          : comment.author.avatar
                      }
                    >
                      {commentAvatar}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {comment.author.username}
                          {isCommenterPenalized && <span className={styles.srOnly}> (Penalized with a clown hat)</span>}
                          {comment.author.isMercyActive && <span title="Toddler Mode Active">👶</span>}
                          <span className={styles.violationsBadge} title={`Logic Violations: ${comment.author.logicViolations}`}>
                            🚨 {comment.author.logicViolations}
                          </span>
                        </span>
                        <span className={styles.commentCalories}>{comment.wastedCalories} kcal wasted</span>
                      </div>
                      <p className={styles.commentText}>{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
