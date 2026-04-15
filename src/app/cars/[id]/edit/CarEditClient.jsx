"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

import CarImagesManager from "@/components/CarImagesManager"; // 🔥 ДОДАНО

function toStr(v) {
  return v == null ? "" : String(v);
}

function Field({ label, children, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-medium text-white/80">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CarEditClient({ car }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const [form, setForm] = useState(() => ({
    title: toStr(car.title),
    make: toStr(car.make),
    model: toStr(car.model),
    year: toStr(car.year),
    mileageKm: toStr(car.mileageKm),
    pricePln: toStr(car.pricePln),
    fuelType: toStr(car.fuelType),
    gearbox: toStr(car.gearbox),
    bodyType: toStr(car.bodyType),
    city: toStr(car.city),
    description: toStr(car.description),
    isActive: Boolean(car.isActive),
  }));

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => setUser(u ?? null));
    return () => unsub?.();
  }, []);

  const payload = useMemo(() => {
    return {
      title: form.title.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : null,
      mileageKm: form.mileageKm ? Number(form.mileageKm) : null,
      pricePln: form.pricePln ? Number(form.pricePln) : null,
      fuelType: form.fuelType || null,
      gearbox: form.gearbox || null,
      bodyType: form.bodyType || null,
      city: form.city.trim() || null,
      description: form.description.trim() || null,
      isActive: Boolean(form.isActive),
    };
  }, [form]);

  async function save(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!user) {
      setErr("Zaloguj się, aby edytować ogłoszenie.");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken?.(true);
      if (!token) throw new Error("Brak tokenu. Zaloguj się ponownie.");

      const res = await fetch(`/api/cars/${car.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-id-token": token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setInfo("Zapisano zmiany.");
      router.push(`/cars/${car.id}`);
      router.refresh();
    } catch (e2) {
      setErr(e2?.message || "Nie udało się zapisać zmian.");
    } finally {
      setLoading(false);
    }
  }

  const card =
    "rounded-[28px] border border-white/10 bg-black/45 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl";

  const input =
    "h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white " +
    "outline-none placeholder:text-white/45 " +
    "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20";

  const textarea =
    "min-h-[160px] w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white " +
    "outline-none placeholder:text-white/45 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20";

  const select =
    "h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white " +
    "outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20";

  const btn =
    "inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white " +
    "shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-500 active:bg-blue-700 " +
    "focus:outline-none focus:ring-4 focus:ring-blue-600/25";

  const btnGhost =
    "inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white " +
    "hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10";

  const btnDisabled =
    "inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/40";

  return (
    <div className="space-y-6">

      {/* FORM */}
      <form onSubmit={save} className={card}>
        <div className="grid gap-4 sm:grid-cols-2">

          <Field label="Tytuł" full>
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </Field>

          <Field label="Marka">
            <input
              className={input}
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
            />
          </Field>

          <Field label="Model">
            <input
              className={input}
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
          </Field>

          <Field label="Cena">
            <input
              className={input}
              value={form.pricePln}
              onChange={(e) => setForm((f) => ({ ...f, pricePln: e.target.value }))}
            />
          </Field>

          <Field label="Opis" full>
            <textarea
              className={textarea}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Opisz stan techniczny, historię serwisową, wyposażenie…"
            />
          </Field>

        </div>

        

        <div className="mt-6 flex gap-3">
          <button type="submit" className={loading ? btnDisabled : btn}>
            {loading ? "Zapisywanie…" : "Zapisz"}
          </button>

          <Link href={`/cars/${car.id}`} className={btnGhost}>
            Anuluj
          </Link>
        </div>
      </form>

      {/* 🔥 ФОТО З'ЯВЛЯЮТЬСЯ ТУТ */}
      <CarImagesManager carId={car.id} />

    </div>
  );
}