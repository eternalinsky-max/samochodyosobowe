// src/lib/auth.js
import { adminAuth } from "./firebase-admin";

export async function verifyFirebaseToken(req) {
  const authHeader =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("NO_TOKEN");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (e) {
    console.error("TOKEN ERROR:", e);
    throw new Error("INVALID_TOKEN");
  }
}