'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './AdCaptchaModal.module.css';

interface AdCaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  bypass?: boolean; // For future Story 2.4 Mercy Threshold hookability
}

const SPONSOR_ADS = [
  'SynergyCoin: Monetizing paradigm shifts via proof-of-synergy blockchains. Pivot today!',
  'Paradigmer.io: Leverage cloud-native, deep-learning, enterprise-grade synergy for 10x deliverables.',
  'MoonScale.io: Disruption-as-a-Service targeting frictionless, hyper-growth vertical integrations.',
  'Deliverablely: Deep dive into leveraging bandwidth to circle back on low-hanging fruits.',
  'KPI-Accelerate: Streamlining microservices scaling ecosystems to maximize resource monetization.'
];

export default function AdCaptchaModal({
  isOpen,
  onClose,
  onSuccess,
  bypass = false
}: AdCaptchaModalProps) {
  const [adIndex, setAdIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const currentAd = SPONSOR_ADS[adIndex];
  const isMatch = userInput.trim() === currentAd.trim();

  // Track if prefers-reduced-motion is active
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // When bypass is enabled, skip the captcha entirely and call onSuccess immediately
  useEffect(() => {
    if (isOpen && bypass) {
      handleSuccessSubmit();
    }
  }, [isOpen, bypass]);

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setUserInput('');
      setErrorMessage(null);
      setIsSubmitting(false);
      resetButtonPosition();
      modalRef.current?.focus();
    } else {
      // Pick a random ad starting point for the next open
      const randomIndex = Math.floor(Math.random() * SPONSOR_ADS.length);
      setAdIndex(randomIndex);
    }
  }, [isOpen]);

  useEffect(() => {
    // Randomize initial ad index on client mount to avoid hydration mismatch
    setAdIndex(Math.floor(Math.random() * SPONSOR_ADS.length));
  }, []);

  const resetButtonPosition = () => {
    const button = skipBtnRef.current;
    if (button) {
      button.style.setProperty('--skip-x', '0px');
      button.style.setProperty('--skip-y', '0px');
    }
  };

  const handleSuccessSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch || isSubmitting) return;
    handleSuccessSubmit();
  };

  const handleSkipAd = () => {
    // Recursive ad loop: pick another random ad, different from the current one
    let nextIndex = adIndex;
    while (nextIndex === adIndex) {
      nextIndex = Math.floor(Math.random() * SPONSOR_ADS.length);
    }
    setAdIndex(nextIndex);
    setUserInput('');
    setErrorMessage('Skip failed! To access your content, please verify a new sponsor.');
    resetButtonPosition();
  };

  const handleButtonEvasion = () => {
    if (typeof document === 'undefined') return;
    const button = skipBtnRef.current;
    if (!button || reducedMotion || document.activeElement === button) return;

    // Relocate to a random coordinate within bounds
    // We'll use values between -140px and 140px for X, and -80px and 80px for Y
    const currentX = parseFloat(button.style.getPropertyValue('--skip-x') || '0');
    const currentY = parseFloat(button.style.getPropertyValue('--skip-y') || '0');

    let newX = (Math.random() - 0.5) * 280;
    let newY = (Math.random() - 0.5) * 160;

    // Ensure it actually moves a minimum distance to prevent user from getting lucky
    if (Math.abs(newX - currentX) < 40) {
      newX = newX > 0 ? newX + 50 : newX - 50;
    }
    if (Math.abs(newY - currentY) < 30) {
      newY = newY > 0 ? newY + 40 : newY - 40;
    }

    button.style.setProperty('--skip-x', `${newX}px`);
    button.style.setProperty('--skip-y', `${newY}px`);
  };

  if (!isOpen || bypass) return null;

  return (
    <div className={styles.overlay} onClick={onClose} id="ad-captcha-overlay">
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-captcha-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 id="ad-captcha-title" className={styles.title}>
              Sponsor Message Verification
            </h2>
            <p className={styles.subtitle}>
              Prove you value enterprise monetization before publishing. Copy the corporate truth exactly.
            </p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close sponsor verification"
          >
            &times;
          </button>
        </div>

        <div className={styles.adBanner}>
          <div className={styles.adTag}>SPONSORED AD</div>
          <p className={styles.adText} id="sponsor-ad-text">{currentAd}</p>
        </div>

        <div className={styles.formContent}>
          <form onSubmit={handleVerifySubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="ad-verification-input" className={styles.label}>
                Type the sponsored message exactly:
              </label>
              <textarea
                id="ad-verification-input"
                className={styles.textarea}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type here..."
                disabled={isSubmitting}
                aria-invalid={!isMatch && userInput.length > 0}
                aria-describedby={!isMatch && userInput.length > 0 ? 'ad-match-error' : undefined}
                rows={3}
              />

              {!isMatch && userInput.trim().length > 0 && (
                <div id="ad-match-error" className={styles.errorMessage} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
                  Input does not match the sponsored text. Case-sensitive.
                </div>
              )}

              {errorMessage && (
                <div className={styles.generalError} role="alert">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button
                ref={skipBtnRef}
                type="button"
                className={styles.skipBtn}
                onClick={handleSkipAd}
                onMouseEnter={handleButtonEvasion}
                onMouseMove={handleButtonEvasion}
                style={{
                  '--skip-x': '0px',
                  '--skip-y': '0px'
                } as React.CSSProperties}
                aria-label="Skip Ad"
              >
                Skip Ad
              </button>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!isMatch || isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
