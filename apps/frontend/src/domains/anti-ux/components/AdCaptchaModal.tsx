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
  'SynergyCoin: Kiếm tiền từ chuyển dịch mô hình (paradigm shift) thông qua blockchain bằng chứng synergy. Tái định hướng (pivot) ngay!',
  'Paradigmer.io: Tận dụng (leverage) synergy cấp doanh nghiệp, học sâu, thuần đám mây cho các kết quả bàn giao (deliverables) x10.',
  'MoonScale.io: Dịch vụ phá vỡ (disruption-as-a-service) nhắm mục tiêu vào các tích hợp dọc tăng trưởng nhanh (scale), không ma sát.',
  'Deliverablely: Đi sâu vào việc tận dụng (leveraging) băng thông để quay lại với các cơ hội dễ đạt được.',
  'KPI-Accelerate: Hợp lý hóa hệ sinh thái quy mô (scaling) microservices để tối đa hóa việc kiếm tiền từ tài nguyên.'
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
      setErrorMessage(err.message || 'Xác minh thất bại. Vui lòng thử lại.');
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
    setErrorMessage('Bỏ qua thất bại! Để truy cập nội dung, vui lòng xác minh nhà tài trợ mới.');
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
              Xác minh thông điệp tài trợ
            </h2>
            <p className={styles.subtitle}>
              Chứng minh bạn coi trọng việc kiếm tiền doanh nghiệp trước khi xuất bản. Sao chép chính xác sự thật của tập đoàn.
            </p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng xác minh nhà tài trợ"
          >
            &times;
          </button>
        </div>

        <div className={styles.adBanner}>
          <div className={styles.adTag}>QUẢNG CÁO ĐƯỢC TÀI TRỢ</div>
          <p className={styles.adText} id="sponsor-ad-text">{currentAd}</p>
        </div>

        <div className={styles.formContent}>
          <form onSubmit={handleVerifySubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="ad-verification-input" className={styles.label}>
                Nhập chính xác thông điệp được tài trợ:
              </label>
              <textarea
                id="ad-verification-input"
                className={styles.textarea}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Nhập vào đây..."
                disabled={isSubmitting}
                aria-invalid={!isMatch && userInput.length > 0}
                aria-describedby={!isMatch && userInput.length > 0 ? 'ad-match-error' : undefined}
                rows={3}
              />

              {!isMatch && userInput.trim().length > 0 && (
                <div id="ad-match-error" className={styles.errorMessage} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
                  Đầu vào không khớp với văn bản được tài trợ. Phân biệt chữ hoa chữ thường.
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
                aria-label="Bỏ qua quảng cáo"
              >
                Bỏ qua quảng cáo
              </button>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!isMatch || isSubmitting}
              >
                {isSubmitting ? 'Đang xác minh...' : 'Xác minh & Gửi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
