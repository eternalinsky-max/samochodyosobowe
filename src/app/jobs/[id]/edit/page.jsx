// src/app/jobs/[id]/edit/page.jsx
"use client";

import JobEditForm from "@/components/JobEditForm";
import { withAuth } from "@/lib/withAuth";

function EditJobPage({ params }) {
  const { id } = params;

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold">Edytuj ofertę</h1>
        <JobEditForm jobId={id} />
      </div>
    </section>
  );
}

export default withAuth(EditJobPage);
