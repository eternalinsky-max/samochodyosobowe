// src/app/post-job/PostJobClient.jsx
'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { auth } from '@/lib/firebase';
import { withAuth } from '@/lib/withAuth';

function PostJobPage({ user }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function getIdTokenSafe() {
    if (user?.getIdToken) return user.getIdToken(true);
    if (auth?.currentUser) return auth.currentUser.getIdToken(true);
    return null;
  }

  function parseIntOrNull(v) {
    const s = String(v ?? '').trim();
    if (s === '') return null;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Wpisz tytuł oferty.');
      return;
    }

    const token = await getIdTokenSafe();
    if (!token) {
      router.push('/login?next=/post-job');
      return;
    }

    const payload = {
      title: title.trim(),
      description: String(description || ''),
      city: city.trim() || null,
      salaryMin: parseIntOrNull(salaryMin),
      salaryMax: parseIntOrNull(salaryMax),
      isRemote: Boolean(isRemote),
      // tagsCsv, status — за бажанням можна додати пізніше
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        let msg = `HTTP ${res.status}`;
        if (ct.includes('application/json')) {
          const data = await res.json().catch(() => ({}));
          msg = data?.error || msg;
        } else {
          msg = (await res.text().catch(() => '')) || msg;
        }
        setFormError(msg);
        return;
      }

      // success
      setTitle('');
      setDescription('');
      setCity('');
      setSalaryMin('');
      setSalaryMax('');
      setIsRemote(false);
      router.push('/jobs');
    } catch (err) {
      console.error(err);
      setFormError('Błąd sieci (spróbuj ponownie).');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-soft">
      <h1 className="mb-1 text-2xl font-bold">Dodaj ofertę</h1>
      <p className="mb-6 text-gray-600">
        Zalogowano jako: {user?.email || user?.displayName || 'użytkownik'}
      </p>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Tytuł oferty *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={5}
          placeholder="Opis oferty"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Miasto (opcjonalnie)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Minimalne wynagrodzenie"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            inputMode="numeric"
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Maksymalne wynagrodzenie"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            inputMode="numeric"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            checked={isRemote}
            onChange={(e) => setIsRemote(e.target.checked)}
          />
          Zdalnie
        </label>

        <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
          {submitting ? 'Dodawanie…' : 'Dodaj ofertę'}
        </button>
      </form>
    </section>
  );
}

const AuthedPostJob = withAuth(PostJobPage, {
  onUnauthorized(router, nextUrl) {
    router.replace(`/login?next=${encodeURIComponent(nextUrl)}`);
  },
  loadingFallback: <div className="p-6 text-center text-gray-600">Sprawdzanie uprawnień…</div>,
});

export default AuthedPostJob;
