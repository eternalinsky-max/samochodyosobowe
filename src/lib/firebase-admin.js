import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app = null;
let adminAuth = null;
let adminDb = null;

const hasConfig =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasConfig) {
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  app =
    getApps().length === 0
      ? initializeApp({
          credential: cert(config),
        })
      : getApps()[0];

  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
} else {
  console.warn("Firebase Admin disabled (missing env vars)");
}

export { adminAuth, adminDb };

export async function verifyIdTokenFromRequest(req) {
  if (!adminAuth) return null;

  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;

  const token = header.split("Bearer ")[1];

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}