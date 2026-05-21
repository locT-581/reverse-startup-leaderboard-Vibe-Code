'use client';

import React, { useState, useEffect, useRef } from 'react';
import HostileInput from './HostileInput';
import { actionCreatePost } from '../../../app/actions/posts';
import styles from './CreatePostModal.module.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  // Reset form when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setTitleError(false);
      setContentError(false);
      setSubmitError(null);
      setSubmitSuccess(false);
    } else {
      // Focus modal when it opens for accessibility
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titleError || contentError || !title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const res = await actionCreatePost(title, content);

    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setSubmitError(res.error?.message || 'Failed to propose paradigm.');
    }
  };

  const isButtonDisabled = isSubmitting || titleError || contentError || !title.trim() || !content.trim();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 id="modal-title" className={styles.title}>Propose a Paradigm</h2>
            <p className={styles.subtitle}>
              Share your most convoluted, scale-ready ideas. Real-time synergy will be calculated.
            </p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className={styles.formContent}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <HostileInput
              type="text"
              id="post-title-input"
              value={title}
              onChange={setTitle}
              placeholder="e.g. leverage synergy scale paradigm"
              validationType="title"
              onErrorChange={setTitleError}
              label="Paradigm Title"
            />

            <HostileInput
              type="textarea"
              id="post-content-input"
              value={content}
              onChange={setContent}
              placeholder="e.g. Pivot our cloud-native microservices ecosystem to touch base on deliverables..."
              validationType="content"
              onErrorChange={setContentError}
              label="Convoluted Explanation"
            />

            {submitError && (
              <div className={`${styles.message} ${styles.error}`} role="alert">
                ⚠️ {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className={`${styles.message} ${styles.success}`} role="alert">
                🎉 Paradigm successfully proposed! The leaderboard will update momentarily.
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isButtonDisabled}
              >
                {isSubmitting ? 'Proposing...' : 'Propose Paradigm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
