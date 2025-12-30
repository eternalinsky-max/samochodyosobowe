'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import UserRatingBadge from '@/components/UserRatingBadge';
import { auth } from '@/lib/firebase';
import { useAuthUser } from '@/lib/useAuthUser';

export default function ProfilePage() {
  const { user, loading } = useAuthUser();
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let aborted = false;
    (async () => {
      if (loading) return;
      if (!user) return;

      try {
        setBusy(true);
        setErr('');

        const token = await auth.currentUser?.getIdToken(true);
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!aborted) setMe(data);
      } catch (e) {
        if (!aborted) setErr(e.message || 'Błąd');
      } finally {
        if (!aborted) setBusy(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [user, loading]);

  if (loading || busy) {
    return (
      <section className="px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-xl font-bold">Mój profil</h1>
        <div className="rounded-xl border bg-white p-6 text-gray-600">Ładowanie…</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-xl font-bold">Mój profil</h1>
        <div className="rounded-xl border bg-white p-6 text-gray-600">Najpierw się zaloguj.</div>
      </section>
    );
  }

  // Дані з Firebase:
  const display = user.displayName || user.email || 'Użytkownik';
  const photoURL = user.photoURL || null;

  // Дані з бекенду (/api/auth/me) — можуть містити рейтинги
  const workerAvg = me?.ratingWorkerAvg ?? 0;
  const workerCount = me?.ratingWorkerCount ?? 0;
  const workerBayes = me?.ratingWorkerBayesScore ?? 0;

  return (
    <section className="px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-bold">Mój profil</h1>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="shrink-0">
            {photoURL ? (
              <Image
                src={photoURL}
                alt={`Avatar ${display}`}
                width={72}
                height={72}
                sizes="72px"
                className="rounded-full border bg-white object-cover"
              />
            ) : (
              <div className="grid size-[72px] place-items-center rounded-full border bg-gray-50 text-sm text-gray-600">
                {(display || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-semibold">{display}</div>
              <UserRatingBadge avg={workerAvg} count={workerCount} bayes={workerBayes} />
            </div>
            {user.email && <div className="mt-1 text-sm text-gray-600">{user.email}</div>}
          </div>
        </div>

        {err && <div className="mt-3 text-sm text-red-600">Błąd: {err}</div>}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="text-gray-500">Ocena jako pracownik</div>
            <div className="mt-1">
              <UserRatingBadge avg={workerAvg} count={workerCount} bayes={workerBayes} />
            </div>
          </div>
          {/* можна додати інші картки з налаштуваннями */}
        </div>
      </div>
    </section>
  );
}
