'use client';

import { usePathname,useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

/** За замовчуванням: Najnowsze / Najwyższa płaca / Najniższa płaca */
const DEFAULT_OPTIONS = [
  { key: 'newest', label: 'Najnowsze', sort: 'createdAt', dir: 'desc' },
  { key: 'pay_high', label: 'Najwyższa płaca', sort: 'salaryMax', dir: 'desc' },
  { key: 'pay_low', label: 'Najniższa płaca', sort: 'salaryMin', dir: 'asc' },
];

/**
 * Props:
 * - options?: масив опцій {key,label,sort,dir}
 * - className?: стилі контейнера
 * - paramSort?: назва параметра (деф. "sort")
 * - paramDir?: назва параметра (деф. "dir")
 */
export default function SortSelect({
  options = DEFAULT_OPTIONS,
  className = '',
  paramSort = 'sort',
  paramDir = 'dir',
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const sort = (sp.get(paramSort) || 'createdAt').trim();
  const dir = (sp.get(paramDir) || 'desc').toLowerCase();

  const currentKey = useMemo(
    () => options.find((o) => o.sort === sort && o.dir === dir)?.key || options[0].key,
    [options, sort, dir],
  );

  const [value, setValue] = useState(currentKey);
  useEffect(() => setValue(currentKey), [currentKey]);

  function apply(nextKey) {
    const opt = options.find((o) => o.key === nextKey) || options[0];
    const params = new URLSearchParams(sp.toString());
    params.set(paramSort, opt.sort);
    params.set(paramDir, opt.dir);
    params.set('page', '1'); // нове сортування → перша сторінка

    const url = `${pathname}?${params.toString()}`;
    startTransition(() => {
      router.replace(url);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="sort" className="text-sm text-gray-600">
        Sortuj:
      </label>
      <select
        id="sort"
        className="rounded-lg border px-2 py-1 disabled:opacity-60"
        value={value}
        disabled={isPending}
        aria-label="Sortuj oferty pracy"
        onChange={(e) => {
          const k = e.target.value;
          setValue(k);
          apply(k);
        }}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
