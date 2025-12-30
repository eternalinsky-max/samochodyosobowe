'use client';

import { useState } from 'react';

export default function RatingStars({ value = 0, onChange, size = 20, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const current = hover || value;

  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Ocena ${n}`}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}
          disabled={readOnly}
          className="p-0"
          title={`${n}/5`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= current ? 'currentColor' : 'none'}
            stroke="currentColor"
            className={n <= current ? 'text-amber-500' : 'text-gray-300'}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M11.48 3.499a.562.562 0 011.04 0l1.201 3.418a.563.563 0 00.475.377l3.644.266c.499.036.701.663.321.988l-2.77 2.39a.563.563 0 00-.182.557l.826 3.53a.562.562 0 01-.84.61l-3.105-1.845a.563.563 0 00-.586 0L8.188 15.64a.562.562 0 01-.84-.61l.826-3.53a.563.563 0 00-.182-.557l-2.77-2.39a.563.563 0 01.321-.988l3.644-.266a.563.563 0 00.475-.377l1.201-3.418z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
