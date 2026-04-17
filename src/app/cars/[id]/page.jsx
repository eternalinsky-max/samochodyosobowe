export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";
import CarOwnerActions from "@/components/CarOwnerActions";
import ReviewSection from "@/components/ReviewSection";

function pln(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(n);
}

function enumLabel(v) {
  if (!v) return "—";
  switch (String(v)) {
    case "PETROL":      return "Benzyna";
    case "DIESEL":      return "Diesel";
    case "HYBRID":      return "Hybryda";
    case "PHEV":        return "PHEV";
    case "ELECTRIC":    return "Elektryczny";
    case "LPG":         return "LPG";
    case "CNG":         return "CNG";
    case "MANUAL":      return "Manual";
    case "AUTOMATIC":   return "Automat";
    case "HATCHBACK":   return "Hatchback";
    case "SEDAN":       return "Sedan";
    case "WAGON":       return "Kombi";
    case "SUV":         return "SUV";
    case "COUPE":       return "Coupe";
    case "CONVERTIBLE": return "Kabriolet";
    case "VAN":         return "Van";
    case "PICKUP":      return "Pickup";
    default:            return String(v);
  }
}

async function getServerUserId() {
  const session = cookies().get("__session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    });
    return me?.id || null;
  } catch {
    return null;
  }
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
      background: "rgba(56,189,248,0.08)",
      border: "0.5px solid rgba(56,189,248,0.3)",
      borderRadius: "20px",
      padding: "5px 12px 5px 8px",
    }}>
      <div style={{ display: "flex", gap: "1.5px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20"
            fill={i <= full ? "#38bdf8" : "rgba(56,189,248,0.15)"}
            style={{ filter: i <= full ? "drop-shadow(0 0 3px rgba(56,189,248,0.6))" : "none" }}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "#38bdf8" }}>
        {avg.toFixed(1)}
      </span>
      <span style={{ fontSize: "12px", color: "rgba(56,189,248,0.5)" }}>
        · {count} {label}
      </span>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const car = await prisma.carListing.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      make: true,
      model: true,
      year: true,
      description: true,
      images: { take: 1, select: { url: true } },
    },
  });

  if (!car) return {};

  const title = car.title || `${car.make} ${car.model} ${car.year || ""}`.trim();
  const image = car.images?.[0]?.url || "/images/Bmw.jpg";

  return {
    title,
    description:
      car.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
      `${car.make} ${car.model} ${car.year || ""} – ogłoszenie samochodu.`,
    alternates: { canonical: `https://sautom.pl/cars/${params.id}` },
    openGraph: { title, images: [image] },
  };
}

function SpecCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

export default async function CarDetailsPage({ params }) {
  const car = await prisma.carListing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      user: { select: { id: true, displayName: true, photoUrl: true } },
    },
  });

  if (!car) return notFound();

  const cover = car.images?.[0]?.url || "/images/Bmw.jpg";
  const serverUserId = await getServerUserId();
  const isOwner = !!serverUserId && car.userId === serverUserId;

  const ratingAgg = await prisma.review.aggregate({
    where: { targetType: "LISTING", targetId: car.id, isHidden: false },
    _avg: { ratingOverall: true },
    _count: { _all: true },
  });
  const rating = ratingAgg._count._all > 0
    ? { avg: ratingAgg._avg.ratingOverall, count: ratingAgg._count._all }
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: car.title || `${car.make} ${car.model}`,
    brand: car.make,
    model: car.model,
    vehicleModelDate: car.year,
    fuelType: car.fuelType,
    vehicleTransmission: car.gearbox,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileageKm,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: car.pricePln,
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url: `https://sautom.pl/cars/${car.id}`,
    },
    image: cover,
  };

  return (
    <main className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/cars" className="text-sm text-white/70 hover:text-white">
          ← Wróć do listy
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">{car.title}</h1>
          {rating && <StarsBadge avg={rating.avg} count={rating.count} />}
        </div>

        <div className="mt-4 relative h-[400px] rounded-xl overflow-hidden">
          <Image src={cover} alt={car.title} fill className="object-cover" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SpecCard label="Cena" value={pln(car.pricePln)} />
          <SpecCard label="Rok" value={car.year || "—"} />
          <SpecCard label="Paliwo" value={enumLabel(car.fuelType)} />
          <SpecCard label="Skrzynia" value={enumLabel(car.gearbox)} />
        </div>

        {car.description && (
          <div
            className="mt-6 text-white/80 leading-relaxed prose prose-invert prose-sm max-w-none prose-a:text-sky-400 prose-a:underline prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: car.description }}
          />
        )}

        {isOwner && (
          <div className="mt-6">
            <CarOwnerActions carId={car.id} isActive={car.isActive} />
          </div>
        )}

        <ReviewSection targetType="LISTING" targetId={car.id} />

        {car.user?.id && (
          <ReviewSection targetType="USER" targetId={car.user.id} />
        )}
      </div>
    </main>
  );
}
