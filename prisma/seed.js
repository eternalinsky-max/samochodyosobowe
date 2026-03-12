import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DATA = {

  BMW: [
    "1 Series","2 Series","3 Series","4 Series","5 Series","7 Series",
    "X1","X2","X3","X4","X5","X6","X7","i3","i4","iX"
  ],

  Audi: [
    "A1","A3","A4","A5","A6","A7","A8",
    "Q2","Q3","Q5","Q7","Q8","e-tron"
  ],

  Mercedes: [
    "A-Class","B-Class","C-Class","E-Class","S-Class",
    "GLA","GLB","GLC","GLE","GLS",
    "EQB","EQE","EQS"
  ],

  Volkswagen: [
    "Polo","Golf","Passat","Arteon",
    "Tiguan","Touareg","T-Roc",
    "ID.3","ID.4","ID.5"
  ],

  Toyota: [
    "Aygo","Yaris","Corolla","Corolla Cross",
    "Camry","RAV4","Highlander","Prius","C-HR"
  ],

  Skoda: [
    "Fabia","Scala","Octavia","Superb",
    "Kamiq","Karoq","Kodiaq"
  ],

  Ford: [
    "Fiesta","Focus","Mondeo",
    "Kuga","Puma","Edge","Explorer"
  ],

  Hyundai: [
    "i10","i20","i30",
    "Elantra","Tucson","Santa Fe","Kona"
  ],

  Kia: [
    "Picanto","Rio","Ceed","Proceed",
    "Sportage","Sorento","Stonic"
  ],

  Nissan: [
    "Micra","Juke","Qashqai",
    "X-Trail","Leaf"
  ],

  Peugeot: [
    "208","308","508",
    "2008","3008","5008"
  ],

  Renault: [
    "Clio","Megane","Talisman",
    "Captur","Kadjar","Austral"
  ],

  Opel: [
    "Corsa","Astra","Insignia",
    "Mokka","Grandland"
  ],

  Volvo: [
    "S60","S90",
    "V60","V90",
    "XC40","XC60","XC90"
  ],

  Mazda: [
    "2","3","6",
    "CX-3","CX-30","CX-5","CX-60"
  ],

};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\./g, "")
    .replace(/[^\w-]+/g, "");
}

async function main() {

  for (const makeName of Object.keys(DATA)) {

    const make = await prisma.carMake.upsert({
      where: { slug: slugify(makeName) },
      update: {},
      create: {
        name: makeName,
        slug: slugify(makeName)
      }
    });

    for (const modelName of DATA[makeName]) {

      await prisma.carModel.upsert({
        where: {
          makeId_slug: {
            makeId: make.id,
            slug: slugify(modelName)
          }
        },
        update: {},
        create: {
          name: modelName,
          slug: slugify(modelName),
          makeId: make.id
        }
      });

    }

  }

  console.log("Seed completed successfully");

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());