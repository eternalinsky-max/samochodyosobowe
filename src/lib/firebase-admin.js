import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app = null;
let adminAuth = null;
let adminDb = null;

const hasFirebaseConfig =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseConfig) {
  const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  app =
    getApps().length === 0
      ? initializeApp({
          credential: cert(firebaseAdminConfig),
        })
      : getApps()[0];

  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
} else {
  console.warn("Firebase Admin not initialized (missing env vars)");
}

export { adminAuth, adminDb };

export async function verifyIdTokenFromRequest(req) {
  if (!adminAuth) return null;

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("Token verification failed", error);
    return null;
  }
}