'use client';

export default function SearchAndSortBar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  resultCount,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <input
          className="input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Szukaj: marka, model, nadwozie, paliwo…"
          type="search"
        />
        <div className="mt-2 text-xs text-gray-500">
          Wyniki: <span className="font-semibold text-gray-900">{resultCount}</span>
        </div>
      </div>

      <div className="w-full sm:w-64">
        <select
          className="select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="relevance">Sortuj: trafność</option>
          <option value="price_asc">Cena: rosnąco</option>
          <option value="price_desc">Cena: malejąco</option>
          <option value="year_desc">Rok: od najnowszych</option>
          <option value="year_asc">Rok: od najstarszych</option>
        </select>
      </div>
    </div>
  );
}


