"use client";

import { useState } from "react";
import Link from "next/link";

const popularBrands = [
  "BMW", "Audi", "Mercedes-Benz", "Volkswagen", "Toyota", "Skoda",
  "Ford", "Opel", "Kia", "Hyundai", "Renault", "Peugeot",
  "Nissan", "Mazda", "Volvo", "Tesla", "Dacia", "Seat",
];

const otherBrands = [
  "Abarth", "Alfa Romeo", "BYD", "Citroen", "Cupra", "DS",
  "Fiat", "Honda", "Jaguar", "Jeep", "Land Rover", "Lexus",
  "Mini", "Mitsubishi", "Polestar", "Porsche", "Smart", "Subaru", "Suzuki",
];

function BrandCard({ brand }) {
  const slug = brand.toLowerCase().replace(/\s+/g, "-");
  return (
    <Link
      href={`/cars?make=${encodeURIComponent(brand)}`}
      className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm font-semibold uppercase tracking-wide text-white transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-400"
    >
      {brand}
    </Link>
  );
}

export default function BrandsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white mb-6">Marki samochodów</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {popularBrands.map((b) => <BrandCard key={b} brand={b} />)}
        {open && otherBrands.map((b) => <BrandCard key={b} brand={b} />)}
      </div>

      <div className="mt-8">
        <button
          onClick={() => setOpen(!open)}
          className="btn btn-primary"
        >
          {open ? "Pokaż mniej" : "Pokaż więcej"}
        </button>
      </div>
    </div>
  );
}
