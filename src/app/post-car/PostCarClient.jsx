"use client";

import { useEffect, useMemo, useState } from "react";
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
  "HATCHBACK", "SEDAN", "WAGON", "SUV", "COUPE", "CONVERTIBLE", "VAN", "PICKUP",
];
const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "PHEV", "ELECTRIC", "LPG", "CNG"];
const GEARBOX_TYPES = ["MANUAL", "AUTOMATIC"];

function toIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

const optionStyle = { backgroundColor: "#0f172a", color: "#f1f5f9" };

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

  useEffect(() => {
    async function init() {
      if (!user || createdCarId) return;

      try {
        const token = await user.getIdToken(true);

        const res = await fetch("/api/cars", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: "Nowe ogłoszenie" }),
        });

        const data = await res.json();

        if (res.ok) {
          setCreatedCarId(data.id);
        } else {
          console.error("Create error:", data);
        }
      } catch (e) {
        console.error("AUTO CREATE ERROR", e);
      }
    }

    init();
  }, [user, createdCarId]);

  const canSubmit = useMemo(() => {
    return !loading && !!user && createdCarId && !busy;
  }, [loading, user, createdCarId, busy]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!createdCarId) return;

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
      const token = await user.getIdToken(true);

      const res = await fetch(`/api/cars/${createdCarId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Błąd zapisu");
      }

      router.push(`/cars/${createdCarId}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 text-white px-3 py-2 text-sm";
  const select = input;

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-700 bg-slate-900 p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-white">Tytuł *</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className={input}
              required
            />
          </div>

          <div>
            <label className="text-white">Marka</label>
            <select
              name="make"
              value={form.make}
              onChange={(e) =>
                setForm((p) => ({ ...p, make: e.target.value, model: "" }))
              }
              className={select}
            >
              <option value="" style={optionStyle}>—</option>
              {Object.keys(MAKES).map((m) => (
                <option key={m} style={optionStyle}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white">Model</label>
            <select name="model" value={form.model} onChange={onChange} className={select}>
              <option value="" style={optionStyle}>—</option>
              {models.map((m) => (
                <option key={m} style={optionStyle}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white">Cena</label>
            <input name="pricePln" value={form.pricePln} onChange={onChange} className={input} />
          </div>

          <div>
            <label className="text-white">Rok</label>
            <input name="year" value={form.year} onChange={onChange} className={input} />
          </div>

          <div>
            <label className="text-white">Paliwo</label>
            <select name="fuelType" value={form.fuelType} onChange={onChange} className={select}>
              <option value="" style={optionStyle}>—</option>
              {FUEL_TYPES.map((v) => (
                <option key={v} style={optionStyle}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white">Skrzynia</label>
            <select name="gearbox" value={form.gearbox} onChange={onChange} className={select}>
              <option value="" style={optionStyle}>—</option>
              {GEARBOX_TYPES.map((v) => (
                <option key={v} style={optionStyle}>{v}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-end pt-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Zapisywanie..." : "Zapisz ogłoszenie"}
            </button>
          </div>
        </div>
      </form>

      {createdCarId && <CarImagesManager carId={createdCarId} />}
    </div>
  );
}