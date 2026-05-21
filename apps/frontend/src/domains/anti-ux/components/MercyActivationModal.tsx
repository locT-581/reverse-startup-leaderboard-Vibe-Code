'use client';

import React from 'react';
import { useMercyStore } from '../../../core/store/useMercyStore';
import styles from './MercyActivationModal.module.css';

export default function MercyActivationModal() {
  const showActivationModal = useMercyStore((state) => state.showActivationModal);
  const dismissActivationModal = useMercyStore((state) => state.dismissActivationModal);

  if (!showActivationModal) return null;

  return (
    <div className={styles.overlay} onClick={dismissActivationModal} id="mercy-activation-overlay">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mercy-modal-title"
      >
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 id="mercy-modal-title" className={styles.title}>
              👶 Mercy Mode Activated!
            </h2>
            <p className={styles.subtitle}>
              Let's make things a little easier for your special needs.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.badgeShowcase}>
            <span className={styles.badgeEmoji} role="img" aria-label="Toddler Badge">👶</span>
            <span className={styles.badgeText}>Toddler Mode Active</span>
          </div>
          <p className={styles.description}>
            We noticed you failed to interact with our simple, premium, highly-optimized buttons 10 times in a row.
            To accommodate your motor coordination levels, all button evasions and corporate sponsor CAPTCHAs are now disabled.
            A complimentary humiliation badge has been pinned to your profile.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={dismissActivationModal}
            id="dismiss-mercy-modal-btn"
          >
            I accept my limitations
          </button>
        </div>
      </div>
    </div>
  );
}
