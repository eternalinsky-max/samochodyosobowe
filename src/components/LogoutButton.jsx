// src/components/LogoutButton.jsx
'use client';
/* eslint-env browser */

import { signOut } from 'firebase/auth';
import { useState } from 'react';

import { auth } from '@/lib/firebase';

export default function LogoutButton({
  className = 'w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg',
}) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (e) {
      console.error('Błąd podczas wylogowania:', e);
      alert('Nie udało się wylogować. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`${className} ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
      aria-label="Wyloguj się"
    >
      {loading ? 'Wylogowywanie…' : 'Wyloguj'}
    </button>
  );
}
