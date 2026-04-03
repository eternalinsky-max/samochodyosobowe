"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";

export default function AuthSessionSync() {
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.(async (u) => {
      try {
        if (u) {
          const idToken = await u.getIdToken(true);
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        } else {
          await fetch("/api/auth/session", { method: "DELETE" });
        }
      } catch (e) {
        console.error("AuthSessionSync error:", e);
      }
    });

    return () => unsub?.();
  }, []);

  return null;
}

