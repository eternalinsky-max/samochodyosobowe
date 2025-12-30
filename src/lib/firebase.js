// src/lib/firebase.js
'use client';

import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from './firebase-client';

// Опційно: підказати Google показувати вибір акаунта
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Logowanie Google z fallbackiem na redirect (Safari/WebView itp.) */
export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    // Якщо це не «popup blocked / not supported», пробуємо пробросити реальну помилку
    const code = err?.code || '';
    const popupIssues = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
    ];
    if (!popupIssues.includes(code)) throw err;

    // Фолбек: редірект (працює у Safari/WebView)
    await signInWithRedirect(auth, googleProvider);
    return; // після повернення з редіректу обробляй getRedirectResult() там, де потрібно
  }
}

export { auth, googleProvider };
