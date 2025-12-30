// src/lib/prisma.js

// Гарантуємо, що модуль використовується лише на сервері (Next.js hint).
// eslint-disable-next-line import/no-unresolved
import 'server-only';

import { PrismaClient } from '@prisma/client';

// Кешуємо інстанс у dev, щоб не створювати нові під час HMR.
const GLOBAL_KEY = '__PRISMA__';

const cached = globalThis[GLOBAL_KEY] || { prisma: null };

const prisma =
  cached.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  cached.prisma = prisma;
  globalThis[GLOBAL_KEY] = cached;
}

export { prisma };
export default prisma;
