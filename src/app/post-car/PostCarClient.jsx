"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/useAuthUser";
import CarImagesManager from "@/components/CarImagesManager";

const MAKES = {
  Abarth: ["500", "595", "695"],
  "Alfa Romeo": ["Giulia", "Giulietta", "Stelvio", "Tonale"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT", "R8"],
  BMW: ["X1", "X2", "X3", "X4", "X5", "X6", "X7", "1", "2", "3", "4", "5", "6", "7", "8", "i3", "i4", "i5", "i7", "iX", "M3", "M5"],
  BYD: ["Atto 3", "Han", "Seal", "Dolphin", "Tang"],
  Citroen: ["C1", "C3", "C4", "C5", "Berlingo", "Spacetourer"],
  Cupra: ["Born", "Formentor", "Leon", "Ateca"],
  Dacia: ["Sandero", "Duster", "Logan", "Spring", "Jogger"],
  DS: ["DS 3", "DS 4", "DS 7", "DS 9"],
  Fiat: ["500", "Panda", "Tipo", "Doblo", "Bravo"],
  Ford: ["Fiesta", "Focus", "Kuga", "Puma", "Mustang", "Explorer", "Ranger", "Transit"],
  Honda: ["Civic", "CR-V", "HR-V", "Jazz", "e"],
  Hyundai: ["i10", "i20", "i30", "Tucson", "Santa Fe", "Kona", "Ioniq 5", "Ioniq 6"],
  Jaguar: ["E-Pace", "F-Pace", "I-Pace", "XE", "XF"],
  Jeep: ["Renegade", "Compass", "Wrangler", "Grand Cherokee"],
  Kia: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Stinger", "EV6", "Niro"],
  "Land Rover": ["Defender", "Discovery", "Freelander", "Range Rover", "Range Rover Sport", "Range Rover Evoque"],
  Lexus: ["CT", "IS", "ES", "NX", "RX", "UX"],
  Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-60", "MX-5"],
  Mercedes: ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQS"],
  Mini: ["Hatch", "Clubman", "Countryman", "Cabrio", "Paceman"],
  Mitsubishi: ["ASX", "Eclipse Cross", "Outlander", "L200"],
  Nissan: ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya"],
  Opel: ["Corsa", "Astra", "Insignia", "Crossland", "Grandland", "Mokka", "Zafira"],
  Peugeot: ["108", "208", "308", "408", "508", "2008", "3008", "5008"],
  Polestar: ["Polestar 2", "Polestar 3", "Polestar 4"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Renault: ["Clio", "Megane", "Captur", "Kadjar", "Arkana", "Zoe", "Austral"],
  Seat: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  Skoda: ["Fabia", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  Smart: ["ForTwo", "ForFour", "#1", "#3"],
  Subaru: ["Impreza", "Legacy", "Forester", "Outback", "XV"],
  Suzuki: ["Alto", "Swift", "Vitara", "S-Cross", "Jimny"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  Toyota: ["Aygo", "Yaris", "Corolla", "Camry", "RAV4", "C-HR", "Highlander", "Land Cruiser", "bZ4X", "Prius"],
  Volkswagen: ["Polo", "Golf", "Passat", "Tiguan", "T-Roc", "T-Cross", "Touareg", "ID.3", "ID.4", "ID.5"],
  Volvo: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40"],
};

const BODY_TYPES = ["HATCHBACK", "SEDAN", "WAGON", "SUV", "COUPE", "CONVERTIBLE", "VAN", "PICKUP"];
const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "PHEV", "ELECTRIC", "LPG", "CNG"];
const GEARBOX_TYPES = ["MANUAL", "AUTOMATIC"];

function toIntOrNull(v) {
  const n = parseInt(String(v).replace(/\s/g, ""), 10);
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
            <input name="pricePln" value={form.pricePln} onChange={onChange} className={input} placeholder="np. 95000" />
          </div>

          <div>
            <label className="text-white">Rok</label>
            <input name="year" value={form.year} onChange={onChange} className={input} placeholder="np. 2022" />
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

          <div className="sm:col-span-2">
            <label className="text-white">Opis</label>
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={(e) =>
                setForm((p) => ({ ...p, description: e.currentTarget.innerHTML }))
              }
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 text-white px-3 py-2 text-sm"
              style={{ minHeight: "150px", overflowY: "auto", outline: "none" }}
            />
            <p className="mt-1 text-xs text-white/40">
              Możesz wkleić tekst z <strong className="text-white/40">pogrubieniem</strong> — formatowanie zostanie zachowane.
            </p>
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
