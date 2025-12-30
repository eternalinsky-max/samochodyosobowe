import './globals.css';
import NavBar from '@/components/NavBar';
import SiteFooter from '@/components/Footer';

export const metadata = {
  title: 'proponujeprace.pl',
  description: 'Portal ogłoszeń o pracy w Polsce',
};

export default function RootLayout({ children }) {
  const GA_ID = 'G-1N2EPPHB54'; // твій GA4 ID

  return (
    <html lang="pl">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg?v=4" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
        <link rel="manifest" href="/site.webmanifest?v=4" />

        {/* Google Analytics 4 – прямий скрипт */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `,
          }}
        />
      </head>

      <body className="bg-gray-50">
        <NavBar />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
