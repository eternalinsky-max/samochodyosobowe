import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const makes = await prisma.carMake.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  return NextResponse.json({ ok: true, makes });
}

