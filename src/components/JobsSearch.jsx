'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect,useState } from 'react';

export default function JobsSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [city, setCity] = useState(sp.get('city') ?? '');

  // синхронізуємося з адресним рядком
  useEffect(() => {
    setQ(sp.get('q') ?? '');
    setCity(sp.get('city') ?? '');
  }, [sp]);

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams(sp.toString());
    q ? params.set('q', q) : params.delete('q');
    city ? params.set('city', city) : params.delete('city');
    params.set('page', '1'); // при новому пошуку — перша сторінка
    router.replace(`/jobs?${params.toString()}`);
  }

  function reset() {
    setQ('');
    setCity('');
    const params = new URLSearchParams(sp.toString());
    params.delete('q');
    params.delete('city');
    params.set('page', '1');
    router.replace(`/jobs?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-wrap gap-2">
      <input
        name="q"
        aria-label="Słowa kluczowe"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Stanowisko, firma, słowa kluczowe"
        className="min-w-[220px] flex-1 rounded-lg border px-3 py-2"
        autoComplete="on"
      />
      <input
        name="city"
        aria-label="Miasto"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Miasto lub Zdalnie"
        className="w-48 rounded-lg border px-3 py-2"
        autoComplete="on"
        list="cities"
      />
      <datalist id="cities">
        <option value="Warszawa" />
        <option value="Kraków" />
        <option value="Wrocław" />
        <option value="Gdańsk" />
        <option value="Zdalnie" />
      </datalist>

      <button className="btn btn-secondary" type="submit">
        Szukaj
      </button>
      {(q || city) && (
        <button className="btn btn-ghost" type="button" onClick={reset}>
          Wyczyść
        </button>
      )}
    </form>
  );
}
