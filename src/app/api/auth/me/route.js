import { NextResponse } from "next/server";
import { verifyIdTokenFromRequest } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const user = await verifyIdTokenFromRequest(req);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("auth/me error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}