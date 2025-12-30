// src/lib/login-with-google.js
'use client';
/* eslint-env browser */

import { signInWithPopup, signInWithRedirect } from 'firebase/auth';

import { auth, googleProvider } from '@/lib/firebase';

/**
 * Логін через Google:
 * 1) основний шлях — popup;
 * 2) fallback — redirect (для Safari/WebView/COOP).
 */
export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    // У браузерному середовищі надійно відкочуємось до redirect.
    if (typeof window !== 'undefined') {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    // Якщо викликнули не з браузера — прокидуємо помилку далі.
    throw err;
  }
}
