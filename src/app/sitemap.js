import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const baseUrl = "https://sautom.pl";

  const urls = [];

  urls.push({ url: `${baseUrl}`, lastModified: new Date() });
  urls.push({ url: `${baseUrl}/cars`, lastModified: new Date() });
  urls.push({ url: `${baseUrl}/brands`, lastModified: new Date() });

  const makes = await prisma.carMake.findMany({
    select: {
      slug: true,
      models: { select: { slug: true } },
    },
  });

  for (const make of makes) {
    urls.push({ url: `${baseUrl}/brands/make/${make.slug}`, lastModified: new Date() });
    for (const model of make.models) {
      urls.push({ url: `${baseUrl}/brands/make/${make.slug}/${model.slug}`, lastModified: new Date() });
    }
  }

  const cars = await prisma.carListing.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
  });

  for (const car of cars) {
    urls.push({ url: `${baseUrl}/cars/${car.id}`, lastModified: car.updatedAt || new Date() });
  }

  return urls;
}