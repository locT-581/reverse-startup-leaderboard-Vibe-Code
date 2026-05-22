'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { actionLogin, actionRegister } from '../actions/auth';
import { useAuthStore } from '../../core/store/useAuthStore';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Tên người dùng không được để trống. Làm thế nào người khác đánh giá bạn được?');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự. Hãy làm nó khó bị hack hơn một chút.');
      return;
    }

    startTransition(async () => {
      const response = isLogin
        ? await actionLogin(username, password)
        : await actionRegister(username, password);

      if (response.success && response.data) {
        setUser(response.data.user);
        router.push('/profile');
      } else {
        setError(response.error?.message || 'Xác thực thất bại.');
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isLogin ? 'Đăng nhập' : 'Đăng ký'}
        </h1>
        <p className={styles.subtitle}>
          {isLogin
            ? 'Nhập thông tin của bạn để kiểm tra mức độ thất bại.'
            : 'Tham gia bảng xếp hạng của những tiềm năng kỹ thuật bị lãng phí.'}
        </p>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="username">
              Tên người dùng
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              placeholder="vd: CodeWaster99"
              autoComplete="username"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isPending}
          >
            {isPending
              ? (isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...')
              : (isLogin ? 'Vào' : 'Tạo tài khoản')}
          </button>
        </form>

        <div className={styles.toggleContainer}>
          {isLogin ? "Mới ở đây? " : "Đã có tài khoản? "}
          <button
            type="button"
            className={styles.toggleLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            disabled={isPending}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
