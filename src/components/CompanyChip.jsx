'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

/**
 * CompanyChip — компактний чип компанії (лого + назва + лінк).
 *
 * props:
 * - id: string (для лінку /companies/[id]) — якщо нема, чип буде без лінку
 * - name: string
 * - logoUrl?: string | null
 * - hrefBase?: string (за замовчуванням "/companies")
 * - size?: number (px, default 24)
 * - className?: string
 */
export default function CompanyChip({
  id,
  name = 'Firma',
  logoUrl = null,
  hrefBase = '/companies',
  size = 24,
  className = '',
}) {
  const initials =
    (name || 'F')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'F';

  const chip = (
    <motion.span
      whileHover={{ scale: 1.05, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={`inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm ${className}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="rounded-md border bg-white object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid place-items-center rounded-md border bg-gray-50 text-[11px] font-medium text-gray-600"
          style={{ width: size, height: size }}
        >
          {initials}
        </span>
      )}
      <span className="max-w-[220px] truncate text-sm font-medium text-gray-700">{name}</span>
    </motion.span>
  );

  return id ? <Link href={`${hrefBase}/${id}`}>{chip}</Link> : chip;
}
