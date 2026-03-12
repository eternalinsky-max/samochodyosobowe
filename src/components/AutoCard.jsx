import Image from 'next/image';
import Link from 'next/link';

export default function AutoCard({ car }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      <Link href={`/cars/${car.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-gray-50">
          <Image
            src={car.image || '/og-image.png'}
            alt={car.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900 leading-snug">
              {car.title}
            </h3>

            {car.price ? (
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {car.price}
                </div>
                <div className="text-xs text-gray-500">brutto</div>
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {car.year ? <span className="badge">{car.year}</span> : null}
            {car.fuel ? <span className="badge">{car.fuel}</span> : null}
            {car.gearbox ? <span className="badge">{car.gearbox}</span> : null}
            {car.body ? <span className="badge">{car.body}</span> : null}
          </div>

          {car.location ? (
            <p className="mt-3 text-sm text-gray-600">{car.location}</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <span className="btn btn-primary">Zobacz</span>
            <span className="btn btn-secondary">Porównaj</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
