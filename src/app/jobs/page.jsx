// src/app/jobs/page.jsx
import { headers } from 'next/headers';
import Link from 'next/link';

import JobCardList from '@/components/JobCardList';

/**
 * Сторінка списку вакансій.
 * Параметри (через query):
 *   page=1&perPage=12&sort=createdAt|salaryMin|salaryMax|bayesScore|ratingAvg&dir=asc|desc
 *   status=ACTIVE|HIDDEN|DRAFT
 *   city=Warszawa
 *   remote=1|0
 *   q=react
 */
export const dynamic = 'force-dynamic';

async function fetchJobs(searchParams) {
  const params = new URLSearchParams();

  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.perPage) || 12;
  const sort = (searchParams?.sort || 'createdAt').toString();
  const dir = (searchParams?.dir || 'desc').toString();
  const status = (searchParams?.status || '').toString();
  const city = (searchParams?.city || '').toString();
  const remote = (searchParams?.remote ?? '').toString(); // "1"|"0"|""
  const q = (searchParams?.q || '').toString();

  params.set('page', String(Math.max(1, page)));
  params.set('perPage', String(Math.min(Math.max(perPage, 1), 100)));
  if (sort) params.set('sort', sort);
  if (dir) params.set('dir', dir);
  if (status) params.set('status', status);
  if (city) params.set('city', city);
  if (remote === '1' || remote === '0') params.set('remote', remote);
  if (q) params.set('q', q);

  // --- ВАЖЛИВО: абсолютний URL для SSR ---
  const hdrs = headers();
  const host =
    hdrs.get('x-forwarded-host') ||
    hdrs.get('host') ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '');
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : 'http://localhost:3000');

  const res = await fetch(`${base}/api/jobs?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export default async function JobsPage({ searchParams }) {
  const data = await fetchJobs(searchParams);
  const { items = [], page = 1, perPage = 12, totalPages = 1 } = data;

  const currentSort = (searchParams?.sort || 'createdAt').toString();
  const currentDir = (searchParams?.dir || 'desc').toString();
  const currentStatus = (searchParams?.status || '').toString();
  const currentCity = (searchParams?.city || '').toString();
  const currentRemote = (searchParams?.remote ?? '').toString();
  const currentQ = (searchParams?.q || '').toString();

  const setParam = (obj) => {
    const sp = new URLSearchParams();
    sp.set('page', String(obj.page ?? page));
    sp.set('perPage', String(obj.perPage ?? perPage));
    sp.set('sort', String(obj.sort ?? currentSort));
    sp.set('dir', String(obj.dir ?? currentDir));
    if (obj.status ?? currentStatus) sp.set('status', String(obj.status ?? currentStatus));
    if (obj.city ?? currentCity) sp.set('city', String(obj.city ?? currentCity));
    const r = obj.remote ?? currentRemote;
    if (r === '1' || r === '0') sp.set('remote', r);
    if (obj.q ?? currentQ) sp.set('q', String(obj.q ?? currentQ));
    return `/jobs?${sp.toString()}`;
  };

  return (
    <section className="px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Oferty pracy</h1>
        <Link href="/post-job" className="btn btn-primary">
          Dodaj ofertę
        </Link>
      </div>

      {/* Фільтри / пошук */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <form action="/jobs" className="col-span-2 flex gap-2">
          <input
            name="q"
            defaultValue={currentQ}
            placeholder="Szukaj (np. React, firma, opis)…"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button className="btn btn-secondary" type="submit">
            Szukaj
          </button>
        </form>

        <form action="/jobs" className="flex gap-2">
          <select
            name="status"
            defaultValue={currentStatus}
            className="w-full rounded-lg border p-2 text-sm"
          >
            <option value="">Wszystkie</option>
            <option value="ACTIVE">Aktywne</option>
            <option value="HIDDEN">Ukryte</option>
            <option value="DRAFT">Szkic</option>
          </select>
          <input
            name="city"
            defaultValue={currentCity}
            placeholder="Miasto"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </form>

        <div className="flex items-center gap-2">
          <Link
            href={setParam({ page: 1, remote: '' })}
            className={`rounded-lg border p-2 text-sm ${currentRemote === '' ? 'bg-brand-50 border-brand-600' : ''}`}
          >
            Wszystkie
          </Link>
          <Link
            href={setParam({ page: 1, remote: '1' })}
            className={`rounded-lg border p-2 text-sm ${currentRemote === '1' ? 'bg-brand-50 border-brand-600' : ''}`}
          >
            Zdalnie
          </Link>
          <Link
            href={setParam({ page: 1, remote: '0' })}
            className={`rounded-lg border p-2 text-sm ${currentRemote === '0' ? 'bg-brand-50 border-brand-600' : ''}`}
          >
            Stacjonarnie
          </Link>
        </div>
      </div>

      {/* Сортування */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">Sortowanie:</span>
        {[
          ['createdAt', 'Najnowsze'],
          ['salaryMin', 'Min. płaca'],
          ['salaryMax', 'Max. płaca'],
          ['bayesScore', 'Ranking'],
          ['ratingAvg', 'Średnia'],
        ].map(([key, label]) => {
          const active = currentSort === key;
          const nextDir = active && currentDir === 'desc' ? 'asc' : 'desc';
          return (
            <Link
              key={key}
              href={setParam({ page: 1, sort: key, dir: active ? nextDir : 'desc' })}
              className={`rounded-lg border px-2 py-1.5 ${active ? 'bg-gray-100' : ''}`}
            >
              {label}
              {active ? (currentDir === 'desc' ? ' ↓' : ' ↑') : ''}
            </Link>
          );
        })}
      </div>

      {/* Список */}
      <JobCardList jobs={items} />

      {/* Пагінація */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <Link
          className="btn btn-secondary"
          href={setParam({ page: Math.max(1, Number(page) - 1) })}
          aria-disabled={Number(page) <= 1}
        >
          ← Poprzednia
        </Link>
        <span className="text-sm text-gray-600">
          Strona <span className="font-medium">{page}</span> z{' '}
          <span className="font-medium">{data.totalPages ?? '?'}</span>
        </span>
        <Link
          className="btn btn-secondary"
          href={setParam({ page: Number(page) + 1 })}
          aria-disabled={!data.hasNext}
        >
          Następna →
        </Link>
      </div>
    </section>
  );
}
