// src/app/my-cars/MyCarsClient.jsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

function pln(n) {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} PLN`;
  }
}

function pickArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.cars)) return payload.cars;
  if (Array.isArray(payload.listings)) return payload.listings;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function MyCarsClient() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 12;

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Listen auth
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => setUser(u ?? null));
    return () => unsub?.();
  }, []);

  const canLoad = !!user;

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("perPage", String(perPage));
    return p.toString();
  }, [page]);

  async function load() {
    if (!canLoad) {
      setLoading(false);
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setHasNext(false);
      return;
    }

    setLoading(true);
    setErr("");

    try {
     const token = await user.getIdToken(true); // force refresh
      if (!token) throw new Error("Brak tokenu logowania. Zaloguj się ponownie.");

      const res = await fetch(`/api/my-cars?${query}`, {
        method: "GET",
        headers: {
          "x-id-token": token,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      const arr = pickArray(data);

      setItems(arr);
      setTotal(Number(data?.total ?? arr.length ?? 0));
      setTotalPages(Number(data?.totalPages ?? 1));
      setHasNext(Boolean(data?.hasNext ?? (arr.length >= perPage)));
    } catch (e) {
      setErr(e?.message || "Nie udało się załadować ogłoszeń.");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, query]);

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  const primaryBtn =
    "inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white " +
    "shadow-[0_12px_30px_rgba(220,38,38,0.25)] hover:bg-red-500 active:bg-red-700 " +
    "focus:outline-none focus:ring-4 focus:ring-red-600/20";

  const ghostBtn =
    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 " +
    "hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-black/5";

  const ghostBtnDisabled =
    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400";

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-700">
          Zaloguj się, aby zobaczyć swoje ogłoszenia.
        </div>
        <div className="mt-4">
          <Link href="/login" className={primaryBtn}>
            Zaloguj się
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {loading ? (
            "Ładowanie…"
          ) : (
            <>
              Wyniki: <b className="text-slate-900">{total}</b>
              {totalPages > 1 ? (
                <span className="ml-2 text-slate-500">
                  (Strona <b className="text-slate-900">{page}</b> z{" "}
                  <b className="text-slate-900">{totalPages}</b>)
                </span>
              ) : null}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/post-car" className={primaryBtn}>
            Dodaj ogłoszenie
          </Link>

          <button
            type="button"
            onClick={load}
            className={loading ? ghostBtnDisabled : ghostBtn}
            disabled={loading}
          >
            Odśwież
          </button>
        </div>
      </div>

      {/* Errors */}
      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[260px] rounded-2xl border border-slate-200 bg-white/70"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-700">
            Nie masz jeszcze żadnych ogłoszeń.
          </div>
          <div className="mt-4">
            <Link href="/post-car" className={primaryBtn}>
              Dodaj pierwsze ogłoszenie
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => {
              const id = c.id ?? c.carId ?? c.listingId;
              const title =
                c.title ||
                [c.make, c.model].filter(Boolean).join(" ") ||
                "Ogłoszenie";

              const price = pln(c.pricePln ?? c.price ?? c.price_pln);
              const city = c.city ?? "";
              const year = c.year ?? "";
              const createdAt = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString("pl-PL")
                : "";

              const coverUrl = c.coverUrl || c.cover || c.imageUrl || null;

              return (
                <Link key={id} href={`/cars/${id}`} className={cardClass}>
                  <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}

                    <div className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur">
                      {price}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {title}
                    </div>

                    <div className="mt-1 text-xs text-slate-600">
                      {[
                        year && `Rok: ${year}`,
                        city && `Miasto: ${city}`,
                        createdAt && `Dodano: ${createdAt}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>

                    <div className="mt-3 text-sm font-semibold text-red-600">
                      Otwórz →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              className={page <= 1 || loading ? ghostBtnDisabled : ghostBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              ← Poprzednia
            </button>

            <div className="text-sm text-slate-600">
              Strona <b className="text-slate-900">{page}</b>{" "}
              {totalPages ? (
                <>
                  z <b className="text-slate-900">{totalPages}</b>
                </>
              ) : null}
            </div>

            <button
              type="button"
              className={!hasNext || loading ? ghostBtnDisabled : ghostBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || loading}
            >
              Następna →
            </button>
          </div>
        </>
      )}
    </section>
  );
}
