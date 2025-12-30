'use client';

import { useState } from 'react';

export default function Stars({
  value = 0,
  onChange,
  readOnly = false,
  size = 18,
  className = '',
}) {
  const [hover, setHover] = useState(0);
  const current = readOnly ? value : hover || value;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
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
              d="M11.48 3.5a.56.56 0 011.04 0l1.2 3.42c.08.22.28.37.5.38l3.64.27c.5.04.7.66.32.99l-2.77 2.39c-.17.15-.24.38-.18.59l.83 3.53a.56.56 0 01-.84.62L12.12 14a.56.56 0 00-.59 0L8.42 16.7a.56.56 0 01-.84-.62l.83-3.53a.56.56 0 00-.18-.56L5.46 8.56a.56.56 0 01.32-.99l3.64-.27c.22-.02.42-.17.5-.39l1.56-3.41z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
