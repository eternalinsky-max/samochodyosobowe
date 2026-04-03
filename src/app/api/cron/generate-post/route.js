// src/app/api/cron/generate-post/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TOPICS = [
  'Najnowsze trendy w elektrycznych samochodach w Polsce 2026',
  'Jak wybrać używany samochód – na co zwrócić uwagę',
  'Najlepsze SUV-y do 100 000 zł na polskim rynku',
  'Hybrydy plug-in – czy warto kupić w 2026 roku',
  'Jak negocjować cenę samochodu u dealera',
  'Najpopularniejsze marki samochodów w Polsce',
  'Samochody elektryczne – ładowanie, zasięg i koszty eksploatacji',
  'Diesel czy benzyna – co wybrać w 2026 roku',
  'Jak sprawdzić historię używanego samochodu przed zakupem',
  'Najlepsze rodzinne auta na polskim rynku',
  'Koszty ubezpieczenia – które auta są najtańsze w OC',
  'Samochody idealne do miasta – małe i ekonomiczne',
  'Jak przygotować auto do sprzedaży i uzyskać lepszą cenę',
  'Automatyczna skrzynia biegów – wady i zalety',
  'Najbezpieczniejsze samochody według testów Euro NCAP 2026',
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req) {
  // Zabezpieczenie — tylko Vercel Cron lub secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Wybierz losowy temat którego jeszcze nie ma
    const existingSlugs = (await prisma.post.findMany({ select: { slug: true } }))
      .map((p) => p.slug);

    const available = TOPICS.filter((t) => !existingSlugs.includes(slugify(t)));
    const topic = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // Generuj artykuł przez Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Napisz artykuł na blog motoryzacyjny po polsku na temat: "${topic}".

Artykuł powinien być:
- Praktyczny i pomocny dla kupujących samochody w Polsce
- Długości ok. 400-600 słów
- Podzielony na sekcje z nagłówkami H2
- Napisany naturalnym, przyjaznym językiem
- Zawierać konkretne porady i liczby

Odpowiedz TYLKO w formacie JSON (bez markdown, bez backticks):
{
  "title": "tytuł artykułu",
  "excerpt": "krótkie streszczenie 1-2 zdania",
  "content": "pełna treść artykułu w HTML (używaj <h2>, <p>, <ul>, <li>)"
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return NextResponse.json({ error: 'Claude API error', details: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('JSON parse error:', text);
      return NextResponse.json({ error: 'JSON parse error', raw: text }, { status: 500 });
    }

    const slug = slugify(parsed.title || topic);
    const uniqueSlug = existingSlugs.includes(slug)
      ? `${slug}-${Date.now()}`
      : slug;

    const post = await prisma.post.create({
      data: {
        title: parsed.title,
        slug: uniqueSlug,
        excerpt: parsed.excerpt || '',
        content: parsed.content,
        published: true,
      },
    });

    return NextResponse.json({ ok: true, post });
  } catch (e) {
    console.error('generate-post error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
