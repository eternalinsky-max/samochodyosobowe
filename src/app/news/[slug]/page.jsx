// src/app/news/[slug]/page.jsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true },
  });
  if (!post) return {};
  return {
    title: `${post.title} – Sautom.pl`,
    description: post.excerpt || post.title,
    alternates: { canonical: `https://sautom.pl/news/${params.slug}` },
  };
}

export default async function PostPage({ params }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, published: true },
  });

  if (!post) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/news" className="text-sm text-white/50 hover:text-white mb-6 inline-block">
        ← Aktualności
      </Link>

      <div className="text-xs text-white/35 mb-3">
        {new Date(post.createdAt).toLocaleDateString('pl-PL', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}
      </div>

      <h1 className="text-3xl font-semibold text-white mb-4">{post.title}</h1>

      {post.excerpt && (
        <p className="text-white/60 text-base mb-8 border-l-2 border-sky-400/50 pl-4">
          {post.excerpt}
        </p>
      )}

      <div
        className="prose prose-invert prose-sm max-w-none
          prose-h2:text-white prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
          prose-p:text-white/70 prose-p:leading-relaxed
          prose-li:text-white/70
          prose-strong:text-white"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );
}
