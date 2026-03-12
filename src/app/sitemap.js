import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap() {

  const baseUrl = "https://samochodyosobowe.pl";

  const urls = [];

  // головна сторінка
  urls.push({
    url: `${baseUrl}`,
    lastModified: new Date(),
  });

  // список авто
  urls.push({
    url: `${baseUrl}/cars`,
    lastModified: new Date(),
  });

  // сторінка брендів
  urls.push({
    url: `${baseUrl}/brands`,
    lastModified: new Date(),
  });

  // всі марки
  const makes = await prisma.carMake.findMany({
    include: {
      models: true
    }
  });

  for (const make of makes) {

    urls.push({
      url: `${baseUrl}/brands/${make.slug}`,
      lastModified: new Date(),
    });

    for (const model of make.models) {

      urls.push({
        url: `${baseUrl}/brands/${make.slug}/${model.slug}`,
        lastModified: new Date(),
      });

    }

  }

  // всі оголошення авто
  const cars = await prisma.carListing.findMany({
    select: { id: true }
  });

  for (const car of cars) {
    urls.push({
      url: `${baseUrl}/cars/${car.id}`,
      lastModified: new Date(),
    });
  }

  return urls;
}