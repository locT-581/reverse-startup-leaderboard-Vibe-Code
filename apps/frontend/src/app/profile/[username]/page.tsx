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
      title: 'Không tìm thấy người dùng | Khởi nghiệp Ngược',
      description: 'Hồ sơ người dùng được yêu cầu không tồn tại trong Sảnh Đường Kém Hiệu Quả.',
    };
  }

  const profile = response.data;
  const description = `${profile.username} đã lãng phí ${profile.wastedCalories} kcal cho các hệ hình overengineer với ${profile.logicViolations} lần vi phạm logic.`;

  return {
    title: `Hồ sơ của ${profile.username} | Khởi nghiệp Ngược`,
    description,
    openGraph: {
      title: `Hồ sơ Kém Hiệu Quả của ${profile.username}`,
      description,
      type: 'profile',
      username: profile.username,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Hồ sơ Kém Hiệu Quả của ${profile.username}`,
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
          ← Quay lại Bảng xếp hạng
        </Link>
        <div className={styles.header}>
          <div
            className={`${styles.avatarDisplay} ${isPenalized ? styles.penalizedAvatar : ''}`}
            role="img"
            aria-label={
              isPenalized
                ? `${profile.avatar} - bị phạt với mũ chú hề`
                : profile.avatar
            }
          >
            {avatarEmoji}
          </div>
          <h1 className={styles.title}>
            {profile.username}
            {isPenalized && <span className={styles.srOnly}> (Bị phạt với mũ chú hề)</span>}
            {profile.isMercyActive && <span title="Chế độ Trẻ chập chững đang hoạt động" style={{ marginLeft: '6px' }}>👶</span>}
          </h1>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Calo lãng phí</div>
            <div className={styles.statVal}>{profile.wastedCalories} kcal</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Vi phạm logic</div>
            <div className={styles.statVal}>{profile.logicViolations}</div>
          </div>
        </div>

        <div className={styles.badgeSection}>
          {isPenalized ? (
            <div className={styles.badgePenalty}>
              🤡 Đã đạt ngưỡng vi phạm logic: Kích hoạt lớp phủ mũ chú hề!
            </div>
          ) : (
            <div className={styles.badgeGood}>
              ✅ Số lần vi phạm logic dưới ngưỡng. Không có mũ chú hề.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
