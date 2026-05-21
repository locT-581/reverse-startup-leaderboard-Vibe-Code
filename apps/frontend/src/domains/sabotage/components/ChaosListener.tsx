'use client';

import { useEffect } from 'react';
import { socket } from '@/core/api/socket.client';
import { useChaosStore } from '@/core/store/useChaosStore';
import { useAuthStore } from '@/core/store/useAuthStore';

export default function ChaosListener() {
  const addSabotage = useChaosStore((s) => s.addSabotage);
  const clearExpired = useChaosStore((s) => s.clearExpired);
  const activeSabotages = useChaosStore((s) => s.activeSabotages);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!socket) return;
    
    if (!socket.connected) {
      socket.connect();
    }

    const handleSabotage = (data: { targetId: string; effectType: string; authorId: string }) => {
      addSabotage({
        id: Math.random().toString(),
        targetId: data.targetId,
        effectType: data.effectType,
        authorId: data.authorId,
        expiresAt: Date.now() + 15000,
      });
    };

    socket.on('sabotage.deployed', handleSabotage);

    return () => {
      if (socket) {
        socket.off('sabotage.deployed', handleSabotage);
      }
    };
  }, [addSabotage]);

  useEffect(() => {
    const interval = setInterval(() => {
      clearExpired();
    }, 1000);

    return () => clearInterval(interval);
  }, [clearExpired]);

  useEffect(() => {
    // Clear all sabotage classes first
    document.body.classList.remove('sabotage-blur', 'sabotage-comic-sans', 'sabotage-papyrus');

    if (currentUser) {
      const targetSabotages = activeSabotages.filter(
        (s) => s.authorId === currentUser.id && s.effectType !== 'deduct_calories'
      );
      targetSabotages.forEach((s) => {
        document.body.classList.add(`sabotage-${s.effectType}`);
      });
    }
  }, [activeSabotages, currentUser]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('sabotage-blur', 'sabotage-comic-sans', 'sabotage-papyrus');
    };
  }, []);

  return null;
}
