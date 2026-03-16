import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";

export const revalidate = 300;

export const metadata = {
  title: "Samochody – katalog samochodów",
  description: "Przeglądaj katalog samochodów dostępnych w Polsce.",
  alternates: {
    canonical: "https://samochodyosobowe.pl/cars",
  },
};

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
  const map = {
    PETROL: "Benzyna",
    DIESEL: "Diesel",
    HYBRID: "Hybryda",
    PHEV: "PHEV",
    ELECTRIC: "Elektryczny",
    LPG: "LPG",
    CNG: "CNG",
  };
  return map[v] || v || "";
}

function gearboxLabel(v) {
  const map = {
    MANUAL: "Manual",
    AUTOMATIC: "Automat",
  };
  return map[v] || v || "";
}

function bodyTypeLabel(v) {
  const map = {
    HATCHBACK: "Hatchback",
    SEDAN: "Sedan",
    WAGON: "Kombi",
    SUV: "SUV",
    COUPE: "Coupe",
    CONVERTIBLE: "Kabriolet",
    VAN: "Van",
    PICKUP: "Pickup",
  };
  return map[v] || v || "";
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
      images: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
  });

  const rows = cars.map((c) => ({
    id: c.id,
    title: c.title || `${c.make} ${c.model}`,
    price: pln(c.pricePln),
    image: c.images?.[0]?.url || "/images/Bmw.jpg",
    meta: [
      c.year && `Rok: ${c.year}`,
      c.mileageKm && `Przebieg: ${c.mileageKm.toLocaleString("pl-PL")} km`,
      c.fuelType && `Paliwo: ${fuelLabel(c.fuelType)}`,
      c.gearbox && `Skrzynia: ${gearboxLabel(c.gearbox)}`,
      c.bodyType && `Nadwozie: ${bodyTypeLabel(c.bodyType)}`,
      c.city && `Miasto: ${c.city}`,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: rows.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://samochodyosobowe.pl/cars/${r.id}`,
      name: r.title,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <h1 className="text-3xl font-semibold text-white mb-6">
        Najnowsze ogłoszenia
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {rows.length === 0 ? (
          <div className="text-white/70">Brak wyników.</div>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/cars/${r.id}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-black/40"
            >
              <div className="relative h-52">

                <Image
                  src={r.image}
                  alt={r.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />

                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 text-xs text-white rounded">
                  {r.price}
                </div>

              </div>

              <div className="p-4">
                <div className="text-sm font-semibold text-white">
                  {r.title}
                </div>

                <div className="text-xs text-white/70 mt-1">
                  {r.meta}
                </div>

                <div className="text-sky-400 text-sm mt-3">
                  Zobacz szczegóły →
                </div>
              </div>
            </Link>
          ))
        )}

      </div>
    </main>
  );
}