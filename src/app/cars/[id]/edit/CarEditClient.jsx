"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

function toStr(v) {
  return v == null ? "" : String(v);
}

function Field({ label, children, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-medium text-white/80">{label}</label>
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/cars/${car.id}`}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
        >
          ← Wróć
        </Link>

        <div className="text-sm font-semibold tracking-[0.18em] text-white/70">
          EDYCJA OGŁOSZENIA
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300 backdrop-blur-md">
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 backdrop-blur-md">
          {info}
        </div>
      ) : null}

      <form onSubmit={save} className={card}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tytuł" full>
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="np. BMW 3 320d M Pakiet"
              required
            />
          </Field>

          <Field label="Marka">
            <input
              className={input}
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
              placeholder="BMW"
            />
          </Field>

          <Field label="Model">
            <input
              className={input}
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="320d"
            />
          </Field>

          <Field label="Rok">
            <input
              className={input}
              inputMode="numeric"
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              placeholder="2018"
            />
          </Field>

          <Field label="Przebieg (km)">
            <input
              className={input}
              inputMode="numeric"
              value={form.mileageKm}
              onChange={(e) => setForm((f) => ({ ...f, mileageKm: e.target.value }))}
              placeholder="120000"
            />
          </Field>

          <Field label="Cena (PLN)">
            <input
              className={input}
              inputMode="numeric"
              value={form.pricePln}
              onChange={(e) => setForm((f) => ({ ...f, pricePln: e.target.value }))}
              placeholder="65000"
            />
          </Field>

          <Field label="Miasto">
            <input
              className={input}
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Warszawa"
            />
          </Field>

          <Field label="Paliwo">
            <select
              className={select}
              value={form.fuelType}
              onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
            >
              <option value="">Wybierz</option>
              <option value="PETROL">Benzyna</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybryda</option>
              <option value="PHEV">PHEV</option>
              <option value="ELECTRIC">Elektryczny</option>
              <option value="LPG">LPG</option>
              <option value="CNG">CNG</option>
            </select>
          </Field>

          <Field label="Skrzynia">
            <select
              className={select}
              value={form.gearbox}
              onChange={(e) => setForm((f) => ({ ...f, gearbox: e.target.value }))}
            >
              <option value="">Wybierz</option>
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automat</option>
            </select>
          </Field>

          <Field label="Nadwozie">
            <select
              className={select}
              value={form.bodyType}
              onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value }))}
            >
              <option value="">Wybierz</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="SEDAN">Sedan</option>
              <option value="WAGON">Kombi</option>
              <option value="SUV">SUV</option>
              <option value="COUPE">Coupe</option>
              <option value="CONVERTIBLE">Kabriolet</option>
              <option value="VAN">Van</option>
              <option value="PICKUP">Pickup</option>
            </select>
          </Field>

          <Field label="Opis" full>
            <textarea
              className={textarea}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Opis samochodu..."
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 backdrop-blur-md">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Aktywne ogłoszenie
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" className={loading ? btnDisabled : btn} disabled={loading}>
            {loading ? "Zapisywanie…" : "Zapisz"}
          </button>

          <Link href={`/cars/${car.id}`} className={btnGhost}>
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  );
}