// src/app/api/cron/generate-post/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TOPICS = [
  'Toyota Yaris 2026 – test i opinia: czy warto kupić?',
  'Volkswagen Golf 2026 – król segmentu C wciąż na tronie?',
  'Skoda Octavia 2026 – najlepsze auto za rozsądne pieniądze?',
  'BMW 3 2026 – test i opinia: sportowa limuzyna dla każdego?',
  'Audi A4 2026 – elegancja i technologia w jednym',
  'Mercedes C-Class 2026 – luksus dostępny dla klasy średniej?',
  'Ford Kuga 2026 – test i opinia: SUV dla rodziny',
  'Hyundai Tucson 2026 – koreański SUV kontra europejska konkurencja',
  'Kia Sportage 2026 – test i opinia: hit sprzedaży w Polsce',
  'Toyota RAV4 2026 – najlepszy SUV hybrydowy na rynku?',
  'Dacia Duster 2026 – test i opinia: najtańszy SUV w Polsce',
  'Skoda Karoq 2026 – kompaktowy SUV z duszą Octavii',
  'Volkswagen Tiguan 2026 – premium SUV w rozsądnej cenie?',
  'Peugeot 3008 2026 – test i opinia: francuski styl i technologia',
  'Renault Captur 2026 – test i opinia: miejski SUV dla każdego',
  'Opel Mokka 2026 – test i opinia: nowe życie starej marki',
  'Fiat 500e 2026 – elektryczny klasyk w nowym wydaniu',
  'Tesla Model 3 2026 – test i opinia: rewolucja czy ewolucja?',
  'Tesla Model Y 2026 – najpopularniejszy elektryk na świecie',
  'BMW iX 2026 – luksusowy elektryk z Bawarii',
  'Audi Q5 2026 – test i opinia: premium SUV dla wymagających',
  'Mercedes GLC 2026 – test i opinia: SUV klasy premium',
  'Volvo XC60 2026 – bezpieczeństwo i styl w jednym',
  'Volvo XC40 2026 – kompaktowy SUV ze skandynawską duszą',
  'Toyota Corolla 2026 – test i opinia: niezawodność ponad wszystko',
  'Honda CR-V 2026 – test i opinia: japoński SUV z charakterem',
  'Mazda CX-5 2026 – test i opinia: premium bez premium ceny',
  'Mazda3 2026 – test i opinia: najpiękniejszy kompakt na rynku?',
  'Nissan Qashqai 2026 – twórca segmentu crossover nadal w formie?',
  'Hyundai i30 2026 – test i opinia: koreański kompakt kontra Golf',
  'Kia Ceed 2026 – test i opinia: solidny kompakt z gwarancją 7 lat',
  'Seat Leon 2026 – test i opinia: sportowy kompakt w dobrej cenie',
  'Skoda Fabia 2026 – test i opinia: najlepsze małe auto?',
  'Volkswagen Polo 2026 – test i opinia: mały samochód z dużymi ambicjami',
  'Opel Corsa 2026 – test i opinia: miejski samochód dla każdego',
  'Peugeot 208 2026 – test i opinia: stylowy Francuz w mieście',
  'Renault Clio 2026 – test i opinia: legenda francuskiej motoryzacji',
  'Ford Focus 2026 – test i opinia: czy wciąż warto go kupić?',
  'Toyota Prius PHEV 2026 – hybryda plug-in dla oszczędnych',
  'Mitsubishi ASX 2026 – test i opinia: japoński SUV z francuską duszą',
  'BMW X3 2026 – test i opinia: SUV dla wymagających kierowców',
  'BMW X5 2026 – test i opinia: luksus i przestrzeń w jednym',
  'Audi Q3 2026 – test i opinia: kompaktowe premium dla każdego',
  'Audi Q7 2026 – test i opinia: duży SUV dla dużej rodziny',
  'Mercedes GLE 2026 – test i opinia: flagowy SUV Mercedesa',
  'Mercedes A-Class 2026 – test i opinia: kompakt premium od Mercedesa',
  'Land Rover Defender 2026 – test i opinia: legenda off-road w nowym wydaniu',
  'Jeep Wrangler 2026 – test i opinia: król bezdroży',
  'Jeep Compass 2026 – test i opinia: miejski Jeep dla każdego',
  'Subaru Forester 2026 – test i opinia: niezawodny SUV z napędem 4x4',
  'Toyota Land Cruiser 2026 – test i opinia: legenda terenówek',
  'Ford Mustang 2026 – test i opinia: ikona motoryzacji po liftingu',
  'BMW M3 2026 – test i opinia: sportowa limuzyna dla entuzjastów',
  'Audi RS4 2026 – test i opinia: kombi dla kierowcy sportowego',
  'Mercedes AMG C63 2026 – test i opinia: bestia w garniturze',
  'Volkswagen Passat 2026 – test i opinia: klasyk dla biznesu',
  'Skoda Superb 2026 – test i opinia: najlepsza przestrzeń za pieniądze',
  'Volvo S60 2026 – test i opinia: sportowa limuzyna ze Szwecji',
  'Polestar 2 2026 – test i opinia: elektryczny rywal Tesli',
  'BYD Atto 3 2026 – test i opinia: chiński elektryk podbija Europę',
  'BYD Seal 2026 – test i opinia: elektryczna limuzyna z Chin',
  'Hyundai Ioniq 5 2026 – test i opinia: elektryk z przyszłości',
  'Hyundai Ioniq 6 2026 – test i opinia: elektryczna limuzyna Hyundaia',
  'Kia EV6 2026 – test i opinia: elektryk dla kierowcy sportowego',
  'Volkswagen ID.4 2026 – test i opinia: elektryczny Golf w rozmiarze SUV',
  'Volkswagen ID.3 2026 – test i opinia: elektryczna rewolucja Volkswagena',
  'Audi e-tron 2026 – test i opinia: elektryczne Audi dla wymagających',
  'BMW i4 2026 – test i opinia: elektryczna seria 4 bez kompromisów',
  'Mini Countryman 2026 – test i opinia: duży Mini dla rodziny',
  'Mini Electric 2026 – test i opinia: elektryczny miejski klasyk',
  'Porsche Cayenne 2026 – test i opinia: sportowy SUV dla pasjonatów',
  'Porsche Taycan 2026 – test i opinia: elektryczne Porsche na torze i w mieście',
  'Cupra Formentor 2026 – test i opinia: sportowy SUV z Barcelony',
  'Cupra Born 2026 – test i opinia: elektryczny sportowiec dla każdego',
  'Alfa Romeo Stelvio 2026 – test i opinia: włoski SUV z duszą',
  'Alfa Romeo Giulia 2026 – test i opinia: najpiękniejsza limuzyna segmentu D?',
  'Fiat Panda 2026 – test i opinia: miejski klasyk wiecznie żywy',
  'Dacia Sandero 2026 – test i opinia: najtańsze auto w Polsce',
  'Dacia Jogger 2026 – test i opinia: tanie rodzinne auto z LPG',
  'Renault Austral 2026 – test i opinia: nowy SUV Renault kontra konkurencja',
  'Peugeot 5008 2026 – test i opinia: 7-osobowy SUV dla rodziny',
  'Citroen C5 2026 – test i opinia: komfortowy Francuz na długie trasy',
  'Opel Grandland 2026 – test i opinia: przestronny SUV z plug-in hybrid',
  'Ford Explorer 2026 – test i opinia: elektryczny SUV z Ameryki',
  'Nissan Ariya 2026 – test i opinia: elektryczny crossover przyszłości',
  'Mazda CX-60 2026 – test i opinia: luksusowe Mazda SUV plug-in',
  'Lexus NX 2026 – test i opinia: japońskie premium w rozsądnej cenie',
  'Lexus RX 2026 – test i opinia: luksusowy SUV dla wymagających',
  'Jaguar F-Pace 2026 – test i opinia: sportowy SUV z brytyjską elegancją',
  'Land Rover Discovery 2026 – test i opinia: rodzinny off-road premium',
  'Volvo XC90 2026 – test i opinia: flagowy SUV Volvo dla rodziny',
  'Skoda Enyaq 2026 – test i opinia: elektryczna Skoda dla każdego',
  'Volkswagen Touareg 2026 – test i opinia: flagowy SUV Volkswagena',
  'Toyota bZ4X 2026 – test i opinia: elektryczna Toyota na nowej platformie',
  'Honda e:Ny1 2026 – test i opinia: elektryczna Honda dla Europy',
  'Smart #1 2026 – test i opinia: elektryczny Smart w nowym wydaniu',
  'Suzuki Vitara 2026 – test i opinia: tani SUV z mild hybrid',
  'Mitsubishi Eclipse Cross PHEV 2026 – test i opinia: plug-in hybrid w SUV',
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
