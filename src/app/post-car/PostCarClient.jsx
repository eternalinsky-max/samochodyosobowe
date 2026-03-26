"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/useAuthUser";
import CarImagesManager from "@/components/CarImagesManager";

const MAKES = {
  BMW: ["X1", "X3", "X5", "X6", "X7", "3 Series", "5 Series"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  Toyota: ["Corolla", "Camry", "RAV4", "Yaris"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Polo"],
  Mercedes: ["A-Class", "C-Class", "E-Class", "GLC", "GLE"],
};

const BODY_TYPES = [
  "HATCHBACK",
  "SEDAN",
  "WAGON",
  "SUV",
  "COUPE",
  "CONVERTIBLE",
  "VAN",
  "PICKUP",
];

const BODY_LABELS = {
  HATCHBACK: "Hatchback",
  SEDAN: "Sedan",
  WAGON: "Kombi",
  SUV: "SUV",
  COUPE: "Coupe",
  CONVERTIBLE: "Kabriolet",
  VAN: "Van",
  PICKUP: "Pickup",
};

const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "PHEV", "ELECTRIC", "LPG", "CNG"];

const FUEL_LABELS = {
  PETROL: "Benzyna",
  DIESEL: "Diesel",
  HYBRID: "Hybryda",
  PHEV: "Plug-in Hybrid",
  ELECTRIC: "Elektryczny",
  LPG: "LPG",
  CNG: "CNG",
};

const GEARBOX_TYPES = ["MANUAL", "AUTOMATIC"];

const GEARBOX_LABELS = {
  MANUAL: "Manualna",
  AUTOMATIC: "Automatyczna",
};

function toIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export default function PostCarClient() {
  const router = useRouter();
  const { user, loading } = useAuthUser();

  const [form, setForm] = useState({
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    pricePln: "",
    fuelType: "",
    gearbox: "",
    bodyType: "",
  });

  const [busy, setBusy] = useState(false);
  const [createdCarId, setCreatedCarId] = useState(null);

  const models = MAKES[form.make] || [];

  const canSubmit = useMemo(() => {
    return !loading && !!user && form.title && form.make && form.model && !busy;
  }, [loading, user, form, busy]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      make: form.make,
      model: form.model,
      year: toIntOrNull(form.year),
      pricePln: toIntOrNull(form.pricePln),
      fuelType: form.fuelType || null,
      gearbox: form.gearbox || null,
      bodyType: form.bodyType || null,
    };

    setBusy(true);

    try {
      const token = await user.getIdToken(true); // 🔥 FIX

      const res = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Błąd tworzenia ogłoszenia");
      }

      // ✅ показуємо upload
      setCreatedCarId(data.id);

    } catch (e) {
      alert(e.message || "Błąd");
    } finally {
      setBusy(false);
    }
  }

  const selectStyle =
    "mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 text-white px-3 py-2 text-sm";

  const inputStyle =
    "mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 text-white px-3 py-2 text-sm";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* TITLE */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-white">Tytuł *</label>
          <input name="title" value={form.title} onChange={onChange} className={inputStyle} />
        </div>

        {/* MAKE */}
        <div>
          <label className="text-sm font-medium text-white">Marka *</label>
          <select
            name="make"
            value={form.make}
            onChange={(e) =>
              setForm((p) => ({ ...p, make: e.target.value, model: "" }))
            }
            className={selectStyle}
          >
            <option value="">Wybierz markę</option>
            {Object.keys(MAKES).map((make) => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        {/* MODEL */}
        <div>
          <label className="text-sm font-medium text-white">Model *</label>
          <select name="model" value={form.model} onChange={onChange} className={selectStyle}>
            <option value="">Wybierz model</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* YEAR */}
        <div>
          <label className="text-sm font-medium text-white">Rok</label>
          <input name="year" value={form.year} onChange={onChange} className={inputStyle} />
        </div>

        {/* PRICE */}
        <div>
          <label className="text-sm font-medium text-white">Cena (PLN)</label>
          <input name="pricePln" value={form.pricePln} onChange={onChange} className={inputStyle} />
        </div>

        {/* BODY */}
        <div>
          <label className="text-sm font-medium text-white">Typ nadwozia</label>
          <select name="bodyType" value={form.bodyType} onChange={onChange} className={selectStyle}>
            <option value="">—</option>
            {BODY_TYPES.map((v) => (
              <option key={v} value={v}>{BODY_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {/* FUEL */}
        <div>
          <label className="text-sm font-medium text-white">Paliwo</label>
          <select name="fuelType" value={form.fuelType} onChange={onChange} className={selectStyle}>
            <option value="">—</option>
            {FUEL_TYPES.map((v) => (
              <option key={v} value={v}>{FUEL_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {/* GEARBOX */}
        <div>
          <label className="text-sm font-medium text-white">Skrzynia biegów</label>
          <select name="gearbox" value={form.gearbox} onChange={onChange} className={selectStyle}>
            <option value="">—</option>
            {GEARBOX_TYPES.map((v) => (
              <option key={v} value={v}>{GEARBOX_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {/* SUBMIT */}
        <div className="sm:col-span-2 flex justify-end pt-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:bg-gray-500"
          >
            {busy ? "Zapisywanie..." : "Dodaj auto"}
          </button>
        </div>

        {/* 🔥 IMAGES MANAGER */}
        {createdCarId && (
          <div className="sm:col-span-2 mt-6">
            <CarImagesManager carId={createdCarId} />
          </div>
        )}

      </div>
    </form>
  );
}