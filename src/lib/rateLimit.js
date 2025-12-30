// src/lib/rateLimit.js
// ✅ Безпечна ініціалізація для Next.js / Serverless середовищ

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Ключі з ENV
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Якщо Upstash не налаштований — fallback у режим "без ліміту"
if (!redisUrl || !redisToken) {
  console.warn('[rateLimit] ⚠️ Redis not configured — rate limiting disabled.');
}

/**
 * Ініціалізація Redis (singleton)
 */
const redis =
  globalThis.__redis ??
  (redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null);

if (!globalThis.__redis) globalThis.__redis = redis;

/**
 * Ініціалізація ліміту (singleton)
 * 5 запитів / 10 хвилин
 */
const limiter =
  globalThis.__contactLimiter ??
  (redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '10 m'),
        analytics: true, // дозволяє перегляд статистики у Upstash Dashboard
        prefix: 'rl:contact', // namespace
      })
    : null);

if (!globalThis.__contactLimiter) globalThis.__contactLimiter = limiter;

/**
 * Лімітує за ключем (наприклад, IP або uid).
 * @param {string} key - Унікальний ідентифікатор клієнта (IP, userId тощо)
 * @returns {Promise<{ success: boolean, limit: number, remaining: number, reset: number }>}
 */
export async function limitByKey(key) {
  if (!limiter) {
    // Якщо Redis не налаштований — ліміти вимкнені
    return { success: true, limit: 9999, remaining: 9998, reset: Date.now() + 1000 };
  }

  try {
    const res = await limiter.limit(key);
    return res;
  } catch (err) {
    console.error('[rateLimit] Error:', err);
    // Якщо Upstash тимчасово недоступний — не блокуємо запити
    return { success: true, limit: 5, remaining: 5, reset: Date.now() + 60000 };
  }
}

export { limiter, redis };
