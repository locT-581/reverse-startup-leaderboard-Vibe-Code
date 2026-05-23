'use client';

import React, { useState, useEffect } from 'react';
import styles from './HostileInput.module.css';

const buzzwords = [
  'synergy', 'paradigm', 'bandwidth', 'leverage', 'monetize', 'disruptive', 'deliverables',
  'kpi', 'okr', 'cloud-native', 'game-changer', 'circle back', 'touch base',
  'low-hanging fruit', 'deep dive', 'microservices', 'ecosystem', 'scalability', 'scale',
  'pivoting', 'pivot'
];

interface HostileInputProps {
  type: 'text' | 'textarea';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id: string;
  validationType: 'title' | 'content' | 'comment';
  originalPostLength?: number;
  onErrorChange?: (hasError: boolean) => void;
  label: string;
  hideLabelVisually?: boolean;
}

export default function HostileInput({
  type,
  value,
  onChange,
  placeholder,
  id,
  validationType,
  originalPostLength,
  onErrorChange,
  label,
  hideLabelVisually = false,
}: HostileInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  const countBuzzwords = (val: string) => {
    if (!val || typeof val !== 'string') return 0;
    let tempText = val.toLowerCase();
    let count = 0;

    // Sort by length descending to match longer words first (e.g. 'scalability' before 'scale')
    const sortedWords = [...buzzwords].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const startBoundary = /^\w/.test(word) ? '\\b' : '';
      const endBoundary = /\w$/.test(word) ? '\\b' : '';
      const regex = new RegExp(startBoundary + escapedWord + endBoundary, 'gi');

      const matches = tempText.match(regex);
      if (matches) {
        count += matches.length;
        // Replace with spaces of equivalent length to prevent overlap matching
        tempText = tempText.replace(regex, (m) => ' '.repeat(m.length));
      }
    }
    return count;
  };

  const validate = (val: string): string | null => {
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (!trimmed) {
      return 'Trường này là bắt buộc. Không được để trống.';
    }

    if (validationType === 'title') {
      if (trimmed.length < 10 || countBuzzwords(trimmed) < 2) {
        return 'Tiêu đề của bạn thiếu synergy cần thiết. Vui lòng leverage thêm các paradigm.';
      }
    } else if (validationType === 'content') {
      if (trimmed.length < 50 || countBuzzwords(trimmed) < 3) {
        return 'Giải thích này dễ hiểu đến mức nguy hiểm. Hãy thêm synergy.';
      }
    } else if (validationType === 'comment') {
      const minLength = originalPostLength ?? 0;
      if (trimmed.length <= minLength) {
        return `Giải pháp của bạn chưa đủ độ dài. Nó bắt buộc phải vượt quá độ dài ${minLength} ký tự của bài đăng gốc.`;
      }
    }

    return null;
  };

  useEffect(() => {
    if (isTouched) {
      const errMsg = validate(value);
      setError(errMsg);
      if (onErrorChange) {
        onErrorChange(!!errMsg);
      }
    } else {
      const errMsg = validate(value);
      if (onErrorChange) {
        onErrorChange(!!errMsg);
      }
    }
  }, [value, isTouched, originalPostLength]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  const hasError = !!error;

  return (
    <div className={styles.container}>
      <label
        htmlFor={id}
        className={hideLabelVisually ? styles.visuallyHidden : styles.label}
      >
        {label}
      </label>

      {type === 'text' ? (
        <input
          type="text"
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${styles.input} ${hasError ? styles.inputError : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
      ) : (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${styles.textarea} ${hasError ? styles.textareaError : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
      )}

      {hasError && (
        <div id={`${id}-error`} className={styles.errorMessage} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
}
