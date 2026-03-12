// src/app/cars/[id]/edit/page.jsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import CarEditClient from "./CarEditClient";

export const dynamic = "force-dynamic";

export default async function CarEditPage({ params }) {
  const car = await prisma.carListing.findUnique({
    where: { id: params.id },
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
      description: true,
      isActive: true,
    },
  });

  if (!car) return notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <CarEditClient car={car} />
    </main>
  );
}
