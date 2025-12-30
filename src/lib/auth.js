// src/lib/auth.js
// eslint-disable-next-line import/no-unresolved
import 'server-only';

import * as admin from 'firebase-admin';

const GLOBAL_KEY = '__FIREBASE_ADMIN_APP__';

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim()) {
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      return {
        projectId: json.project_id,
        clientEmail: json.client_email,
        privateKey: (json.private_key || '').replace(/\\n/g, '\n'),
      };
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is set but not valid JSON after decode');
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) {
    try {
      const json = JSON.parse(raw);
      return {
        projectId: json.project_id,
        clientEmail: json.client_email,
        privateKey: (json.private_key || '').replace(/\\n/g, '\n'),
      };
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is present but not valid JSON');
    }
  }

  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_JSON is missing');
}

function initAdmin() {
  if (globalThis[GLOBAL_KEY]) return globalThis[GLOBAL_KEY];

  const creds = getServiceAccount();
  const app =
    admin.apps.length > 0
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId: creds.projectId,
            clientEmail: creds.clientEmail,
            privateKey: creds.privateKey,
          }),
        });

  globalThis[GLOBAL_KEY] = app;
  return app;
}

const adminApp = initAdmin();
const adminAuth = admin.auth(adminApp);

export async function verifyFirebaseToken(input, { checkRevoked = false } = {}) {
  try {
    if (!input) return null;
    const token = input.startsWith('Bearer ') ? input.slice(7).trim() : input.trim();
    if (!token) return null;
    return await adminAuth.verifyIdToken(token, checkRevoked);
  } catch {
    return null;
  }
}

export { adminApp, adminAuth };
export default adminAuth;
