// src/components/ReviewSection.jsx
'use client';

import { useState } from 'react';

import Stars from '@/components/Stars';
import UserChip from '@/components/UserChip';
import { useAuthUser } from '@/lib/useAuthUser';
import { useReviews } from '@/lib/useReviews';

const LABELS = {
  JOB: 'Oceń ofertę',
  COMPANY: 'Oceń firmę',
  USER: 'Oceń pracownika',
};

export default function ReviewSection({ targetType, targetId }) {
  const { user, loading } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(5);
  const [text, setText] = useState('');

  const {
    items,
    loading: listLoading,
    error,
    page,
    hasNext,
    nextPage,
    prevPage,
    upsertReview,
    // deleteReview, // якщо потрібно — поверни та розкоментуй кнопку нижче
    reload,
  } = useReviews({ targetType, targetId, perPage: 10 });

  async function submit() {
    await upsertReview({ ratingOverall: score, text });
    setText('');
    setOpen(false);
  }

  return (
    <section id="opinie" className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Opinie</h2>

        {!loading && user ? (
          <button type="button" className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
            {open ? 'Anuluj' : LABELS[targetType] || 'Dodaj opinię'}
          </button>
        ) : (
          <a href="/login" className="btn btn-secondary">
            Zaloguj się, aby dodać opinię
          </a>
        )}
      </div>

      {/* Форма додавання / редагування */}
      {open && user && (
        <div className="mb-4 rounded-xl border bg-gray-50 p-4">
          <div className="mb-2 text-sm font-medium">Twoja ocena</div>
          <div className="flex items-center gap-2">
            <Stars value={score} onChange={setScore} />
            <span className="text-sm text-gray-600">{score}/5</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napisz krótką opinię…"
            className="mt-3 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            rows={4}
          />
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={submit}>
              Zapisz opinię
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Список відгуків */}
      {listLoading ? (
        <div className="rounded-lg border bg-white p-4 text-gray-600">Ładowanie opinii…</div>
      ) : error ? (
        <div className="rounded-lg border bg-white p-4 text-red-600">Błąd: {error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-white p-4 text-gray-600">Brak opinii.</div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const authorId = r.User?.id || null;
            const authorName = r.User?.displayName || 'Użytkownik';
            const authorPhoto = r.User?.photoUrl || null;

            return (
              <article key={r.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between">
                  <UserChip id={authorId} name={authorName} photoUrl={authorPhoto} />
                  <div className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </div>
                <div className="mt-1 text-sm">Ocena: {r.ratingOverall}/5</div>
                {r.text && <p className="mt-1 text-sm text-gray-700">{r.text}</p>}

                {/* (опц.) Кнопка видалити власний відгук — розкоментуй, якщо потрібна */}
                {/* <div className="mt-2">
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Usuń moją opinię
                  </button>
                </div> */}
              </article>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={prevPage}>
              ← Poprzednia
            </button>
            <button className="btn btn-secondary" disabled={!hasNext} onClick={nextPage}>
              Następna →
            </button>
          </div>
        </div>
      )}

      {/* refresh */}
      <div className="mt-3">
        <button className="text-xs text-gray-500 underline" onClick={reload}>
          Odśwież
        </button>
      </div>
    </section>
  );
}
