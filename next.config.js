/** @type {import('next').NextConfig} */
const nextConfig = {
  // Більш суворий режим React у дев-режимі (не впливає на продакшен)
  reactStrictMode: true,

  // Оптимізація для деплою (Vercel/Docker)
  output: "standalone",

  // Дозволені зовнішні хости для <Image />
  images: {
    remotePatterns: [
      // 🔹 Firebase (твої файли)
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "job-board-js12.firebasestorage.app" },

      // 🔹 Для аватарів користувачів (UI Avatars / Google Photos)
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
    ],
  },

  // У проді краще не ламати білд через ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // (Опціонально) Якщо використовуєш TypeScript
  // typescript: { ignoreBuildErrors: true },

  // Мінімальні security-headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
