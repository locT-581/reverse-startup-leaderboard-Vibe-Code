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
              👶 Kích hoạt Chế độ Khoan dung!
            </h2>
            <p className={styles.subtitle}>
              Hãy làm cho mọi thứ dễ dàng hơn một chút cho các nhu cầu đặc biệt của bạn.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.badgeShowcase}>
            <span className={styles.badgeEmoji} role="img" aria-label="Toddler Badge">👶</span>
            <span className={styles.badgeText}>Chế độ Trẻ chập chững đang hoạt động</span>
          </div>
          <p className={styles.description}>
            Chúng tôi nhận thấy bạn đã không thể tương tác với các nút bấm đơn giản, cao cấp, được tối ưu hóa cao của chúng tôi 10 lần liên tiếp.
            Để phù hợp với mức độ phối hợp vận động của bạn, tất cả các hoạt động né tránh của nút bấm và CAPTCHA nhà tài trợ doanh nghiệp hiện đã bị vô hiệu hóa.
            Một huy hiệu sỉ nhục tặng kèm đã được ghim vào hồ sơ của bạn.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={dismissActivationModal}
            id="dismiss-mercy-modal-btn"
          >
            Tôi chấp nhận những hạn chế của mình
          </button>
        </div>
      </div>
    </div>
  );
}
