'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import LeaderboardGrid from '../domains/leaderboard/components/LeaderboardGrid';
import CreatePostModal from '../domains/leaderboard/components/CreatePostModal';
import MercyActivationModal from '../domains/anti-ux/components/MercyActivationModal';
import { useAuthStore } from '../core/store/useAuthStore';
import { useMercyStore } from '../core/store/useMercyStore';
import { actionGetMe } from './actions/auth';
import styles from './page.module.css';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mercyActive = useMercyStore((state) => state.isMercyActive);

  useEffect(() => {
    // Check session on mount to see if user is authenticated
    startTransition(async () => {
      const response = await actionGetMe();
      if (response.success && response.data) {
        setUser(response.data);
        useMercyStore.getState().setMercyState(
          response.data.mercyFailures ?? 0,
          response.data.isMercyActive ?? false
        );
      } else {
        setUser(null);
      }
    });
  }, [setUser]);

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoArea}>
          <img src="/logo.png" alt="SnakeLegs Logo" className={styles.logoImage} />
          <span className={styles.logoText}>SnakeLegs</span>
        </Link>
        <nav className={styles.navArea}>
          {user && (
            <Link href="/sabotage-store" className={styles.sabotageLink} data-testid="nav-sabotage-store">
              😈 Cửa hàng Phá hoại
            </Link>
          )}
          {user ? (
            <Link href="/profile" className={`${styles.navButton} ${styles.secondaryBtn}`} id="nav-profile-btn">
              👤 {user.username} {user.isMercyActive && <span title="Chế độ Trẻ chập chững đang hoạt động" style={{ marginLeft: '4px' }}>👶</span>}
            </Link>
          ) : (
            <Link href="/auth" className={`${styles.navButton} ${styles.primaryBtn}`}>
              Đăng nhập
            </Link>
          )}
        </nav>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Sảnh Đường Kém Hiệu Quả</h1>
          <p className={styles.heroSubtitle}>
            Nơi những tech stack phức tạp nhất, những lần pivot chưa có doanh thu, và các pipeline được overengineer quá mức được tự hào vinh danh. Phát trực tiếp theo thời gian thực từ chính những lập trình viên từ chối ship hàng.
          </p>
        </section>

        <section className={styles.formSection}>
          {user ? (
            <button
              className={styles.proposeBtn}
              onClick={() => setIsModalOpen(true)}
            >
              💡 Đề xuất một Hệ hình
            </button>
          ) : (
            <div className={styles.unauthCard}>
              <p className={styles.unauthText}>
                Bạn muốn chia sẻ kiệt tác overengineer của riêng mình và ghi nhận calo lãng phí?
              </p>
              <Link href="/auth" className={styles.authLink}>
                Đăng nhập để Đề xuất một Hệ hình
              </Link>
            </div>
          )}
        </section>

        <section className={styles.leaderboardSection}>
          <LeaderboardGrid />
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          Được thiết làm riêng cho những đội ngũ đo lường tiến trình bằng số dòng code bị xóa. Xem{' '}
          <Link href="/profile" className={styles.footerLink}>
            Bảng điều khiển
          </Link>
          .
        </p>
      </footer>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <MercyActivationModal />
    </div>
  );
}
