'use client';

import Script from 'next/script';

// ⚠️ тимчасово жорстко вшиваємо ID
const GA_ID = 'G-1N2EPPHB54';

export default function Analytics() {
  if (!GA_ID) return null;

  if (typeof window !== 'undefined') {
    console.log('GA_ID on client:', GA_ID);
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
