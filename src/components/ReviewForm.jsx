'use client';

import { useState } from 'react';

import RatingStars from '@/components/RatingStars';
import { auth } from '@/lib/firebase';

export default function ReviewForm({ targetType, targetId, onSubmitted }) {
  const [overall, setOverall] = useState(5);
  const [pay, setPay] = useState(0);
  const [culture, setCulture] = useState(0);
  const [balance, setBalance] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    try {
      setBusy(true);
      setErr('');

      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Brak autoryzacji');

      const payload = {
        targetType,
        targetId,
        ratingOverall: overall,
        text: text.trim(),
        ratingPay: pay || null,
        ratingCulture: culture || null,
        ratingBalance: balance || null,
        ratingClarity: clarity || null,
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
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

      onSubmitted?.();
      setText('');
    } catch (e) {
      setErr(e.message || 'Błąd');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 text-sm font-medium">Twoja ocena</div>
      <div className="flex flex-wrap items-center gap-3">
        <RatingStars value={overall} onChange={setOverall} />
        <div className="text-sm text-gray-600">{overall}/5</div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Płace</span>
          <RatingStars value={pay} onChange={setPay} size={16} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Kultura</span>
          <RatingStars value={culture} onChange={setCulture} size={16} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Balans</span>
          <RatingStars value={balance} onChange={setBalance} size={16} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Jasność</span>
          <RatingStars value={clarity} onChange={setClarity} size={16} />
        </label>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Napisz krótką opinię…"
        className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
        rows={4}
      />

      {err && <div className="mt-2 text-sm text-red-600">{err}</div>}

      <div className="mt-3">
        <button type="button" disabled={busy} onClick={submit} className="btn btn-primary">
          {busy ? 'Zapisywanie…' : 'Zapisz opinię'}
        </button>
      </div>
    </div>
  );
}
