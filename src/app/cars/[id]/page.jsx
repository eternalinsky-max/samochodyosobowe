export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";
import CarOwnerActions from "@/components/CarOwnerActions";

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
    case "MANUAL":
      return "Manual";
    case "AUTOMATIC":
      return "Automat";
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
      return String(v);
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

  const title =
    car.title || `${car.make} ${car.model} ${car.year || ""}`.trim();

  const image = car.images?.[0]?.url || "/images/Bmw.jpg";

  return {
    title,
    description:
      car.description?.slice(0, 160) ||
      `${car.make} ${car.model} ${car.year || ""} – ogłoszenie samochodu.`,

    alternates: {
      canonical: `https://samochodyosobowe.pl/cars/${params.id}`,
    },

    openGraph: {
      title,
      images: [image],
    },
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
    },
  });

  if (!car) return notFound();

  const cover = car.images?.[0]?.url || "/images/Bmw.jpg";

  const serverUserId = await getServerUserId();
  const isOwner = !!serverUserId && car.userId === serverUserId;

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
      url: `https://samochodyosobowe.pl/cars/${car.id}`,
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

        <Link
          href="/cars"
          className="text-sm text-white/70 hover:text-white"
        >
          ← Wróć do listy
        </Link>

        <h1 className="mt-4 text-3xl font-semibold text-white">
          {car.title}
        </h1>

        <div className="mt-4 relative h-[400px] rounded-xl overflow-hidden">

          <Image
            src={cover}
            alt={car.title}
            fill
            className="object-cover"
          />

        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <SpecCard label="Cena" value={pln(car.pricePln)} />
          <SpecCard label="Rok" value={car.year || "—"} />
          <SpecCard label="Paliwo" value={enumLabel(car.fuelType)} />
          <SpecCard label="Skrzynia" value={enumLabel(car.gearbox)} />

        </div>

        {car.description && (
          <div className="mt-6 text-white/80">
            {car.description}
          </div>
        )}

        {isOwner && (
          <div className="mt-6">
            <CarOwnerActions carId={car.id} isActive={car.isActive} />
          </div>
        )}

      </div>
    </main>
  );
}