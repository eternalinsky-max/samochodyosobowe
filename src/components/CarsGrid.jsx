'use client';

import { useMemo, useState } from 'react';
import FilterPills from '@/components/FilterPills';
import AutoCard from '@/components/AutoCard';
import SearchAndSortBar from '@/components/SearchAndSortBar';

function parsePricePLN(value) {
  if (!value) return null;
  // підтримує "123 000 zł", "123000", "123,000 PLN" тощо
  const n = String(value).replace(/[^\d]/g, '');
  return n ? Number(n) : null;
}

export default function CarsGrid({ cars = [] }) {
  const [brand, setBrand] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('relevance');

  const brandOptions = useMemo(() => {
    const set = new Set(cars.map((c) => c.brand).filter(Boolean));
    return [...set].sort().map((b) => ({ label: b, value: b }));
  }, [cars]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return cars.filter((c) => {
      if (brand && c.brand !== brand) return false;

      if (!q) return true;

      const hay = [
        c.brand,
        c.model,
        c.title,
        c.body,
        c.fuel,
        c.gearbox,
        c.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [cars, brand, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];

    const getYear = (c) => (c.year ? Number(c.year) : null);
    const getPrice = (c) => parsePricePLN(c.price);

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => (getPrice(a) ?? 1e18) - (getPrice(b) ?? 1e18));
        break;
      case 'price_desc':
        list.sort((a, b) => (getPrice(b) ?? -1) - (getPrice(a) ?? -1));
        break;
      case 'year_asc':
        list.sort((a, b) => (getYear(a) ?? 1e18) - (getYear(b) ?? 1e18));
        break;
      case 'year_desc':
        list.sort((a, b) => (getYear(b) ?? -1) - (getYear(a) ?? -1));
        break;
      case 'relevance':
      default:
        // залишаємо поточний порядок (наприклад, як з БД)
        break;
    }

    return list;
  }, [filtered, sort]);

  return (
    <div className="space-y-4">
      <SearchAndSortBar
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        resultCount={sorted.length}
      />

      <FilterPills options={brandOptions} value={brand} onChange={setBrand} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((car) => (
          <AutoCard key={car.id} car={car} />
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
          Brak wyników. Zmień filtry lub wpisz inne hasło.
        </div>
      ) : null}
    </div>
  );
}
      {/* LISTA */} 
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border bg-white p-6 text-sm text-gray-600">
            Brak wyników dla wybranych filtrów.
          </div>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/cars/${r.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="h-40 bg-gray-100" />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-semibold text-gray-900">
                      {r.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-gray-600">
                      {r.meta}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      {r.price}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {r.avg ? `${r.avg.toFixed(1)}/5` : 'Brak ocen'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="badge">{r.ratingsCount} ocen</span>
                  <span className="badge">{r.commentsCount} komentarzy</span>
                </div>

                <div className="mt-3 text-sm font-semibold text-red-600 group-hover:text-red-700">
                  Zobacz szczegóły →
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
