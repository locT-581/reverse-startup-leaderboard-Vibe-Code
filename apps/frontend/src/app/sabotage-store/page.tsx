'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../core/store/useAuthStore';
import { actionGetMe } from '../actions/auth';
import { actionGetSabotagePacks, SabotagePack, actionGetUserInventory } from '../actions/sabotage';
import { SabotageCard } from '../../domains/sabotage/components/SabotageCard';
import styles from './page.module.css';

export default function SabotageStorePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [packs, setPacks] = useState<SabotagePack[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({
    blur: 0,
    comic_sans: 0,
    papyrus: 0,
    deduct_calories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    // 1. Check auth first
    if (!user) {
      startTransition(async () => {
        const response = await actionGetMe();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          router.push('/auth');
        }
      });
    }
  }, [user, setUser, router]);

  const fetchInventory = async () => {
    try {
      const response = await actionGetUserInventory();
      if (response.success && response.data) {
        const invMap: Record<string, number> = {
          blur: 0,
          comic_sans: 0,
          papyrus: 0,
          deduct_calories: 0,
        };
        response.data.forEach((item) => {
          invMap[item.effectType] = item.count;
        });
        setInventory(invMap);
      }
    } catch (err) {
      console.error('Failed to load user inventory:', err);
    }
  };

  useEffect(() => {
    // 2. Fetch packs and inventory once authenticated
    if (user) {
      async function loadData() {
        try {
          const packsRes = await actionGetSabotagePacks();
          if (packsRes.success && packsRes.data) {
            setPacks(packsRes.data);
          } else {
            setError(packsRes.error?.message || 'Không thể tải các Gói Phá hoại.');
          }

          await fetchInventory();
        } catch (err) {
          setError('Đã xảy ra lỗi không mong đợi khi tải các gói.');
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [user]);

  useEffect(() => {
    // 3. Handle query params (success, canceled) using window.location.search
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        setShowSuccess(true);
        router.replace('/sabotage-store');
      } else if (params.get('canceled') === 'true') {
        setShowCanceled(true);
        router.replace('/sabotage-store');
      }
    }
  }, [router]);

  if (!user || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <h2 className={styles.loadingText}>Đang khởi tạo Cửa hàng...</h2>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoArea}>
            <span className={styles.logoEmoji}>😈</span>
            <h1 className={styles.logoText}>Cửa hàng Phá hoại</h1>
          </div>
          <nav className={styles.nav}>
            <Link href="/" className={styles.backLink} data-testid="back-to-leaderboard">
              ← Quay lại Bảng xếp hạng
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.heroSection}>
          <h2 className={styles.heroTitle}>Chủ nghĩa Tư bản Trêu đùa</h2>
          <p className={styles.heroSubtitle}>
            Mua các gói gây ức chế được thiết kế riêng và phóng chúng trực tiếp lên bài đăng của đối thủ cạnh tranh. Trả tiền để thắng. Chơi để chọc tức.
          </p>
        </div>

        {/* Success and Cancel Banners */}
        {showSuccess && (
          <div className={styles.successBanner} data-testid="checkout-success-banner">
            <span className={styles.bannerIcon}>✅</span>
            <div className={styles.bannerTextContainer}>
              <h4 className={styles.bannerTitle}>Giao dịch thành công!</h4>
              <p className={styles.bannerMessage}>Tài khoản của bạn đã bị trừ tiền. Các thẻ Gói Phá hoại đã được thêm vào kho vũ khí của bạn.</p>
            </div>
            <button className={styles.closeBannerBtn} onClick={() => setShowSuccess(false)}>×</button>
          </div>
        )}

        {showCanceled && (
          <div className={styles.cancelBanner} data-testid="checkout-cancel-banner">
            <span className={styles.bannerIcon}>❌</span>
            <div className={styles.bannerTextContainer}>
              <h4 className={styles.bannerTitle}>Giao dịch đã hủy</h4>
              <p className={styles.bannerMessage}>Quá trình thanh toán đã bị hủy. Không có khoản phí nào được tính. Hãy chơi đẹp... hoặc thử lại.</p>
            </div>
            <button className={styles.closeBannerBtn} onClick={() => setShowCanceled(false)}>×</button>
          </div>
        )}

        {/* User Inventory Display */}
        <div className={styles.inventorySection} data-testid="user-inventory">
          <h3 className={styles.inventoryTitle}>Kho vũ khí Phá hoại của bạn</h3>
          <div className={styles.inventoryGrid}>
            <div className={styles.inventoryItem} data-testid="inv-blur">
              <span className={styles.inventoryEmoji}>🌫️</span>
              <span className={styles.inventoryName}>Làm mờ:</span>
              <span className={styles.inventoryCount}>{inventory.blur}</span>
            </div>
            <div className={styles.inventoryItem} data-testid="inv-comic_sans">
              <span className={styles.inventoryEmoji}>🔤</span>
              <span className={styles.inventoryName}>Comic Sans:</span>
              <span className={styles.inventoryCount}>{inventory.comic_sans}</span>
            </div>
            <div className={styles.inventoryItem} data-testid="inv-papyrus">
              <span className={styles.inventoryEmoji}>📜</span>
              <span className={styles.inventoryName}>Papyrus:</span>
              <span className={styles.inventoryCount}>{inventory.papyrus}</span>
            </div>
            <div className={styles.inventoryItem} data-testid="inv-deduct_calories">
              <span className={styles.inventoryEmoji}>⚡</span>
              <span className={styles.inventoryName}>Trừ Calo:</span>
              <span className={styles.inventoryCount}>{inventory.deduct_calories}</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className={styles.errorBanner} data-testid="store-error">
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        ) : (
          <div className={styles.packsGrid} data-testid="packs-grid">
            {packs.map((pack) => (
              <SabotageCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </main>

      <footer className={styles.pageFooter}>
        <p>© {new Date().getFullYear()} Troll Capitalism Inc. Không hoàn tiền. Khiếu nại sẽ làm giảm calo.</p>
      </footer>
    </div>
  );
}
