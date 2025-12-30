// src/app/api/test-admin/route.js
import { NextResponse } from 'next/server';

import { adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // якщо сюди дійшло — admin ініціалізувався
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
