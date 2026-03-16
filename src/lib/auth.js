import { adminAuth } from "@/lib/firebase-admin";

export async function verifyFirebaseToken(token) {
  try {
    if (!token) return null;

    if (!adminAuth) {
      console.warn("Firebase admin not configured");
      return null;
    }

    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (e) {
    console.error("verifyFirebaseToken error:", e);
    return null;
  }
}

export async function requireAdmin() {
  return false;
}