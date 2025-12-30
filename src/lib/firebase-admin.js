// src/lib/firebase-admin.js
// Серверні утиліти Firebase Admin (API-роути, server actions).
// ⚠️ НЕ імпортувати в клієнтському коді (без "use client").

import 'server-only';

import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { adminApp, adminAuth } from './auth';

// Опційно: підтримка емуляторів у DEV
// Вистави NEXT_PUBLIC_USE_FIREBASE_EMULATORS="1" у .env, щоб автопідключити хости емуляторів.
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1') {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
  process.env.STORAGE_EMULATOR_HOST ||= '127.0.0.1:9199';
}

// Ініціалізація сервісів від уже створеного adminApp (див. src/lib/auth.js)
const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);

// === Експорти для використання в роутерах/сервері ===
export { adminApp, adminAuth, adminDb, adminStorage };

/**
 * Зручний хелпер: перевірка Firebase ID токена.
 * Повертає DecodedIdToken або кидає помилку, якщо токен некоректний/прострочений.
 */
export async function verifyIdToken(idToken, checkRevoked = false) {
  if (!idToken) throw new Error('Missing ID token');
  return adminAuth.verifyIdToken(idToken, checkRevoked);
}

/** Отримати користувача за uid (обгортка над Admin Auth) */
export function getUser(uid) {
  return adminAuth.getUser(uid);
}
