// src/app/my-jobs/page.jsx
import React, { Suspense } from 'react';

import MyJobsClient from './MyJobsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default function Page() {
  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 sm:px-6">
          <h1 className="mb-4 text-xl font-bold">Moje oferty</h1>
          <div className="rounded-lg border bg-white p-6 text-gray-600">Ładowanie…</div>
        </section>
      }
    >
      <MyJobsClient />
    </Suspense>
  );
}
