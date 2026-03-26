export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://samochodyosobowe.pl/sitemap.xml",
  };
}