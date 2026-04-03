'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * CarSearch (Premium)
 * - синхронізується з query string
 * - оновлює URL через router.replace
 * - при новому пошуку ставить page=1
 *
 * Очікувані параметри:
 * make, fuel, gearbox, body, city, priceMin, priceMax, page
 */
export default function CarSearch({ variant = 'premium', to = '/cars' }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [make, setMake] = useState(sp.get('make') ?? '');
  const [fuel, setFuel] = useState(sp.get('fuel') ?? '');
  const [gearbox, setGearbox] = useState(sp.get('gearbox') ?? '');
  const [body, setBody] = useState(sp.get('body') ?? '');
  const [city, setCity] = useState(sp.get('city') ?? '');
  const [priceMin, setPriceMin] = useState(sp.get('priceMin') ?? '');
  const [priceMax, setPriceMax] = useState(sp.get('priceMax') ?? '');

  // sync with URL
  useEffect(() => {
    setMake(sp.get('make') ?? '');
    setFuel(sp.get('fuel') ?? '');
    setGearbox(sp.get('gearbox') ?? '');
    setBody(sp.get('body') ?? '');
    setCity(sp.get('city') ?? '');
    setPriceMin(sp.get('priceMin') ?? '');
    setPriceMax(sp.get('priceMax') ?? '');
  }, [sp]);

  const premium = variant === 'premium';

  const inputClass = useMemo(() => {
    return premium
      ? 'h-11 w-full rounded-xl border border-slate-900/15 bg-white/80 px-4 text-sm text-slate-900 ' +
          'outline-none placeholder:text-slate-400 ' +
          'focus:border-red-600/70 focus:ring-4 focus:ring-red-600/15'
      : 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-400';
  }, [premium]);

  const hasAny =
    !!make || !!fuel || !!gearbox || !!body || !!city || !!priceMin || !!priceMax;

  function submit(e) {
    e.preventDefault();

    const params = new URLSearchParams(sp.toString());

    // helper
    const setOrDelete = (key, val) => {
      if (val && String(val).trim()) params.set(key, String(val).trim());
      else params.delete(key);
    };

    setOrDelete('make', make);
    setOrDelete('fuel', fuel);
    setOrDelete('gearbox', gearbox);
    setOrDelete('body', body);
    setOrDelete('city', city);
    setOrDelete('priceMin', priceMin);
    setOrDelete('priceMax', priceMax);

    params.set('page', '1');
    router.replace(`${to}?${params.toString()}`);
  }

  function reset() {
    setMake('');
    setFuel('');
    setGearbox('');
    setBody('');
    setCity('');
    setPriceMin('');
    setPriceMax('');

    const params = new URLSearchParams(sp.toString());
    params.delete('make');
    params.delete('fuel');
    params.delete('gearbox');
    params.delete('body');
    params.delete('city');
    params.delete('priceMin');
    params.delete('priceMax');
    params.set('page', '1');

    router.replace(`${to}?${params.toString()}`);
  }

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Marka">
          <input
            name="make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="np. BMW"
            className={inputClass}
            autoComplete="on"
            list="car-makes"
          />
          {/* можеш замінити своїм списком */}
          <datalist id="car-makes">
            <option value="BMW" />
            <option value="Audi" />
            <option value="Mercedes-Benz" />
            <option value="Volkswagen" />
            <option value="Toyota" />
            <option value="Skoda" />
            <option value="Volvo" />
          </datalist>
        </Field>

        <Field label="Paliwo">
          <select
            name="fuel"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className={inputClass}
          >
            <option value="">Wszystkie</option>
            <option value="benzyna">Benzyna</option>
            <option value="diesel">Diesel</option>
            <option value="hybryda">Hybryda</option>
            <option value="elektryczny">Elektryczny</option>
            <option value="lpg">LPG</option>
          </select>
        </Field>

        <Field label="Skrzynia">
          <select
            name="gearbox"
            value={gearbox}
            onChange={(e) => setGearbox(e.target.value)}
            className={inputClass}
          >
            <option value="">Wszystkie</option>
            <option value="manual">Manualna</option>
            <option value="auto">Automatyczna</option>
          </select>
        </Field>

        <Field label="Nadwozie">
          <select
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={inputClass}
          >
            <option value="">Wszystkie</option>
            <option value="sedan">Sedan</option>
            <option value="hatchback">Hatchback</option>
            <option value="kombi">Kombi</option>
            <option value="suv">SUV</option>
            <option value="coupe">Coupe</option>
            <option value="kabriolet">Kabriolet</option>
          </select>
        </Field>

        <Field label="Miasto" className="lg:col-span-2">
          <input
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="np. Warszawa"
            className={inputClass}
            autoComplete="on"
          />
        </Field>

        <Field label="Cena (PLN)">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="priceMin"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Od"
              inputMode="numeric"
              className={inputClass}
            />
            <input
              name="priceMax"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Do"
              inputMode="numeric"
              className={inputClass}
            />
          </div>
        </Field>

        <div className="flex items-end gap-3 lg:justify-end">
          <button
            className="
              h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white
              shadow-[0_12px_30px_rgba(220,38,38,0.30)]
              hover:bg-red-500 active:bg-red-700
              focus:outline-none focus:ring-4 focus:ring-red-600/20
            "
            type="submit"
          >
            Filtruj
          </button>

          {hasAny && (
            <button
              className="
                h-11 rounded-xl border border-black/10 bg-white/60 px-4 text-sm font-semibold text-slate-800
                hover:bg-white/85
                focus:outline-none focus:ring-4 focus:ring-black/10
              "
              type="button"
              onClick={reset}
            >
              Wyczyść
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-slate-700">{label}</div>
      {children}
    </div>
  );
}


