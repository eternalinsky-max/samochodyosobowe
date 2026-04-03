"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

import CarImagesManager from "@/components/CarImagesManager";

export default function CarEditForm({ carId, user }) {
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🔥 LOAD CAR
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = user ? await user.getIdToken() : null;

        const res = await fetch(`/api/cars/${carId}`, {
          headers: token ? { "x-id-token": token } : {},
        });

        const data = await res.json();

        if (!cancelled) {
          setForm({
            title: data.title || "",
            price: data.pricePln || "",
            city: data.city || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [carId, user]);

  const setField = (k, v) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();

    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      alert("Zaloguj się");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-id-token": token,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Błąd");

      alert("Zapisano");
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Ładowanie...</div>;
  if (!form) return <div>Błąd</div>;

  return (
    <div className="space-y-6">

      {/* FORM */}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Tytuł"
          className="input"
        />

        <input
          value={form.price}
          onChange={(e) => setField("price", e.target.value)}
          placeholder="Cena"
          className="input"
        />

        <input
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
          placeholder="Miasto"
          className="input"
        />

        <button disabled={submitting} className="btn btn-primary">
          Zapisz
        </button>
      </form>

      {/* 🔥 ОЦЕ ГОЛОВНЕ */}
      <CarImagesManager carId={carId} />

    </div>
  );
}

