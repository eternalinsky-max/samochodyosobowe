"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/useAuthUser";

export default function DeleteCarListingButton({ carId }) {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onDelete() {
    setErr("");
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const ok = window.confirm("Na pewno usunąć ogłoszenie? (razem ze zdjęciami)");
    if (!ok) return;

    setBusy(true);
    try {
      const token = await user.getIdToken();

      const res = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setErr(json?.error || "Nie udało się usunąć ogłoszenia.");
        return;
      }

      router.push("/cars");
      router.refresh();
    } catch {
      setErr("Błąd sieci.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy || loading}
        className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${
          busy ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {busy ? "Usuwanie..." : "Usuń ogłoszenie"}
      </button>

      {err ? <div className="mt-2 text-xs text-red-600">{err}</div> : null}
    </div>
  );
}


