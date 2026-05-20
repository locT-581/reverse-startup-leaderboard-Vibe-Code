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
      setError('Username cannot be empty. How else will people judge you?');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters. Let us make it slightly harder to hack.');
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
        setError(response.error?.message || 'Authentication failed.');
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isLogin ? 'Log In' : 'Register'}
        </h1>
        <p className={styles.subtitle}>
          {isLogin
            ? 'Enter your credentials to check your failure levels.'
            : 'Join the leaderboard of wasted engineering potential.'}
        </p>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              placeholder="e.g. CodeWaster99"
              autoComplete="username"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              Password
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
              ? (isLogin ? 'Logging In...' : 'Registering...')
              : (isLogin ? 'Enter' : 'Create Account')}
          </button>
        </form>

        <div className={styles.toggleContainer}>
          {isLogin ? "New here? " : "Already have an account? "}
          <button
            type="button"
            className={styles.toggleLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            disabled={isPending}
          >
            {isLogin ? 'Register now' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
