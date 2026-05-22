'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMercyStore } from '../../../core/store/useMercyStore';
import { actionSubmitVote } from '../../../app/actions/posts';
import styles from './EvasiveButton.module.css';

interface EvasiveButtonProps {
  targetId: string;
  targetType: 'post' | 'comment';
  onSuccess?: (data: any) => void;
}

export default function EvasiveButton({
  targetId,
  targetType,
  onSuccess
}: EvasiveButtonProps) {
  const [dodges, setDodges] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isKeyboardUserRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const mercyActive = useMercyStore((state) => state.isMercyActive);
  const incrementFailures = useMercyStore((state) => state.incrementFailures);

  // 1. Detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // 2. Keyboard vs Mouse user detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        isKeyboardUserRef.current = true;
        setIsKeyboardUser(true);
      }
    };
    const handleMouseMove = () => {
      isKeyboardUserRef.current = false;
      setIsKeyboardUser(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Reset offset and state when Mercy Mode is activated
  useEffect(() => {
    if (mercyActive) {
      setOffset({ x: 0, y: 0 });
      const btn = buttonRef.current;
      if (btn) {
        btn.style.setProperty('--offset-x', '0px');
        btn.style.setProperty('--offset-y', '0px');
      }
      setIsVibrating(false);
      setComboCount(0);
      setDodges(0);
    }
  }, [mercyActive]);

  // 3. Evasion Proximity Event Handler (Mouse only)
  useEffect(() => {
    if (
      isVibrating ||
      cooldownLeft > 0 ||
      reducedMotion ||
      mercyActive ||
      isKeyboardUserRef.current ||
      isKeyboardUser
    ) {
      return;
    }

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      const btn = buttonRef.current;
      if (!btn) return;

      // Do not evade if the button is currently keyboard-focused
      if (document.activeElement === btn) return;

      const rect = btn.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - btnCenterX;
      const dy = e.clientY - btnCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 50) {
        // Compute escape angle
        const angle = Math.atan2(dy, dx);
        // Translate in opposite direction
        const moveDistance = 80 + Math.random() * 50;
        const newOffsetX = offset.x - Math.cos(angle) * moveDistance;
        const newOffsetY = offset.y - Math.sin(angle) * moveDistance;

        // Clamp to keep button on-screen
        const clampX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, newOffsetX));
        const clampY = Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, newOffsetY));

        setOffset({ x: clampX, y: clampY });
        btn.style.setProperty('--offset-x', `${clampX}px`);
        btn.style.setProperty('--offset-y', `${clampY}px`);

        setDodges((d) => {
          const next = d + 1;
          if (next >= 3) {
            setIsVibrating(true);
          }
          return next;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMoveGlobal);
    return () => window.removeEventListener('mousemove', handleMouseMoveGlobal);
  }, [isVibrating, cooldownLeft, reducedMotion, mercyActive, isKeyboardUser, offset]);

  // 4. Global Click Outside handler (For resetting combo)
  useEffect(() => {
    if (!isVibrating) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const btn = buttonRef.current;
      if (btn && btn.contains(e.target as Node)) {
        return; // Clicked the button itself
      }
      triggerComboReset('Mức độ đồng bộ (synergy) quá thấp!');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isVibrating]);

  // 5. Cooldown counter effect
  useEffect(() => {
    if (cooldownLeft === 0) return;
    const interval = setInterval(() => {
      setCooldownLeft((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  // 6. Tooltip autohide
  useEffect(() => {
    if (tooltip) {
      const t = setTimeout(() => {
        setTooltip(null);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [tooltip]);

  // 7. Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerComboReset = (reason: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setComboCount(0);
    setDodges(0);
    setIsVibrating(false);

    // Relocate to a random spot to start over
    const newX = (Math.random() - 0.5) * 160;
    const newY = (Math.random() - 0.5) * 120;
    setOffset({ x: newX, y: newY });
    const btn = buttonRef.current;
    if (btn) {
      btn.style.setProperty('--offset-x', `${newX}px`);
      btn.style.setProperty('--offset-y', `${newY}px`);
    }

    setTooltip(reason);
    incrementFailures();
  };

  // Web Audio synth airhorn effect
  const playAirhorn = () => {
    try {
      let ctx = audioCtxRef.current;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!ctx && AudioContextClass) {
        ctx = new AudioContextClass();
        audioCtxRef.current = ctx;
      }
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const frequencies = [220, 222, 329.63, 440, 443];
      const oscillators = frequencies.map((f) => {
        const osc = ctx!.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, ctx!.currentTime);
        return osc;
      });

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      oscillators.forEach((osc) => osc.connect(gainNode));
      gainNode.connect(ctx!.destination);

      oscillators.forEach((osc) => {
        osc.start();
        osc.stop(ctx!.currentTime + 1.2);
      });
    } catch (err) {
      console.error('Failed to play synth airhorn:', err);
    }
  };

  // HTML5 Canvas confetti explosion
  const triggerConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7a00'];
    const particles: any[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.7,
        vx: (Math.random() - 0.5) * 18,
        vy: -12 - Math.random() * 15,
        radius: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
        }
      });

      if (active) {
        requestAnimationFrame(render);
      } else {
        document.body.removeChild(canvas);
      }
    };

    render();
  };

  const triggerScreenShake = () => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    document.body.classList.add('screen-shake');
    setTimeout(() => {
      document.body.classList.remove('screen-shake');
    }, 500);
  };

  const handleSuccess = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await actionSubmitVote(targetId, targetType);
      if (res.success) {
        playAirhorn();
        triggerScreenShake();
        triggerConfetti();

        setCooldownLeft(5);
        setDodges(0);
        setComboCount(0);
        setIsVibrating(false);
        setOffset({ x: 0, y: 0 });

        const btn = buttonRef.current;
        if (btn) {
          btn.style.setProperty('--offset-x', '0px');
          btn.style.setProperty('--offset-y', '0px');
        }

        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        setTooltip(res.error?.message || 'Bình chọn thất bại');
      }
    } catch (err: any) {
      setTooltip(err.message || 'Đã xảy ra lỗi');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    const isBypass = reducedMotion || mercyActive;
    if (isVibrating || cooldownLeft > 0 || isBypass) return;

    // Initialize/resume AudioContext synchronously during user tap gesture
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }
    }

    e.preventDefault();

    const angle = Math.random() * Math.PI * 2;
    const moveDistance = 100 + Math.random() * 80;
    const newOffsetX = offset.x + Math.cos(angle) * moveDistance;
    const newOffsetY = offset.y + Math.sin(angle) * moveDistance;

    const clampX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, newOffsetX));
    const clampY = Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, newOffsetY));

    setOffset({ x: clampX, y: clampY });
    const btn = buttonRef.current;
    if (btn) {
      btn.style.setProperty('--offset-x', `${clampX}px`);
      btn.style.setProperty('--offset-y', `${clampY}px`);
    }

    setDodges((d) => {
      const next = d + 1;
      if (next >= 3) {
        setIsVibrating(true);
      }
      return next;
    });
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (cooldownLeft > 0 || isSubmitting || isSubmittingRef.current) return;

    // Initialize/resume AudioContext synchronously during user click gesture
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }
    }

    // Check if bypass triggers: reduced motion, mercy mode, or keyboard Tab/Enter (clientX/Y = 0)
    const isBypass =
      reducedMotion ||
      mercyActive ||
      isKeyboardUserRef.current ||
      isKeyboardUser ||
      e.detail === 0 ||
      (e.clientX === 0 && e.clientY === 0);

    if (isBypass) {
      await handleSuccess();
      return;
    }

    if (isVibrating) {
      if (comboCount === 0) {
        timerRef.current = setTimeout(() => {
          triggerComboReset('Quá chậm rồi, ông bạn!');
        }, 2000);
      }

      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);

      if (nextCombo >= 5) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        await handleSuccess();
      }
    } else {
      // Click was somehow registered while not vibrating and not bypassed. Treat as evasion.
      const angle = Math.random() * Math.PI * 2;
      const newOffsetX = offset.x + Math.cos(angle) * 120;
      const newOffsetY = offset.y + Math.sin(angle) * 120;
      const clampX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, newOffsetX));
      const clampY = Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, newOffsetY));

      setOffset({ x: clampX, y: clampY });
      const btn = buttonRef.current;
      if (btn) {
        btn.style.setProperty('--offset-x', `${clampX}px`);
        btn.style.setProperty('--offset-y', `${clampY}px`);
      }

      setDodges((d) => {
        const next = d + 1;
        if (next >= 3) {
          setIsVibrating(true);
        }
        return next;
      });
    }
  };

  const btnClasses = [
    styles.button,
    isVibrating ? styles.vibrating : '',
    cooldownLeft > 0 ? styles.cooldown : ''
  ]
    .filter(Boolean)
    .join(' ');

  let buttonText = '🔥 Calo Lãng phí';
  if (cooldownLeft > 0) {
    buttonText = `Hồi chiêu... (${cooldownLeft}s)`;
  } else if (isVibrating) {
    buttonText = comboCount > 0 ? `COMBO: ${comboCount}/5` : 'BẤM NHANH 5 LẦN!';
  }

  return (
    <div className={styles.container}>
      {tooltip && <div className={styles.tooltip}>{tooltip}</div>}
      <button
        ref={buttonRef}
        id={`vote-btn-${targetType}-${targetId}`}
        className={btnClasses}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        disabled={cooldownLeft > 0 || isSubmitting}
        style={{
          '--offset-x': `${offset.x}px`,
          '--offset-y': `${offset.y}px`
        } as React.CSSProperties}
        aria-label={`Bình chọn để trừ hạng cho ${targetType === 'post' ? 'bài viết' : 'bình luận'} này`}
      >
        {buttonText}
      </button>
    </div>
  );
}
