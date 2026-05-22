import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { actionGetPostById } from '../../actions/posts';
import styles from './post-detail.module.css';
import MarkdownRenderer from '../../../shared/ui/MarkdownRenderer';

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
      title: 'Không tìm thấy bài viết | Khởi nghiệp Ngược',
      description: 'Hệ hình overengineer được yêu cầu không tồn tại.',
    };
  }

  const post = response.data;
  const description = `${post.author.username} đã lãng phí ${post.wastedCalories} kcal khi đề xuất hệ hình này. Đọc giải thích phức tạp và các giải pháp.`;

  return {
    title: `${post.title} | Khởi nghiệp Ngược`,
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
          ← Quay lại Bảng xếp hạng
        </Link>

        <article className={styles.postHeader}>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <div className={styles.authorMeta}>
            <div
              className={`${styles.authorAvatar} ${isAuthorPenalized ? styles.penalizedAvatar : ''}`}
              role="img"
              aria-label={
                isAuthorPenalized
                  ? `${post.author.avatar} - bị phạt với mũ chú hề`
                  : post.author.avatar
              }
            >
              {authorAvatar}
            </div>
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>
                {post.author.username}
                {isAuthorPenalized && <span className={styles.srOnly}> (Bị phạt với mũ chú hề)</span>}
                {post.author.isMercyActive && <span title="Chế độ Trẻ chập chững đang hoạt động">👶</span>}
                <span className={styles.violationsBadge} title={`Vi phạm logic: ${post.author.logicViolations}`}>
                  🚨 {post.author.logicViolations}
                </span>
              </span>
              <span className={styles.postStats}>
                Đã lãng phí <strong>{post.wastedCalories} kcal</strong> cho hệ hình này
              </span>
            </div>
          </div>
        </article>

        <section className={styles.postContent}>
          <MarkdownRenderer text={post.content} />
        </section>

        <section className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>Giải pháp được đề xuất ({comments.length})</h2>
          {comments.length === 0 ? (
            <p className={styles.noComments}>Chưa có giải pháp nào được đề xuất. Vấn đề vẫn chưa được giải quyết một cách đẹp đẽ.</p>
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
                          ? `${comment.author.avatar} - bị phạt với mũ chú hề`
                          : comment.author.avatar
                      }
                    >
                      {commentAvatar}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {comment.author.username}
                          {isCommenterPenalized && <span className={styles.srOnly}> (Bị phạt với mũ chú hề)</span>}
                          {comment.author.isMercyActive && <span title="Chế độ Trẻ chập chững đang hoạt động">👶</span>}
                          <span className={styles.violationsBadge} title={`Vi phạm logic: ${comment.author.logicViolations}`}>
                            🚨 {comment.author.logicViolations}
                          </span>
                        </span>
                        <span className={styles.commentCalories}>{comment.wastedCalories} kcal bị lãng phí</span>
                      </div>
                      <div className={styles.commentText}>
                        <MarkdownRenderer text={comment.content} />
                      </div>
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
