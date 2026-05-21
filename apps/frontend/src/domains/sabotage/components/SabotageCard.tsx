'use client';

import React, { useState, useTransition } from 'react';
import { SabotagePack, actionCreateCheckoutSession } from '../../../app/actions/sabotage';
import styles from './SabotageCard.module.css';

interface SabotageCardProps {
  pack: SabotagePack;
}

const EFFECT_EMOJIS: Record<string, string> = {
  blur: '🌫️',
  comic_sans: '🔤',
  papyrus: '📜',
  deduct_calories: '⚡',
};

export const SabotageCard: React.FC<SabotageCardProps> = ({ pack }) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const emoji = EFFECT_EMOJIS[pack.effectType] || '🎁';
  const priceFormatted = (pack.price / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleBuy = () => {
    setError(null);
    startTransition(async () => {
      const response = await actionCreateCheckoutSession(pack.id);
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError(response.error?.message || 'Failed to initiate purchase.');
      }
    });
  };

  return (
    <div className={styles.card} data-testid={`sabotage-card-${pack.effectType}`} data-pack-id={pack.id}>
      <div className={styles.emojiContainer}>{emoji}</div>
      <h3 className={styles.title}>{pack.name}</h3>
      <p className={styles.description}>{pack.description}</p>
      {error && <p className={styles.cardError} data-testid={`card-error-${pack.effectType}`}>{error}</p>}
      <div className={styles.footer}>
        <span className={styles.price}>{priceFormatted}</span>
        <button 
          className={styles.buyButton} 
          onClick={handleBuy}
          disabled={isPending}
          data-testid={`buy-button-${pack.effectType}`}
        >
          {isPending ? 'Connecting...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
};
