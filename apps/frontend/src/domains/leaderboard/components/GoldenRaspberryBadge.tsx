import React from 'react';
import styles from './GoldenRaspberryBadge.module.css';

export default function GoldenRaspberryBadge() {
  return (
    <span className={styles.badge} aria-label="Golden Raspberry Badge">
      <span className={styles.icon}>🏆</span>
      <span className={styles.label}>Golden Raspberry</span>
    </span>
  );
}
