'use client';
import { useMemo, useState } from 'react';

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  const [hover, setHover] = useState(0);
  const current = readOnly ? value : hover || value;

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Ocena">
      {stars.map((n) => {
        const filled = n <= Math.round(current);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={filled}
            onClick={() => !readOnly && onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`inline-flex select-none transition-transform duration-100 ${readOnly ? 'pointer-events-none' : 'cursor-pointer'}`}
            style={{
              transform: !readOnly && hover >= n ? 'scale(1.2)' : 'scale(1)',
              lineHeight: 0,
            }}
            title={`${n}/5`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 20 20"
              fill={filled ? '#38bdf8' : 'rgba(56,189,248,0.15)'}
              style={{
                filter: filled
                  ? 'drop-shadow(0 0 4px rgba(56,189,248,0.5))'
                  : 'none',
                transition: 'fill 0.15s ease, filter 0.15s ease',
              }}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
