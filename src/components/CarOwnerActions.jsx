"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function CarOwnerActions({ carId, isActive }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [active, setActive] = useState(Boolean(isActive));

  useEffect(() => setActive(Boolean(isActive)), [isActive]);

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => setUser(u ?? null));
    return () => unsub?.();
  }, []);

  async function toggleActive() {
    setErr("");
    if (!user) {
      setErr("Zaloguj się, aby zarządzać ogłoszeniem.");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken?.(true);
      if (!token) throw new Error("Brak tokenu. Zaloguj się ponownie.");

      const res = await fetch(`/api/cars/${carId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-id-token": token,
        },
        body: JSON.stringify({ isActive: !active }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setActive(Boolean(data?.item?.isActive));
    } catch (e) {
      setErr(e?.message || "Nie udało się zmienić statusu ogłoszenia.");
    } finally {
      setLoading(false);
    }
  }

  async function removeListing() {
    setErr("");
    if (!user) {
      setErr("Zaloguj się, aby zarządzać ogłoszeniem.");
      return;
    }

    if (!confirm("Czy na pewno usunąć ogłoszenie?")) return;

    setLoading(true);
    try {
      const token = await user.getIdToken?.(true);
      if (!token) throw new Error("Brak tokenu. Zaloguj się ponownie.");

      const res = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
        headers: {
          "x-id-token": token,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      window.location.href = "/cars";
    } catch (e) {
      setErr(e?.message || "Nie udało się usunąć ogłoszenia.");
    } finally {
      setLoading(false);
    }
  }

  const btnPrimary =
    "inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white " +
    "shadow-[0_12px_30px_rgba(37,99,235,0.18)] hover:bg-blue-500 active:bg-blue-700 " +
    "focus:outline-none focus:ring-4 focus:ring-blue-600/20";

  const btnDanger =
    "inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white " +
    "shadow-[0_12px_30px_rgba(220,38,38,0.20)] hover:bg-red-500 active:bg-red-700 " +
    "focus:outline-none focus:ring-4 focus:ring-red-600/20";

  const btnGhost =
    "inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 " +
    "hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-black/5";

  const btnDisabled =
    "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400";

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleActive}
          disabled={loading}
          className={loading ? btnDisabled : btnPrimary}
        >
          {active ? "Dezaktywuj ogłoszenie" : "Aktywuj ogłoszenie"}
        </button>

        <Link href={`/cars/${carId}/edit`} className={btnGhost}>
          Edytuj
        </Link>

        <button
          type="button"
          onClick={removeListing}
          disabled={loading}
          className={loading ? btnDisabled : btnDanger}
        >
          Usuń
        </button>

        <div className="ml-auto text-xs text-slate-600">
          Status:{" "}
          <b className={active ? "text-emerald-700" : "text-slate-600"}>
            {active ? "Aktywne" : "Nieaktywne"}
          </b>
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}
    </div>
  );
}

