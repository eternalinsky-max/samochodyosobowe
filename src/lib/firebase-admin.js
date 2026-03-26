// src/lib/firebase-admin.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app;

if (!getApps().length) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf-8");

    serviceAccount = JSON.parse(json);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    );
  } else {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 or JSON is missing"
    );
  }

  // 🔥 FIX для private_key
  serviceAccount.private_key =
    serviceAccount.private_key.replace(/\\n/g, "\n");

  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);