// src/components/JobCard.jsx
import Link from "next/link";
import DeleteJobButton from "@/components/DeleteJobButton";
import JobRatingBadge from "@/components/JobRatingBadge";
import { formatDescription } from "@/lib/formatDescription";

export default function JobCard({ job, onDeleted, showDelete = false }) {
  const safeDescription = formatDescription(job.description);

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h2>

          {job.city && (
            <p className="text-sm text-gray-600">
              {job.city} {job.isRemote ? "· praca zdalna" : null}
            </p>
          )}
        </div>

        <JobRatingBadge job={job} />
      </header>

      {/* Опис з автолінками */}
      <div
        className="line-clamp-2 text-sm text-gray-700 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: safeDescription }}
      />

      <footer className="mt-3 flex items-center justify-between gap-3">
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Szczegóły
        </Link>

        {showDelete && (
          <DeleteJobButton id={job.id} onDeleted={onDeleted} />
        )}
      </footer>
    </article>
  );
}
