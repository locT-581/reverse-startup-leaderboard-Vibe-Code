'use client';

import React, { useEffect, useTransition } from 'react';
import Link from 'next/link';
import LeaderboardGrid from '../domains/leaderboard/components/LeaderboardGrid';
import { useAuthStore } from '../core/store/useAuthStore';
import { actionGetMe } from './actions/auth';
import styles from './page.module.css';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Check session on mount to see if user is authenticated
    startTransition(async () => {
      const response = await actionGetMe();
      if (response.success && response.data) {
        setUser(response.data);
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
          {user ? (
            <Link href="/profile" className={`${styles.navButton} ${styles.secondaryBtn}`}>
              👤 {user.username}
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
    </div>
  );
}
