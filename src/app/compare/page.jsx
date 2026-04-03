'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const MAX_CARS = 3;

function pln(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(n);
}

function fuelLabel(v) {
  const map = {
    PETROL: 'Benzyna', DIESEL: 'Diesel', HYBRID: 'Hybryda',
    PHEV: 'PHEV', ELECTRIC: 'Elektryczny', LPG: 'LPG', CNG: 'CNG',
  };
  return map[v] || v || '—';
}

function gearboxLabel(v) {
  return v === 'MANUAL' ? 'Manual' : v === 'AUTOMATIC' ? 'Automat' : v || '—';
}

function bodyLabel(v) {
  const map = {
    HATCHBACK: 'Hatchback', SEDAN: 'Sedan', WAGON: 'Kombi',
    SUV: 'SUV', COUPE: 'Coupe', CONVERTIBLE: 'Kabriolet',
    VAN: 'Van', PICKUP: 'Pickup',
  };
  return map[v] || v || '—';
}

const SPECS = [
  { key: 'pricePln', label: 'Cena', format: (v) => pln(v) },
  { key: 'year', label: 'Rok produkcji', format: (v) => v || '—' },
  { key: 'mileageKm', label: 'Przebieg', format: (v) => v ? `${v.toLocaleString('pl-PL')} km` : '—' },
  { key: 'fuelType', label: 'Paliwo', format: fuelLabel },
  { key: 'gearbox', label: 'Skrzynia biegów', format: gearboxLabel },
  { key: 'bodyType', label: 'Nadwozie', format: bodyLabel },
  { key: 'city', label: 'Lokalizacja', format: (v) => v || '—' },
];

function SearchPanel({ onAdd, existingIds }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: '8' });
      const res = await fetch(`/api/cars?${params}`);
      const data = await res.json();
      setResults(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '32px',
      }}
    >
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
        Wyszukaj ogłoszenie do porównania
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Wpisz markę, model lub tytuł…"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : 'Szukaj'}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '12px' }}>
          Brak wyników.
        </p>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {results.map((car) => {
            const already = existingIds.includes(car.id);
            return (
              <div
                key={car.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>{car.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                    {[car.year, car.city].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button
                  onClick={() => { onAdd(car); setResults([]); setQuery(''); setSearched(false); }}
                  disabled={already || existingIds.length >= MAX_CARS}
                  style={{
                    background: already ? 'rgba(255,255,255,0.05)' : 'rgba(56,189,248,0.15)',
                    border: `0.5px solid ${already ? 'rgba(255,255,255,0.1)' : 'rgba(56,189,248,0.4)'}`,
                    color: already ? 'rgba(255,255,255,0.3)' : '#38bdf8',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: already || existingIds.length >= MAX_CARS ? 'default' : 'pointer',
                  }}
                >
                  {already ? 'Dodano' : '+ Dodaj'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CarColumn({ car, onRemove }) {
  const cover = car.coverUrl || car.images?.[0]?.url || '/images/Bmw.jpg';
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', height: '160px' }}>
        <Image src={cover} alt={car.title} fill style={{ objectFit: 'cover' }} sizes="400px" />
        <button
          onClick={() => onRemove(car.id)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '14px' }}>
        <Link
          href={`/cars/${car.id}`}
          style={{ fontSize: '13px', fontWeight: 600, color: 'white', textDecoration: 'none' }}
        >
          {car.title}
        </Link>
        <div
          style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}
        >
          {pln(car.pricePln)}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [cars, setCars] = useState([]);

  const addCar = useCallback((car) => {
    setCars((prev) => {
      if (prev.find((c) => c.id === car.id)) return prev;
      if (prev.length >= MAX_CARS) return prev;
      return [...prev, car];
    });
  }, []);

  const removeCar = useCallback((id) => {
    setCars((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
        Porównanie
      </h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>
        Dodaj do {MAX_CARS} ogłoszeń, aby porównać je obok siebie.
      </p>

      <SearchPanel onAdd={addCar} existingIds={cars.map((c) => c.id)} />

      {cars.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            color: 'rgba(255,255,255,0.25)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '15px',
          }}
        >
          Wyszukaj i dodaj ogłoszenia, aby je porównać.
        </div>
      ) : (
        <>
          {/* Nagłówki kolumn */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {cars.map((car) => (
              <CarColumn key={car.id} car={car} onRemove={removeCar} />
            ))}
            {cars.length < MAX_CARS && (
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: '13px',
                }}
              >
                + dodaj kolejne
              </div>
            )}
          </div>

          {/* Tabela porównawcza */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {SPECS.map((spec, i) => (
              <div
                key={spec.key}
                style={{
                  display: 'flex',
                  borderBottom: i < SPECS.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '160px',
                    flexShrink: 0,
                    padding: '14px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderRight: '0.5px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {spec.label}
                </div>
                {cars.map((car) => {
                  const val = spec.format(car[spec.key]);
                  const vals = cars.map((c) => c[spec.key]);
                  const allSame = vals.every((v) => v === vals[0]);
                  const highlight = !allSame && spec.key === 'pricePln'
                    ? car[spec.key] === Math.min(...cars.map((c) => c[spec.key] || Infinity))
                    : false;
                  return (
                    <div
                      key={car.id}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        fontSize: '14px',
                        color: highlight ? '#38bdf8' : allSame ? 'rgba(255,255,255,0.5)' : 'white',
                        fontWeight: highlight ? 600 : 400,
                        borderRight: '0.5px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {val}
                      {highlight && (
                        <span style={{ fontSize: '11px', marginLeft: '6px', color: '#38bdf8' }}>
                          ✓ najtaniej
                        </span>
                      )}
                    </div>
                  );
                })}
                {cars.length < MAX_CARS && (
                  <div style={{ flex: 1, padding: '14px 16px', color: 'transparent' }}>—</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
