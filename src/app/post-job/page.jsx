import React, { Suspense } from 'react';

import PostJobClient from './PostJobClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Ładowanie…</div>}>
      <PostJobClient />
    </Suspense>
  );
}
