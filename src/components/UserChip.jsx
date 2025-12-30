'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * UserChip — маленький чип з аватаром і ім'ям користувача.
 *
 * props:
 * - id: string (обов'язково для лінку /users/[id])
 * - name: string
 * - photoUrl?: string | null
 * - hrefBase?: string (за замовчуванням "/users")
 * - size?: number (px, default 24)
 * - className?: string
 */
export default function UserChip({
  id,
  name = 'Użytkownik',
  photoUrl = null,
  hrefBase = '/users',
  size = 24,
  className = '',
}) {
  const initials =
    (name || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  const chip = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`Avatar ${name}`}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="rounded-full border bg-white object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid place-items-center rounded-full border bg-gray-50 text-[11px] font-medium text-gray-600"
          style={{ width: size, height: size }}
        >
          {initials}
        </span>
      )}
      <span className="max-w-[180px] truncate text-sm font-medium">{name}</span>
    </span>
  );

  return id ? <Link href={`${hrefBase}/${id}`}>{chip}</Link> : chip;
}
