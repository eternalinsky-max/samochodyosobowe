// src/components/DeleteJobButton.jsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";

export default function DeleteJobButton({ id, onDeleted, className = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Na pewno usunąć tę ofertę?")) return;

    try {
      setLoading(true);

      const user = auth.currentUser;
      const token = await user?.getIdToken(true);
      if (!token) {
        router.push("/login?next=" + encodeURIComponent(pathname || "/my-jobs"));
        return;
      }

      const res = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // 🔥 повідомляємо батьківський компонент
      if (typeof onDeleted === "function") {
        onDeleted(id);
      }

      // Якщо видаляємо НЕ з /my-jobs (наприклад, з /jobs/[id]) —
      // робимо редірект на список. Якщо ми в /my-jobs, просто рефреш.
      if (!pathname.startsWith("/my-jobs") && !onDeleted) {
        router.push("/jobs");
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error("Delete job error:", e);
      alert("Nie udało się usunąć oferty.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={`rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 ${className}`}
    >
      {loading ? "Usuwanie…" : "Usuń ofertę"}
    </button>
  );
}
