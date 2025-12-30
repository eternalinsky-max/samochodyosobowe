'use client';
import { useMemo } from 'react';

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Ocena">
      {stars.map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={filled}
            onClick={() => !readOnly && onChange?.(n)}
            className={`inline-flex select-none ${readOnly ? 'pointer-events-none' : 'cursor-pointer'}`}
            title={`${n}/5`}
            style={{ lineHeight: 0 }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              className={filled ? 'text-yellow-500' : 'text-gray-300'}
            >
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
