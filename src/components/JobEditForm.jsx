// src/components/JobEditForm.jsx
'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

export default function JobEditForm({ jobId, user, onSaved, className = '' }) {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = user ? await user.getIdToken() : null;
        const res = await fetch(`/api/jobs/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const job = await res.json();
        if (cancelled) return;
        setForm({
          title: job.title || '',
          description: job.description || '',
          city: job.city || '',
          isRemote: !!job.isRemote,
          salaryMin: job.salaryMin ?? '',
          salaryMax: job.salaryMax ?? '',
          // ВАЖЛИВО: компанія з великої — job.Company
          companyName: job.Company?.name || '',
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setForm(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, user]);

  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
    'text-gray-900 placeholder-gray-400 shadow-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-600 ' +
    'disabled:bg-gray-100 disabled:text-gray-500';

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form) return;

    if (!form.title || form.title.trim().length < 3) {
      alert('Tytuł jest za krótki (min 3 znaki).');
      return;
    }
    if (
      form.salaryMin !== '' &&
      form.salaryMax !== '' &&
      Number(form.salaryMax) < Number(form.salaryMin)
    ) {
      alert('Maksymalne wynagrodzenie nie może być mniejsze niż minimalne.');
      return;
    }

    const u = auth.currentUser;
    const token = u ? await u.getIdToken(true) : null;
    if (!token) {
      alert('Najpierw zaloguj się.');
      router.replace(`/login?next=/jobs/${jobId}/edit`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        description: String(form.description || ''),
        city: form.isRemote ? null : form.city.trim() || null,
        isRemote: !!form.isRemote,
        salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
        salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
        companyName: (form.companyName || '').trim(),
      };

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      onSaved?.(await res.json());
      alert('Oferta została zaktualizowana.');
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      console.error(err);
      alert(`Błąd zapisu: ${err.message || 'nieznany'}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-600">Ładowanie…</div>;
  if (!form) return <div className="p-6 text-red-600">Oferta nie została znaleziona.</div>;

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 ${className}`}>
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Tytuł
        </label>
        <input
          id="title"
          name="title"
          className={inputCls}
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Opis
        </label>
        <textarea
          id="description"
          name="description"
          className={inputCls + ' min-h-[140px]'}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor="city" className="text-sm font-medium">
            Miasto
          </label>
          <input
            id="city"
            name="city"
            className={inputCls}
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            disabled={form.isRemote}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="salaryMin" className="text-sm font-medium">
            Minimalne wynagrodzenie
          </label>
          <input
            id="salaryMin"
            name="salaryMin"
            type="number"
            inputMode="numeric"
            step="1"
            className={inputCls}
            value={form.salaryMin}
            onChange={(e) => setField('salaryMin', e.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="salaryMax" className="text-sm font-medium">
            Maksymalne wynagrodzenie
          </label>
          <input
            id="salaryMax"
            name="salaryMax"
            type="number"
            inputMode="numeric"
            step="1"
            className={inputCls}
            value={form.salaryMax}
            onChange={(e) => setField('salaryMax', e.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          id="isRemote"
          name="isRemote"
          type="checkbox"
          className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          checked={form.isRemote}
          onChange={(e) => setField('isRemote', e.target.checked)}
        />
        <span className="text-sm">Praca zdalna</span>
      </label>

      <div className="grid gap-2">
        <label htmlFor="companyName" className="text-sm font-medium">
          Nazwa firmy
        </label>
        <input
          id="companyName"
          name="companyName"
          className={inputCls}
          value={form.companyName}
          onChange={(e) => setField('companyName', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Zapisywanie…' : 'Zapisz'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={submitting}
          onClick={() => router.back()}
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
