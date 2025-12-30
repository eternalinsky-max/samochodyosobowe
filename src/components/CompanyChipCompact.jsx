'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

/**
 * CompanyChipCompact — мінімальний варіант чипа (тільки іконка + назва).
 *
 * props:
 * - id: string (для лінку /companies/[id]) — якщо нема, чип буде без лінку
 * - name: string
 * - logoUrl?: string | null
 * - hrefBase?: string (за замовчуванням "/companies")
 * - size?: number (px, default 20)
 * - className?: string
 */
export default function CompanyChipCompact({
  id,
  name = 'Firma',
  logoUrl = null,
  hrefBase = '/companies',
  size = 20,
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
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
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
      <span className="truncate text-sm text-gray-700">{name}</span>
    </motion.span>
  );

  return id ? <Link href={`${hrefBase}/${id}`}>{chip}</Link> : chip;
}
