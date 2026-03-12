import fs from "node:fs";
import Papa from "papaparse";

const API_URL = process.env.IMPORT_API_URL || "http://localhost:3000/api/admin/import/catalog";
const API_KEY = process.env.IMPORT_API_KEY || "";

function clean(v) {
  if (v == null) return "";
  return String(v).trim();
}

function toNullInt(v) {
  const s = clean(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/import-catalog-from-csv.js catalog_trims.csv");
    process.exit(1);
  }

  const csv = fs.readFileSync(file, "utf8");
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

  if (parsed.errors?.length) {
    console.error(parsed.errors);
    process.exit(1);
  }

  const items = (parsed.data || []).map((r) => ({
    make: clean(r.make),
    model: clean(r.model),
    trim: clean(r.trim),
    yearFrom: toNullInt(r.yearFrom),
    yearTo: toNullInt(r.yearTo),
    bodyType: clean(r.bodyType) || null,
    fuelType: clean(r.fuelType) || null,
    gearbox: clean(r.gearbox) || null,
    powerHp: toNullInt(r.powerHp),
    engineCc: toNullInt(r.engineCc),
    rangeKm: toNullInt(r.rangeKm),
    basePricePln: toNullInt(r.basePricePln),
  }));

  console.log(`Rows: ${items.length}`);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify({ items }),
  });

  const json = await res.json().catch(() => ({}));
  console.log("Status:", res.status);
  console.log(json);

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
