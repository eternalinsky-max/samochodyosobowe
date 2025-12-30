'use client';

import Image from 'next/image';
import { useEffect, useRef,useState } from 'react';

/**
 * ReviewsList
 * - Пагінація "Load more"
 * - Безпечний рендер навіть якщо відсутні поля (optional chaining)
 * - next/image з коректними width/height
 * - Невеликий внутрішній компонент для зірок рейтингу (без зовнішніх залежностей)
 */
export default function ReviewsList({ targetType, targetId }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const abortRef = useRef(null);

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  async function load(p = 1) {
    // скасовуємо попередній запит, якщо ще триває
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        targetType: String(targetType ?? ''),
        targetId: String(targetId ?? ''),
        page: String(p),
        perPage: '10',
      });

      const res = await fetch(`/api/reviews?${params.toString()}`, {
        cache: 'no-store',
        signal: ac.signal,
      });

      // на випадок не-200
      if (!res.ok) {
        console.error('Failed to fetch reviews:', res.status, await res.text().catch(() => ''));
        return;
      }

      const data = await res.json().catch(() => ({}));
      const nextItems = Array.isArray(data.items) ? data.items : [];

      // якщо це перша сторінка — замінюємо, якщо далі — додаємо
      setItems((prev) => (p === 1 ? nextItems : [...prev, ...nextItems]));
      setHasNext(Boolean(data?.hasNext));
      setPage(p);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Reviews load error:', err);
      }
    } finally {
      setLoading(false);
      if (p === 1) setInitialLoaded(true);
    }
  }

  useEffect(() => {
    // при зміні цілей — перезавантажити з першої сторінки
    load(1);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  return (
    <div className="grid gap-3">
      {/* Статуси */}
      {!initialLoaded && loading && (
        <div className="text-gray-600" role="status" aria-live="polite">
          Ładowanie opinii…
        </div>
      )}

      {initialLoaded && !loading && items.length === 0 && (
        <div className="text-gray-600">Brak opinii.</div>
      )}

      {/* Список відгуків */}
      {items.map((r) => {
        const name = r?.User?.name || r?.userName || 'Użytkownik';
        const photo = r?.User?.photoUrl || r?.userPhotoUrl || '';
        const rating =
          typeof r?.rating === 'number' ? Math.max(0, Math.min(5, Math.round(r.rating))) : null;
        const createdAt = r?.createdAt || r?.created_at || r?.created;
        const comment = r?.comment || r?.text || r?.content || '';

        return (
          <div
            key={r?.id ?? `${name}-${createdAt ?? Math.random()}`}
            className="rounded-xl border bg-white p-3"
          >
            <div className="mb-1 flex items-center gap-3 text-sm text-gray-700">
              {photo ? (
                <Image
                  src={photo}
                  alt={name ? `${name} avatar` : 'User avatar'}
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex size-10 items-center justify-center rounded-full bg-gray-200"
                  aria-label="No user photo"
                >
                  <span className="text-xs text-gray-600">
                    {String(name).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="min-w-0">
                <div className="truncate font-medium text-gray-900">{name}</div>
                <div className="flex items-center gap-2">
                  {rating != null && <Stars value={rating} />}
                  {createdAt && (
                    <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {comment && (
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
                {comment}
              </p>
            )}
          </div>
        );
      })}

      {/* Кнопка "Показати більше" */}
      {items.length > 0 && hasNext && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? 'Ładowanie…' : 'Pokaż więcej'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Простий компонент зірок 0–5 */
function Stars({ value = 0 }) {
  // Масив із п’яти позицій; заповнюємо повні/порожні зірки
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Ocena: ${value} z 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            width="14"
            height="14"
            aria-hidden="true"
            className={filled ? 'fill-yellow-500' : 'fill-gray-300'}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0l-2.802 2.035c-.784.57-1.838-.196-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81H6.93a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </span>
  );
}
