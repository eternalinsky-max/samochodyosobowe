// src/components/AddJobButton.jsx
'use client';
/* eslint-env browser */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { auth } from '@/lib/firebase';

export default function AddJobButton({
  className = 'btn btn-primary',
  children = 'Dodaj ofertę',
}) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    const user = auth.currentUser;
    router.push(user ? '/post-job' : '/login?next=/post-job');
  }, [router]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-label="Dodaj ofertę pracy"
    >
      {children}
    </button>
  );
}
