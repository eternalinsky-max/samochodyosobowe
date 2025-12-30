'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { auth } from '@/lib/firebase';
import { useAuthUser } from '@/lib/useAuthUser';

/**
 * Кнопки дій над вакансією: Edytuj / Usuń
 *
 * Приймає:
 * - jobId?: string
 * - job?: { id, ownerId?, status?, User?: { firebaseUid? } }
 *
 * Показує кнопки лише якщо користувач — власник або адмін.
 * НІКОЛИ не робить запити, якщо немає валідного id.
 */
export default function JobActions({ jobId, job }) {
  const { user, loading } = useAuthUser();

  // Надійно визначаємо id з пропсів
  const id = useMemo(() => jobId || job?.id || null, [jobId, job]);

  // Ці поля можуть знадобитись для локальної перевірки прав
  const ownerFirebaseUid = job?.User?.firebaseUid || null;

  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Тягнемо себе з бекенду (щоб знати me.id / isAdmin)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!user) {
          setMe(null);
          return;
        }
        setChecking(true);
        const token = await user.getIdToken();
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setMe(data);
      } catch (e) {
        console.error('JobActions /api/auth/me error:', e);
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Перевіряємо право на редагування:
  // - якщо збігається firebaseUid власника з поточним
  // - або якщо me?.isAdmin === true
  const canEdit = useMemo(() => {
    if (!user) return false;
    if (me?.isAdmin) return true;
    if (ownerFirebaseUid && user.uid && ownerFirebaseUid === user.uid) return true;
    return false;
  }, [user, me, ownerFirebaseUid]);

  // Якщо немає id — взагалі нічого не показуємо (і не робимо жодних запитів)
  if (!id) return null;

  // Поки не знаємо статус користувача — можна показати скелетон або нічого
  if (loading || checking) {
    return (
      <div className="inline-flex gap-2">
        <div className="h-9 w-20 animate-pulse rounded-md bg-gray-100" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-gray-100" />
      </div>
    );
  }

  if (!canEdit) return null;

  async function handleDelete() {
    if (!confirm('Usunąć tę ofertę?')) return;
    try {
      setDeleting(true);
      const u = auth.currentUser;
      const token = u ? await u.getIdToken(true) : null;
      if (!token) {
        alert('Najpierw zaloguj się.');
        return;
      }
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Після видалення — на список
      window.location.href = '/jobs';
    } catch (e) {
      console.error('DELETE job error:', e);
      alert(`Błąd usuwania: ${e.message || 'nieznany'}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/jobs/${id}/edit`} className="btn btn-secondary">
        Edytuj
      </Link>
      <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Usuwanie…' : 'Usuń'}
      </button>
    </div>
  );
}
