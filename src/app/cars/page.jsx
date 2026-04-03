import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";

export const revalidate = 300;

export const metadata = {
  title: "Samochody – katalog samochodów",
  description: "Przeglądaj katalog samochodów dostępnych w Polsce.",
  alternates: {
    canonical: "https://sautom.pl/cars",
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
    PETROL: "Benzyna", DIESEL: "Diesel", HYBRID: "Hybryda",
    PHEV: "PHEV", ELECTRIC: "Elektryczny", LPG: "LPG", CNG: "CNG",
  };
  return map[v] || v || "";
}

function gearboxLabel(v) {
  return v === "MANUAL" ? "Manual" : v === "AUTOMATIC" ? "Automat" : v || "";
}

function StarsBadge({ avg, count }) {
  if (!avg || !count) return null;
  const full = Math.round(avg);
  const label = count === 1 ? "ocena" : count < 5 ? "oceny" : "ocen";
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginTop: "8px",
      background: "rgba(56,189,248,0.08)",
      border: "0.5px solid rgba(56,189,248,0.3)",
      borderRadius: "20px",
      padding: "4px 10px 4px 7px",
    }}>
      <div style={{ display: "flex", gap: "1.5px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width="12" height="12" viewBox="0 0 20 20"
            fill={i <= full ? "#38bdf8" : "rgba(56,189,248,0.15)"}
            style={{ filter: i <= full ? "drop-shadow(0 0 3px rgba(56,189,248,0.6))" : "none" }}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span style={{ fontSize: "11px", fontWeight: 500, color: "#38bdf8" }}>
        {avg.toFixed(1)}
      </span>
      <span style={{ fontSize: "11px", color: "rgba(56,189,248,0.5)" }}>
        · {count} {label}
      </span>
    </div>
  );
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
      ? { pricePln: { ...(minPrice != null ? { gte: minPrice } : {}), ...(maxPrice != null ? { lte: maxPrice } : {}) } }
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

  const ids = cars.map((c) => c.id);
  const reviewAggs = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "LISTING", targetId: { in: ids }, isHidden: false },
    _avg: { ratingOverall: true },
    _count: { _all: true },
  });

  const ratingMap = Object.fromEntries(
    reviewAggs.map((r) => [r.targetId, { avg: r._avg.ratingOverall, count: r._count._all }])
  );

  const rows = cars.map((c) => ({
    id: c.id,
    title: c.title || `${c.make} ${c.model}`,
    price: pln(c.pricePln),
    image: c.images?.[0]?.url || "/images/Bmw.jpg",
    meta: [
      c.year && `Rok: ${c.year}`,
      c.fuelType && `Paliwo: ${fuelLabel(c.fuelType)}`,
      c.gearbox && `Skrzynia: ${gearboxLabel(c.gearbox)}`,
    ].filter(Boolean).join(" · "),
    rating: ratingMap[c.id] || null,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: rows.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://sautom.pl/cars/${r.id}`,
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
                <div className="text-sm font-semibold text-white">{r.title}</div>
                <div className="text-xs text-white/70 mt-1">{r.meta}</div>
                <StarsBadge avg={r.rating?.avg} count={r.rating?.count} />
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
