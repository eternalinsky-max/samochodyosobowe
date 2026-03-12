import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!car) {
      return NextResponse.json(
        { error: "CAR_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error("GET /api/cars/[id] error:", error);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}