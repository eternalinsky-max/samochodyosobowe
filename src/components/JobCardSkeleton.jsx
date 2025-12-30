export default function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-5 shadow-soft">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 h-4 w-2/3 rounded bg-gray-200" />
      <div className="mt-6 h-10 w-36 rounded bg-gray-200" />
    </div>
  );
}
