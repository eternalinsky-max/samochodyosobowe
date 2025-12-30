'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { auth } from '@/lib/firebase';

/**
 * Хук для роботи з відгуками:
 * - завантаження з пагінацією
 * - optimistic create/update (upsert)
 * - optimistic delete
 *
 * targetType: "JOB" | "COMPANY" | "USER"
 * targetId: string
 */
export function useReviews({ targetType, targetId, perPage = 10 }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const inflight = useRef(0);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('targetType', String(targetType || '').toUpperCase());
    p.set('targetId', String(targetId || ''));
    p.set('page', String(page));
    p.set('perPage', String(perPage));
    return p.toString();
  }, [targetType, targetId, page, perPage]);

  const reload = useCallback(async () => {
    if (!targetType || !targetId) return;
    inflight.current++;
    try {
      setLoading(true);
      setErr('');

      const res = await fetch(`/api/reviews?${query}`, { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items || []);
      setHasNext(!!data.hasNext);
      setTotal(data.total ?? null);
    } catch (e) {
      setErr(e.message || 'Błąd');
    } finally {
      inflight.current--;
      setLoading(inflight.current > 0);
    }
  }, [query, targetType, targetId]);

  useEffect(() => {
    setPage(1);
  }, [targetType, targetId, perPage]);

  useEffect(() => {
    reload();
  }, [reload]);

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  // optimistic upsert (create/update)
  const upsertReview = useCallback(
    async ({ ratingOverall, text }) => {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Brak autoryzacji');

      // optimistic: додаємо/оновлюємо «мій» відгук у списку
      const myUid = auth.currentUser?.uid;
      const optimisticId = `optimistic-${Date.now()}`;

      // Замінюємо/додаємо перший елемент — мій відгук (на сторінці 1)
      setItems((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((r) => r.User?.id === myUid || r.id?.startsWith('optimistic-'));
        const patch = {
          id: optimisticId,
          ratingOverall,
          text,
          createdAt: new Date().toISOString(),
          User: {
            id: myUid,
            displayName: auth.currentUser?.displayName || 'Ty',
            photoUrl: auth.currentUser?.photoURL || null,
          },
        };
        if (idx >= 0) copy[idx] = { ...copy[idx], ...patch };
        else copy.unshift(patch);
        return copy;
      });

      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetType,
            targetId,
            ratingOverall,
            text: (text || '').trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        // Після успіху перезавантажуємо першу сторінку — отримуємо реальний id і актуальні дані
        setPage(1);
        await reload();
      } catch (e) {
        // revert optimistic
        setItems((prev) => prev.filter((r) => r.id !== optimisticId));
        throw e;
      }
    },
    [targetType, targetId, reload],
  );

  // optimistic delete
  const deleteReview = useCallback(
    async (id) => {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Brak autoryzacji');

      const prev = items;
      setItems((cur) => cur.filter((r) => r.id !== id));

      try {
        const res = await fetch(`/api/reviews/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        // після видалення просто оновимо поточну сторінку
        await reload();
      } catch (e) {
        // відкотити
        setItems(prev);
        throw e;
      }
    },
    [items, reload],
  );

  return {
    items,
    loading,
    error: err,
    total,
    page,
    hasNext,
    nextPage,
    prevPage,
    setPage,
    reload,
    upsertReview,
    deleteReview,
  };
}
