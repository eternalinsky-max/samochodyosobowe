import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pln(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(n);
}

function toInt(v) {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

export default async function CarsListPage({ searchParams = {} }) {
  const make = searchParams.make ?? "";
  const fuel = searchParams.fuel ?? "";
  const gearbox = searchParams.gearbox ?? "";
  const bodyType = searchParams.bodyType ?? "";
  const minPrice = toInt(searchParams.minPrice);
  const maxPrice = toInt(searchParams.maxPrice);

  const makes = await prisma.carMake.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  const where = {
    ...(make ? { model: { make: { slug: make } } } : {}),
    ...(fuel ? { fuelType: fuel } : {}),
    ...(gearbox ? { gearbox } : {}),
    ...(bodyType ? { bodyType } : {}),
    ...(minPrice != null || maxPrice != null
      ? {
          basePricePln: {
            ...(minPrice != null ? { gte: minPrice } : {}),
            ...(maxPrice != null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const trims = await prisma.carTrim.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      model: { include: { make: true } },
      ratings: true,
      comments: true,
    },
  });

  const rows = trims.map((t) => {
    const avg =
      t.ratings.length === 0
        ? null
        : t.ratings.reduce((a, r) => a + r.value, 0) / t.ratings.length;

    return {
      id: t.id,
      title: `${t.model.make.name} ${t.model.name} — ${t.name}`,
      price: pln(t.basePricePln),
      meta: [
        t.bodyType && `Nadwozie: ${t.bodyType}`,
        t.fuelType && `Paliwo: ${t.fuelType}`,
        t.gearbox && `Skrzynia: ${t.gearbox}`,
        t.powerHp && `${t.powerHp} HP`,
        t.rangeKm && `Zasięg ~${t.rangeKm} km`,
      ]
        .filter(Boolean)
        .join(" · "),
      avg,
      ratingsCount: t.ratings.length,
      commentsCount: t.comments.length,
    };
  });

  return (
    <main className="relative">
      {/* FIXED BACKGROUND (видно за hero, але нижче перекриємо білим) */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/images/Bmw.jpg"
          alt=""
          className="h-full w-full object-cover"
  style={{ objectPosition: "center 100%" }}
        />
    
      </div>

      {/* HERO */}
      <section className="mx-auto flex h-[420px] max-w-6xl items-end px-4 pb-16 sm:h-[480px] md:h-[520px]">
        <div className="w-full max-w-3xl rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold text-gray-900">
            Katalog nowych samochodów
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Porównuj ceny, wersje i wyposażenie nowych aut w Polsce.
          </p>

          {/* FILTERS */}
          <form method="GET" className="mt-4 grid gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Marka</label>
                <select
                  name="make"
                  defaultValue={make}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  {makes.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Paliwo</label>
                <select
                  name="fuel"
                  defaultValue={fuel}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  <option value="PETROL">Benzyna</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRID">Hybryda</option>
                  <option value="PHEV">PHEV</option>
                  <option value="ELECTRIC">Elektryczny</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Skrzynia</label>
                <select
                  name="gearbox"
                  defaultValue={gearbox}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Nadwozie</label>
                <select
                  name="bodyType"
                  defaultValue={bodyType}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="WAGON">Kombi</option>
                  <option value="SUV">SUV</option>
                  <option value="COUPE">Coupe</option>
                  <option value="CONVERTIBLE">Kabriolet</option>
                  <option value="VAN">Van</option>
                  <option value="PICKUP">Pickup</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Cena (PLN)</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <input
                    name="minPrice"
                    defaultValue={minPrice ?? ""}
                    inputMode="numeric"
                    placeholder="Od"
                    className="rounded-lg border px-3 py-2"
                  />
                  <input
                    name="maxPrice"
                    defaultValue={maxPrice ?? ""}
                    inputMode="numeric"
                    placeholder="Do"
                    className="rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex items-end gap-2">
                <button type="submit" className="btn-primary">
                  Filtruj
                </button>
                <Link href="/cars" className="btn-secondary">
                  Wyczyść
                </Link>

                <div className="ml-auto text-sm text-gray-600">
                  Wyniki: <b>{rows.length}</b>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      

      {/* LIST + reszta strony (перекриває fixed background) */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length === 0 ? (
              <div className="col-span-full rounded-xl border bg-white p-6 text-sm text-gray-600">
                Brak wyników dla wybranych filtrów.
              </div>
            ) : (
              rows.map((r) => (
                <Link
                  key={r.id}
                  href={`/cars/${r.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="h-40 bg-gray-100" />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-semibold text-gray-900">
                          {r.title}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-gray-600">
                          {r.meta}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">
                          {r.price}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {r.avg ? `${r.avg.toFixed(1)}/5` : "Brak ocen"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge">{r.ratingsCount} ocen</span>
                      <span className="badge">{r.commentsCount} komentarzy</span>
                    </div>

                    <div className="mt-3 text-sm font-semibold text-red-600 group-hover:text-red-700">
                      Zobacz szczegóły →
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


