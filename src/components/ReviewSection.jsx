'use client';

import { useState } from 'react';
import Stars from '@/components/Stars';
import UserChip from '@/components/UserChip';
import { useAuthUser } from '@/lib/useAuthUser';
import { useReviews } from '@/lib/useReviews';

const LABELS = {
  LISTING: 'Oceń ogłoszenie',
  USER: 'Oceń sprzedawcę',
};

const TITLES = {
  LISTING: 'Opinie o ogłoszeniu',
  USER: 'Opinie o sprzedawcy',
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
    deleteReview,
    reload,
  } = useReviews({ targetType, targetId, perPage: 10 });

  async function submit() {
    await upsertReview({ ratingOverall: score, text });
    setText('');
    setOpen(false);
  }

  return (
    <section id="opinie" className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">
          {TITLES[targetType] || 'Opinie'}
        </h2>

        {!loading && user ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Anuluj' : LABELS[targetType] || 'Dodaj opinię'}
          </button>
        ) : (
          <a href="/login" className="btn btn-ghost">
            Zaloguj się, aby dodać opinię
          </a>
        )}
      </div>

      {/* Форма */}
      {open && user && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.06] p-4">
          <div className="mb-2 text-sm font-medium text-white">Twoja ocena</div>
          <div className="flex items-center gap-2">
            <Stars value={score} onChange={setScore} />
            <span className="text-sm text-white/60">{score}/5</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napisz krótką opinię…"
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40"
            rows={4}
          />
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={submit}>
              Zapisz opinię
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Список */}
      {listLoading ? (
        <div className="rounded-lg border border-white/10 p-4 text-white/60">
          Ładowanie opinii…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 p-4 text-red-400">
          Błąd: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-4 text-white/60">
          Brak opinii.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const authorId = r.User?.id || null;
            const authorName = r.User?.displayName || 'Użytkownik';
            const authorPhoto = r.User?.photoUrl || null;
            const isOwn = user && r.User?.id === user.uid;

            return (
              <article key={r.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <UserChip id={authorId} name={authorName} photoUrl={authorPhoto} />
                  <div className="text-xs text-white/40">
                    {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </div>
                <div className="mt-1 text-sm text-white/80">
                  Ocena: {r.ratingOverall}/5
                </div>
                {r.text && (
                  <p className="mt-1 text-sm text-white/70">{r.text}</p>
                )}
                {isOwn && (
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="mt-2 text-xs text-red-400 hover:underline"
                  >
                    Usuń moją opinię
                  </button>
                )}
              </article>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={prevPage}>
              ← Poprzednia
            </button>
            <button className="btn btn-ghost" disabled={!hasNext} onClick={nextPage}>
              Następna →
            </button>
          </div>
        </div>
      )}

      <div className="mt-3">
        <button className="text-xs text-white/40 underline" onClick={reload}>
          Odśwież
        </button>
      </div>
    </section>
  );
}
