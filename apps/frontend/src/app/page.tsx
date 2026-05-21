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
          <span className={styles.logoIcon}>📉</span>
          <span className={styles.logoText}>Reverse Startup</span>
        </Link>
        <nav className={styles.navArea}>
          {user && (
            <Link href="/sabotage-store" className={styles.sabotageLink} data-testid="nav-sabotage-store">
              😈 Sabotage Store
            </Link>
          )}
          {user ? (
            <Link href="/profile" className={`${styles.navButton} ${styles.secondaryBtn}`} id="nav-profile-btn">
              👤 {user.username} {user.isMercyActive && <span title="Toddler Mode Active" style={{ marginLeft: '4px' }}>👶</span>}
            </Link>
          ) : (
            <Link href="/auth" className={`${styles.navButton} ${styles.primaryBtn}`}>
              Sign In
            </Link>
          )}
        </nav>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>The Hall of Inefficiency</h1>
          <p className={styles.heroSubtitle}>
            Where the most convoluted tech stacks, pre-revenue pivots, and overengineered pipelines are proudly celebrated. Real-time broadcast straight from the developers who refuse to ship.
          </p>
        </section>

        <section className={styles.formSection}>
          {user ? (
            <button
              className={styles.proposeBtn}
              onClick={() => setIsModalOpen(true)}
            >
              💡 Propose a Paradigm
            </button>
          ) : (
            <div className={styles.unauthCard}>
              <p className={styles.unauthText}>
                Want to share your own overengineered masterpiece and log some wasted calories?
              </p>
              <Link href="/auth" className={styles.authLink}>
                Sign In to Propose a Paradigm
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
          Built for teams who measure progress in lines of code deleted. View the{' '}
          <Link href="/profile" className={styles.footerLink}>
            Dashboard
          </Link>
          .
        </p>
      </footer>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <MercyActivationModal />
    </div>
  );
}
