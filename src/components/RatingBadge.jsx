// src/components/RatingBadge.jsx
'use client';

/**
 * Компонент бейджа рейтингу.
 * Відображає середній рейтинг (★ avg) і кількість відгуків.
 * Якщо даних немає — показує "Brak ocen".
 */
export default function RatingBadge({ avg = 0, count = 0, className = '' }) {
  const hasRating = Number.isFinite(avg) && avg > 0 && count > 0;
  const label = hasRating ? `Średnia ${avg.toFixed(1)} • ${count} opinii` : 'Brak ocen';

  return (
    <div
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
        hasRating
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-gray-200 bg-gray-50 text-gray-600',
        className,
      ].join(' ')}
      title={label}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-3.5 ${hasRating ? 'text-amber-500' : 'text-gray-400'}`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M11.48 3.5a.56.56 0 011.04 0l1.2 3.42c.08.22.28.37.5.38l3.64.27c.5.04.7.66.32.99l-2.77 2.39c-.17.15-.24.38-.18.59l.83 3.53a.56.56 0 01-.84.62L12.12 14a.56.56 0 00-.59 0L8.42 16.7a.56.56 0 01-.84-.62l.83-3.53a.56.56 0 00-.18-.56L5.46 8.56a.56.56 0 01.32-.99l3.64-.27c.22-.02.42-.17.5-.39l1.56-3.41z" />
      </svg>

      {hasRating ? (
        <>
          <span className="tabular-nums">{avg.toFixed(1)}</span>
          <span className="text-[10px] opacity-70">({count})</span>
        </>
      ) : (
        <span>Brak ocen</span>
      )}
    </div>
  );
}
