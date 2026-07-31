// src/app/api/cron/generate-post/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TOPICS = [
  'Najczęstsze awarie silnika benzynowego — przyczyny, objawy i koszty naprawy',
  'Dlaczego silnik bierze olej — przyczyny i jak to naprawić',
  'Wypadanie zapłonu — objawy, przyczyny i sposoby naprawy',
  'Kontrolka check engine — co oznacza i jak zdiagnozować usterkę',
  'Przegrzewanie się silnika — przyczyny i co robić gdy temperatura rośnie',
  'Niskie ciśnienie oleju — przyczyny i jak uniknąć zatarcia silnika',
  'Pęknięty pasek rozrządu — objawy, konsekwencje i koszty wymiany',
  'Przeskoczony łańcuch rozrządu — objawy i ile kosztuje naprawa',
  'Wyciek płynu chłodniczego — jak znaleźć wyciek i go usunąć',
  'Uszkodzona uszczelka pod głowicą — objawy i koszty naprawy',
  'Najczęstsze awarie turbiny — jak rozpoznać i ile kosztuje regeneracja',
  'Zatkany filtr DPF — objawy, jak wypalić i jak wyczyścić',
  'Problemy z filtrem DPF w mieście — jak jeździć żeby nie zapchać',
  'Zatkany katalizator — objawy i czy warto wycinać',
  'Awaria zaworu EGR — objawy, czyszczenie i zaślepianie',
  'Wtryskiwacze Common Rail — objawy awarii i regeneracja',
  'Czarny dym z rury wydechowej diesel — przyczyny i naprawa',
  'Biały dym z wydechu — co oznacza i kiedy to uszczelka',
  'Niebieski dym z wydechu — dlaczego kopci na niebiesko',
  'Falujące obroty na biegu jałowym — przyczyny i rozwiązania',
  'Samochód gaśnie na wolnych obrotach — co sprawdzić',
  'Trudne odpalanie rano — przyczyny problemów z rozruchem',
  'Samochód nie odpala — rozrusznik kręci ale nie zapala',
  'Najczęstsze awarie akumulatora — dlaczego pada i jak go sprawdzić',
  'Alternator nie ładuje — objawy uszkodzonego alternatora',
  'Rozrusznik nie kręci — przyczyny i co robić',
  'Awarie świec zapłonowych — kiedy wymieniać i objawy zużycia',
  'Awarie świec żarowych w dieslu — objawy i wymiana',
  'Cewka zapłonowa — objawy uszkodzenia i koszty',
  'Awaria pompy paliwa — objawy i ile kosztuje wymiana',
  'Zatkany filtr paliwa — objawy i jak często wymieniać',
  'Najczęstsze awarie skrzyni biegów manualnej — objawy i naprawa',
  'Szarpanie automatycznej skrzyni biegów — przyczyny i co robić',
  'Awaria sprzęgła — jak poznać że sprzęgło się kończy',
  'Ślizgające się sprzęgło — przyczyny i koszty wymiany',
  'Dwumasa — objawy zużycia koła dwumasowego i koszty',
  'Wycie skrzyni biegów — co oznacza i jak naprawić',
  'Problem z wrzucaniem biegów — linki, synchronizatory i olej',
  'Awaria hamulców — dlaczego hamulce piszczą i drgają',
  'Klocki hamulcowe — kiedy wymieniać i jakie wybrać',
  'Tarcze hamulcowe biją — przyczyny bicia i co robić',
  'Miękki pedał hamulca — zapowietrzone hamulce i jak odpowietrzyć',
  'Wyciek płynu hamulcowego — jak znaleźć i naprawić',
  'Kontrolka ABS się świeci — przyczyny awarii ABS',
  'Kontrolka ESP się świeci — co oznacza i jak naprawić',
  'Awaria pompy ABS — objawy i koszty naprawy',
  'Najczęstsze awarie zawieszenia — stuki i pukanie',
  'Stukanie z przodu auta — sworznie, łączniki i tuleje',
  'Wybite tuleje wahacza — objawy i koszty wymiany',
  'Łącznik stabilizatora stuka — ile kosztuje i jak wymienić',
  'Amortyzatory — kiedy wymieniać i objawy zużycia',
  'Sprężyny zawieszenia pękają — dlaczego i co robić',
  'Łożysko koła huczy — jak rozpoznać które i koszty',
  'Geometria kół — kiedy robić i objawy złej zbieżności',
  'Ściąga samochód na bok — przyczyny i diagnostyka',
  'Drgania kierownicy przy hamowaniu i przy prędkości — przyczyny',
  'Luz na kierownicy — przyczyny i diagnostyka układu kierowniczego',
  'Wyciek z maglownicy — objawy i czy regenerować czy wymienić',
  'Wspomaganie kierownicy nie działa — pompa czy elektryka',
  'Najczęstsze awarie klimatyzacji — nie chłodzi i jak nabić',
  'Klimatyzacja nie chłodzi — przyczyny i ile kosztuje nabicie',
  'Sprężarka klimatyzacji nie załącza się — przyczyny',
  'Parują szyby w aucie — przyczyny i jak temu zaradzić',
  'Wyciek wody do wnętrza auta — zapchane odpływy i uszczelki',
  'Centralny zamek nie działa — przyczyny i naprawa',
  'Elektryczne szyby nie działają — silniczek czy moduł',
  'Awaria alternatora i paska osprzętu — piszczenie i ładowanie',
  'Pasek klinowy piszczy — przyczyny i naciąg',
  'Kontrolka oleju się świeci — co robić i czy można jechać',
  'Kontrolka ciśnienia w oponach TPMS — jak zresetować',
  'Czujniki parkowania nie działają — jak sprawdzić który padł',
  'Kamera cofania nie działa — przyczyny i naprawa',
  'Awaria AdBlue w dieslu — jak usunąć błąd AdBlue',
  'Problemy z systemem Start-Stop — dlaczego nie działa',
  'Wypalanie DPF w trasie — jak prawidłowo wypalać',
  'Błędy sondy lambda — objawy i czy można jeździć',
  'Awaria przepływomierza — objawy i jak wyczyścić',
  'Zatkany filtr powietrza — objawy i wpływ na spalanie',
  'Wysokie spalanie paliwa — przyczyny i jak obniżyć',
  'Samochód szarpie podczas jazdy — cewki, świece czy paliwo',
  'Samochód traci moc i nie przyspiesza — tryb awaryjny i przyczyny',
  'Tryb awaryjny silnika — co oznacza i jak wyjść z trybu awaryjnego',
  'Wibracje silnika na wolnych obrotach — poduszki silnika',
  'Stuki w silniku na zimnym — panewki, popychacze i łańcuch',
  'Korozja podwozia i progów — jak zabezpieczyć i naprawić',
  'Rdzewieją hamulce po postoju — czy to normalne',
  'Zapach spalenizny w aucie — co może się palić',
  'Zapach paliwa w aucie — gdzie szukać wycieku',
  'Zapach stęchlizny z klimatyzacji — odgrzybianie i wymiana filtra kabinowego',
  'Wymiana rozrządu — kiedy wymieniać i co ile km',
  'Wymiana oleju — co ile wymieniać i jaki olej wybrać',
  'Płukanka silnika — czy warto robić i kiedy',
  'Najczęstsze awarie aut hybrydowych — bateria i hamulce',
  'Awarie aut elektrycznych — co psuje się w elektryku',
  'Diagnostyka komputerowa auta — ile kosztuje i co wykrywa',
  'Jak sprawdzić używane auto przed kupnem — lista kontrolna usterek',
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
