import "./globals.css";
import NavBar from "@/components/NavBar";
import AuthSessionSync from "@/components/AuthSessionSync";
import SiteFooter from "@/components/Footer";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import Script from "next/script";



const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://samochodyosobowe.pl"),

  title: "Samochody osobowe – katalog",
  description: "Katalog nowych samochodów w Polsce",

  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png?v=2",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: "Samochody osobowe – katalog",
    description: "Katalog nowych samochodów w Polsce",
    type: "website",
    url: "https://samochodyosobowe.pl",
    siteName: "samochodyosobowe.pl",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "samochodyosobowe.pl",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Samochody osobowe – katalog",
    description: "Katalog nowych samochodów w Polsce",
    images: ["/og-image.png"],
  },
};

function MainShell({ children }) {
  const h = headers();
  const pathname = h.get("next-url") || "/";
  const isHome = pathname === "/";

  if (isHome) {
    return <main>{children}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="surface rounded-2xl p-4 sm:p-6">{children}</div>
    </main>
  );
}

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="pl" className="dark">
      <body className={`${inter.className} min-h-screen text-slate-100`}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}
        </Script>

        <AuthSessionSync />
        <NavBar />
        <MainShell>{children}</MainShell>
        <SiteFooter />
      </body>
    </html>
  );
}