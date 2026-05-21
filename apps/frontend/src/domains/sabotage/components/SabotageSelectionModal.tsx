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
    name: 'Blur Pack',
    description: "Blurs the targeted user's screen and their post on the leaderboard.",
    effect: 'Deducts 100 kcal',
  },
  {
    effectType: 'comic_sans',
    name: 'Comic Sans Pack',
    description: "Forces the targeted user's UI to render in Comic Sans.",
    effect: 'Deducts 150 kcal',
  },
  {
    effectType: 'papyrus',
    name: 'Papyrus Pack',
    description: "Forces the targeted user's UI to render in Papyrus.",
    effect: 'Deducts 150 kcal',
  },
  {
    effectType: 'deduct_calories',
    name: 'Calories Deduction',
    description: "A heavy direct hit to the target post's wasted calories.",
    effect: 'Deducts 500 kcal',
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
          setError(res.error?.message || 'Failed to fetch inventory.');
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
        setError(res.error?.message || 'Failed to deploy sabotage.');
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
              Sabotage Paradigm 😈
            </h2>
            <p className={styles.subtitle}>
              Deploy a visual disruption against <strong>{postTitle}</strong>.
            </p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
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
              🎉 Sabotage deployed successfully! Score has been deducted.
            </div>
          )}

          {isPending ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} role="status"></div>
              <p>Opening your arsenal...</p>
            </div>
          ) : (
            <div className={styles.inventorySection}>
              {totalInventoryCount === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>
                    Nice try, but your arsenal is empty. Visit the store to buy some power first!
                  </p>
                  <Link href="/sabotage-store" className={styles.storeLink} onClick={onClose}>
                    🛒 Restock at the Sabotage Storefront
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
                            <span className={styles.cardCount}>Owned: {count}</span>
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
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.deployBtn}
                      onClick={handleDeploy}
                      disabled={!selectedEffect || isDeploying}
                    >
                      {isDeploying ? 'Deploying...' : 'Deploy'}
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
