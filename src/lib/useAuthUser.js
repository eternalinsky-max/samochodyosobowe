// src/lib/useAuthUser.js
'use client';

import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

/**
 * Відстежує поточного користувача Firebase та стан завантаження.
 * Автоматично оновлює ID-токен кожні ~59 хвилин (приблизний lifetime токена).
 */
export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Якщо рендериться на сервері — просто вихід
    if (typeof window === 'undefined') return;

    const unsub = auth.onIdTokenChanged((u) => {
      setUser(u ?? null);
      setLoading(false);
    });

    // оновлення токена раз на 59 хвилин
    const interval = setInterval(async () => {
      try {
        const u = auth.currentUser;
        if (u) await u.getIdToken(true);
      } catch (err) {
        console.warn('[useAuthUser] token refresh failed:', err);
      }
    }, 59 * 60 * 1000);

    return () => {
      unsub?.();
      clearInterval(interval);
    };
  }, []);

  return { user, loading };
}
