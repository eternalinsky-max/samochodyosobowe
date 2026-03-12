import Link from "next/link";
import prisma from "@/lib/prisma";

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

function fuelLabel(v) {
  switch (v) {
    case "PETROL":
      return "Benzyna";
    case "DIESEL":
      return "Diesel";
    case "HYBRID":
      return "Hybryda";
    case "PHEV":
      return "PHEV";
    case "ELECTRIC":
      return "Elektryczny";
    case "LPG":
      return "LPG";
    case "CNG":
      return "CNG";
    default:
      return v || "";
  }
}

function gearboxLabel(v) {
  switch (v) {
    case "MANUAL":
      return "Manual";
    case "AUTOMATIC":
      return "Automat";
    default:
      return v || "";
  }
}

function bodyTypeLabel(v) {
  switch (v) {
    case "HATCHBACK":
      return "Hatchback";
    case "SEDAN":
      return "Sedan";
    case "WAGON":
      return "Kombi";
    case "SUV":
      return "SUV";
    case "COUPE":
      return "Coupe";
    case "CONVERTIBLE":
      return "Kabriolet";
    case "VAN":
      return "Van";
    case "PICKUP":
      return "Pickup";
    default:
      return v || "";
  }
}

export default async function CarsListPage({ searchParams = {} }) {
  const make = String(searchParams.make ?? "");
  const fuelType = String(searchParams.fuel ?? "");
  const gearbox = String(searchParams.gearbox ?? "");
  const bodyType = String(searchParams.bodyType ?? "");
  const city = String(searchParams.city ?? "");

  const minPrice = toInt(searchParams.minPrice);
  const maxPrice = toInt(searchParams.maxPrice);

  const where = {
    isActive: true,
    ...(make ? { make: { contains: make, mode: "insensitive" } } : {}),
    ...(fuelType ? { fuelType } : {}),
    ...(gearbox ? { gearbox } : {}),
    ...(bodyType ? { bodyType } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(minPrice != null || maxPrice != null
      ? {
          pricePln: {
            ...(minPrice != null ? { gte: minPrice } : {}),
            ...(maxPrice != null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const cars = await prisma.carListing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      make: true,
      model: true,
      year: true,
      mileageKm: true,
      pricePln: true,
      fuelType: true,
      gearbox: true,
      bodyType: true,
      city: true,
      createdAt: true,
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: {
          url: true,
        },
      },
    },
  });

  const rows = cars.map((c) => {
    const meta = [
      c.year && `Rok: ${c.year}`,
      c.mileageKm != null && `Przebieg: ${c.mileageKm.toLocaleString("pl-PL")} km`,
      c.fuelType && `Paliwo: ${fuelLabel(c.fuelType)}`,
      c.gearbox && `Skrzynia: ${gearboxLabel(c.gearbox)}`,
      c.bodyType && `Nadwozie: ${bodyTypeLabel(c.bodyType)}`,
      c.city && `Miasto: ${c.city}`,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      id: c.id,
      title: c.title || `${c.make} ${c.model}`,
      price: pln(c.pricePln),
      meta,
      image: c.images?.[0]?.url || "/images/Bmw.jpg",
    };
  });

  const inputClass =
    "mt-1 h-11 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-white " +
    "outline-none placeholder:text-white/50 " +
    "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20";

  const selectClass = inputClass;

  const primaryBtn =
    "inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white " +
    "shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-500 active:bg-blue-700 " +
    "focus:outline-none focus:ring-4 focus:ring-blue-600/25";

  const ghostBtn =
    "inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white " +
    "hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10";

  return (
    <main className="relative">
      <div className="fixed inset-0 -z-10">
        <img
          src="/images/Bmw.jpg"
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 100%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <section className="mx-auto flex min-h-[520px] max-w-6xl items-end px-4 pb-14 sm:min-h-[560px] md:min-h-[600px]">
        <div className="w-full">
          <div className="mb-6 max-w-2xl text-white">
            <p className="text-sm tracking-[0.25em] text-white/80">OGŁOSZENIA</p>
            <h1 className="mt-3 text-4xl font-light leading-tight sm:text-5xl">
              Znajdź samochód w swoim stylu.
            </h1>
            <p className="mt-3 text-sm text-white/75">
              Filtruj po marce, paliwie, skrzyni, nadwoziu, mieście i cenie.
            </p>
          </div>

          <div
            className="
              w-full max-w-5xl rounded-2xl border border-white/10
              bg-black/55 ring-1 ring-white/10 p-6
              shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold tracking-tight text-white">
                  Filtry wyszukiwania
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Doprecyzuj parametry, aby zobaczyć najlepsze wyniki.
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                Wyniki: <b className="text-white">{rows.length}</b>
              </div>
            </div>

            <form method="GET" className="mt-5 grid gap-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-white/80">
                    Marka
                  </label>
                  <input
                    name="make"
                    defaultValue={make}
                    placeholder="np. BMW"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80">
                    Paliwo
                  </label>
                  <select name="fuel" defaultValue={fuelType} className={selectClass}>
                    <option value="">Wszystkie</option>
                    <option value="PETROL">Benzyna</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybryda</option>
                    <option value="PHEV">PHEV</option>
                    <option value="ELECTRIC">Elektryczny</option>
                    <option value="LPG">LPG</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80">
                    Skrzynia
                  </label>
                  <select name="gearbox" defaultValue={gearbox} className={selectClass}>
                    <option value="">Wszystkie</option>
                    <option value="MANUAL">Manual</option>
                    <option value="AUTOMATIC">Automat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80">
                    Nadwozie
                  </label>
                  <select name="bodyType" defaultValue={bodyType} className={selectClass}>
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
                  <label className="block text-xs font-medium text-white/80">
                    Miasto
                  </label>
                  <input
                    name="city"
                    defaultValue={city}
                    placeholder="np. Warszawa"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-white/80">
                    Cena (PLN)
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      name="minPrice"
                      defaultValue={minPrice ?? ""}
                      inputMode="numeric"
                      placeholder="Od"
                      className={inputClass}
                    />
                    <input
                      name="maxPrice"
                      defaultValue={maxPrice ?? ""}
                      inputMode="numeric"
                      placeholder="Do"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <button type="submit" className={primaryBtn}>
                    Filtruj
                  </button>

                  <Link href="/cars" className={ghostBtn}>
                    Wyczyść
                  </Link>

                  <div className="text-sm whitespace-nowrap text-white/80">
                    Wyniki: <b className="text-white">{rows.length}</b>
                  </div>
                </div>
              </div>

              <div className="sm:hidden text-xs text-white/80">
                Wyniki: <b className="text-white">{rows.length}</b>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-black/55 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">Najnowsze ogłoszenia</h2>
              <p className="mt-1 text-sm text-white/65">
                Wybierz ogłoszenie, aby zobaczyć szczegóły.
              </p>
            </div>

            <div className="shrink-0 text-sm whitespace-nowrap text-white/65">
              Wyniki: <b className="text-white">{rows.length}</b>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                Brak wyników dla wybranych filtrów.
              </div>
            ) : (
              rows.map((r) => (
                <Link
                  key={r.id}
                  href={`/cars/${r.id}`}
                  className="
                    group overflow-hidden rounded-2xl border border-white/10
                    bg-black/45 backdrop-blur-xl
                    shadow-[0_18px_50px_rgba(0,0,0,0.45)]
                    transition hover:-translate-y-0.5 hover:bg-black/50 hover:shadow-[0_22px_60px_rgba(0,0,0,0.50)]
                  "
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {r.price}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-semibold text-white">
                        {r.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-white/65">
                        {r.meta}
                      </div>
                    </div>

                    <div className="mt-3 text-sm font-semibold text-sky-400 group-hover:text-sky-300">
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