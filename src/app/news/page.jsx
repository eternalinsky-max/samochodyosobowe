// src/app/news/page.jsx
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const revalidate = 3600;

export const metadata = {
  title: 'Aktualności motoryzacyjne – Sautom.pl',
  description: 'Najnowsze artykuły i porady motoryzacyjne dla kupujących i sprzedających samochody w Polsce.',
  alternates: { canonical: 'https://sautom.pl/news' },
};

export default async function NewsPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white mb-2">Aktualności</h1>
      <p className="text-white/50 text-sm mb-10">
        Porady, analizy i nowości ze świata motoryzacji
      </p>

      {posts.length === 0 ? (
        <div className="text-white/40 text-center py-20">
          Brak artykułów. Wróć wkrótce!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-sky-400/30 hover:bg-white/[0.05] transition"
            >
              <div className="text-xs text-white/35 mb-2">
                {new Date(post.createdAt).toLocaleDateString('pl-PL', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-sky-400 transition mb-2">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm text-white/50 line-clamp-2">{post.excerpt}</p>
              )}
              <div className="mt-3 text-sky-400 text-sm">
                Czytaj więcej →
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
