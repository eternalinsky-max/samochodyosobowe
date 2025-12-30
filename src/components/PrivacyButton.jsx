// src/components/PrivacyButton.jsx
'use client';
import Link from 'next/link';

export default function PrivacyButton({ size = 'sm', className = '' }) {
  const base =
    'inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition hover:bg-gray-50';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  return (
    <Link
      href="/privacy"
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${sizes[size]} ${className}`}
      aria-label="Polityka prywatności"
    >
      Polityka prywatności
    </Link>
  );
}
