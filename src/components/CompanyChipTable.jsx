'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * CompanyChipTable — мінімалістичний варіант для таблиць або списків.
 *
 * props:
 * - id?: string — якщо є, робить посилання на /companies/[id]
 * - name: string
 * - logoUrl?: string | null
 * - hrefBase?: string (default "/companies")
 * - size?: number (default 18)
 * - className?: string
 */
export default function CompanyChipTable({
  id,
  name = 'Firma',
  logoUrl = null,
  hrefBase = '/companies',
  size = 18,
  className = '',
}) {
  const initials =
    (name || 'F')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'F';

  const content = (
    <span className={`inline-flex items-center gap-1 truncate text-sm text-gray-700 ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="rounded-sm border border-gray-200 bg-white object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid place-items-center rounded-sm border bg-gray-50 text-[9px] font-medium text-gray-600"
          style={{ width: size, height: size }}
        >
          {initials}
        </span>
      )}
      <span className="max-w-[160px] truncate align-middle">{name}</span>
    </span>
  );

  return id ? (
    <Link href={`${hrefBase}/${id}`} className="hover:text-brand-600 hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}
