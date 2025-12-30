#!/usr/bin/env node
// scripts/fix-salaries.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const INT_MAX = 2147483647;

async function main() {
  console.log("Connecting...");
  // 1) Покажи, чи є “здорові” рядки (для контролю)
  try {
    const count = await prisma.job.count();
    console.log("Job rows count (may fail if DB inconsistent):", count);
  } catch (e) {
    console.log(
      "Count failed (expected if there are oversized ints):",
      e?.code || e?.message,
    );
  }

  // 2) Оновлюємо “завеликі” значення без вибірки (RAW SQL, працює навіть коли findMany ламається)
  const res1 = await prisma.$executeRawUnsafe(
    `UPDATE job SET salaryMax = NULL WHERE salaryMax > ${INT_MAX}`,
  );
  const res2 = await prisma.$executeRawUnsafe(
    `UPDATE job SET salaryMin = NULL WHERE salaryMin > ${INT_MAX}`,
  );
  console.log(`Fixed salaryMax (set NULL) rows: ${res1}`);
  console.log(`Fixed salaryMin (set NULL) rows: ${res2}`);

  // 3) Перевіримо, що тепер читання працює
  const sample = await prisma.job.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log(
    "Sample after fix:",
    sample.map((j) => ({
      id: j.id,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
    })),
  );
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error("Fix script error:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
