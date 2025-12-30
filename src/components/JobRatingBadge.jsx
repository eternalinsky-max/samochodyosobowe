'use client';

import RatingBadge from '@/components/RatingBadge';

/**
 * Бейдж рейтингу вакансії (оголошення про роботу).
 * Показує лише середнє арифметичне (avg) та кількість відгуків (count).
 */
export default function JobRatingBadge({ avg = 0, count = 0, className = '' }) {
  return <RatingBadge avg={Number(avg)} count={Number(count)} className={className} />;
}
