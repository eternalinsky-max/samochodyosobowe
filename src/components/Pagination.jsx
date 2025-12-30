'use client';

import { useMemo } from 'react';

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  maxVisible = 5,
  className = '',
}) {
  const pages = useMemo(() => {
    const p = Math.max(1, Number(page) || 1);
    const t = Math.max(1, Number(totalPages) || 1);
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, p - half);
    let end = Math.min(t, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages, maxVisible]);

  const go = (n) => {
    if (!onPageChange) return;
    const next = Math.min(Math.max(1, n), totalPages || 1);
    if (next !== page) onPageChange(next);
  };

  const disabledBtn = 'pointer-events-none opacity-50 border-gray-200 text-gray-400';

  return (
    <nav aria-label="Paginacja" className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => go(page - 1)}
        className={`rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 ${page <= 1 ? disabledBtn : ''}`}
      >
        ← Poprzednia
      </button>

      {pages[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            1
          </button>
          {pages[0] > 2 && <span className="px-1 text-gray-500">…</span>}
        </>
      )}

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => go(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 ${
            n === page ? 'bg-brand-50 border-brand-600 font-semibold' : ''
          }`}
        >
          {n}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-gray-500">…</span>
          )}
          <button
            type="button"
            onClick={() => go(totalPages)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        className={`rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 ${
          page >= totalPages ? disabledBtn : ''
        }`}
      >
        Następna →
      </button>
    </nav>
  );
}
