'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { actionGetUserInventory, actionDeploySabotage } from '../../../app/actions/sabotage';
import styles from './SabotageSelectionModal.module.css';

interface SabotageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  postAuthorId: string;
}

const SABOTAGE_TYPES = [
  {
    effectType: 'blur',
    name: 'Gói Làm mờ',
    description: "Làm mờ bài đăng của đối thủ trên bảng xếp hạng và toàn bộ màn hình của họ.",
    effect: 'Khấu trừ 100 kcal',
  },
  {
    effectType: 'comic_sans',
    name: 'Gói Comic Sans',
    description: "Bắt buộc giao diện người dùng của đối thủ hiển thị bằng phông chữ Comic Sans.",
    effect: 'Khấu trừ 150 kcal',
  },
  {
    effectType: 'papyrus',
    name: 'Gói Papyrus',
    description: "Bắt buộc giao diện người dùng của đối thủ hiển thị bằng phông chữ Papyrus.",
    effect: 'Khấu trừ 150 kcal',
  },
  {
    effectType: 'deduct_calories',
    name: 'Gói Trừ Calo',
    description: "Khấu trừ trực tiếp 500 Calo lãng phí từ bài đăng mục tiêu.",
    effect: 'Khấu trừ 500 kcal',
  },
] as const;

export default function SabotageSelectionModal({
  isOpen,
  onClose,
  postId,
  postTitle,
  postAuthorId,
}: SabotageSelectionModalProps) {
  const [inventory, setInventory] = useState<Record<string, number>>({
    blur: 0,
    comic_sans: 0,
    papyrus: 0,
    deduct_calories: 0,
  });
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [isDeploying, startDeployTransition] = useTransition();

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      setError(null);
      setSuccess(false);
      setSelectedEffect(null);

      // Fetch user inventory
      startTransition(async () => {
        const res = await actionGetUserInventory();
        if (res.success && res.data) {
          const invMap: Record<string, number> = {
            blur: 0,
            comic_sans: 0,
            papyrus: 0,
            deduct_calories: 0,
          };
          res.data.forEach((item) => {
            invMap[item.effectType] = item.count;
          });
          setInventory(invMap);
        } else {
          setError(res.error?.message || 'Tải kho đồ thất bại.');
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeploy = () => {
    if (!selectedEffect) return;
    const count = inventory[selectedEffect] || 0;
    if (count <= 0) return;

    setError(null);
    setSuccess(false);

    startDeployTransition(async () => {
      const res = await actionDeploySabotage(postId, selectedEffect);
      if (res.success) {
        setSuccess(true);
        // Decrement local inventory count
        setInventory((prev) => ({
          ...prev,
          [selectedEffect]: Math.max(0, prev[selectedEffect] - 1),
        }));
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.error?.message || 'Kích hoạt phá hoại thất bại.');
      }
    });
  };

  const totalInventoryCount = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sabotage-modal-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 id="sabotage-modal-title" className={styles.title}>
              Phá hoại Mô hình 😈
            </h2>
            <p className={styles.subtitle}>
              Kích hoạt sự hỗn loạn thị giác chống lại <strong>{postTitle}</strong>.
            </p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            disabled={isDeploying}
          >
            &times;
          </button>
        </div>

        <div className={styles.modalContent}>
          {error && (
            <div className={`${styles.message} ${styles.error}`} role="alert">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className={`${styles.message} ${styles.success}`} role="alert">
              🎉 Đã kích hoạt phá hoại thành công! Calo đã bị khấu trừ.
            </div>
          )}

          {isPending ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} role="status"></div>
              <p>Đang mở kho vũ khí của bạn...</p>
            </div>
          ) : (
            <div className={styles.inventorySection}>
              {totalInventoryCount === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>
                    Nỗ lực tốt đấy, nhưng kho vũ khí của bạn trống rỗng. Hãy ghé cửa hàng để mua một ít sức mạnh trước!
                  </p>
                  <Link href="/sabotage-store" className={styles.storeLink} onClick={onClose}>
                    🛒 Bổ sung kho tại Cửa hàng Phá hoại
                  </Link>
                </div>
              ) : (
                <>
                  <div className={styles.inventoryGrid}>
                    {SABOTAGE_TYPES.map((type) => {
                      const count = inventory[type.effectType] || 0;
                      const isDisabled = count <= 0 || isDeploying;
                      const isSelected = selectedEffect === type.effectType;

                      return (
                        <div
                          key={type.effectType}
                          className={`${styles.inventoryCard} ${isSelected ? styles.selected : ''
                            } ${isDisabled ? styles.disabled : ''}`}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedEffect(isSelected ? null : type.effectType);
                            }
                          }}
                        >
                          <div className={styles.cardHeader}>
                            <span className={styles.cardName}>{type.name}</span>
                            <span className={styles.cardCount}>Sở hữu: {count}</span>
                          </div>
                          <p className={styles.cardDescription}>{type.description}</p>
                          <span className={styles.cardEffect}>{type.effect}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={onClose}
                      disabled={isDeploying}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className={styles.deployBtn}
                      onClick={handleDeploy}
                      disabled={!selectedEffect || isDeploying}
                    >
                      {isDeploying ? 'Đang kích hoạt...' : 'Kích hoạt'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
