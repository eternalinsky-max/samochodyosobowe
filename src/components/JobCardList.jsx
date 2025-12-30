// src/components/JobCardList.jsx
import JobCard from '@/components/JobCard';

export default function JobCardList({ jobs, onJobDeleted, showDelete = false, ...rest }) {
  if (!jobs || jobs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Brak ofert do wyświetlenia.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onDeleted={onJobDeleted}
          showDelete={showDelete}
          {...rest}
        />
      ))}
    </div>
  );
}
