"use client";

import { useState } from "react";
import Link from "next/link";

const popularBrands = [
"bmw",
"audi",
"mercedes-benz",
"volkswagen",
"toyota",
"skoda",
"ford",
"opel",
"kia",
"hyundai",
"renault",
"peugeot",
"nissan",
"mazda",
"volvo",
"tesla",
"dacia",
"seat"
];

const otherBrands = [
"abarth",
"alfa-romeo",
"byd",
"citroen",
"cupra",
"ds",
"fiat",
"honda",
"iveco",
"jaguar",
"jeep",
"land-rover",
"lexus",
"mini",
"mitsubishi",
"polestar",
"porsche",
"smart",
"ssangyong",
"subaru",
"suzuki"
];

function BrandGrid({ brands }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
        gap: 16,
        marginTop: 20
      }}
    >
      {brands.map((brand) => (
        <Link
          key={brand}
          href={`/${brand}`}
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#0f1f3a",
            textAlign: "center",
            textTransform: "uppercase",
            fontWeight: 600
          }}
        >
          {brand}
        </Link>
      ))}
    </div>
  );
}

export default function BrandsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1>Marki samochodów</h1>

      <BrandGrid brands={popularBrands} />

      {open && <BrandGrid brands={otherBrands} />}

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: "#1d4ed8",
            color: "white",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {open ? "Pokaż mniej" : "Pokaż więcej"}
        </button>
      </div>
    </div>
  );
}