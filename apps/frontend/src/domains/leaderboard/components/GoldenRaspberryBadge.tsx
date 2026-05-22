import React from 'react';
import styles from './GoldenRaspberryBadge.module.css';

export default function GoldenRaspberryBadge() {
  return (
    <span className={styles.badge} aria-label="Huy chương Mâm xôi vàng">
      <span className={styles.icon}>🏆</span>
      <span className={styles.label}>Mâm xôi vàng</span>
    </span>
  );
}
