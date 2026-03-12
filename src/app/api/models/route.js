import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const makeId = searchParams.get("makeId");

  if (!makeId) {
    return NextResponse.json({ ok: false });
  }

  const models = await prisma.carModel.findMany({
    where: { makeId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true
    }
  });

  return NextResponse.json({ ok: true, models });
}