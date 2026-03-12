/*
  Warnings:

  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firebaseUid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingWorkerAvg` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingWorkerBayesScore` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingWorkerCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingWorkerSum` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactMessageLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('HATCHBACK', 'SEDAN', 'WAGON', 'SUV', 'COUPE', 'CONVERTIBLE', 'VAN', 'PICKUP');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PHEV', 'ELECTRIC', 'LPG', 'CNG');

-- CreateEnum
CREATE TYPE "GearboxType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_authorId_fkey";

-- DropIndex
DROP INDEX "User_firebaseUid_key";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "displayName",
DROP COLUMN "firebaseUid",
DROP COLUMN "isAdmin",
DROP COLUMN "phone",
DROP COLUMN "photoUrl",
DROP COLUMN "ratingWorkerAvg",
DROP COLUMN "ratingWorkerBayesScore",
DROP COLUMN "ratingWorkerCount",
DROP COLUMN "ratingWorkerSum",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "ContactMessageLog";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "Review";

-- CreateTable
CREATE TABLE "CarMake" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarMake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarTrim" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "bodyType" "BodyType",
    "fuelType" "FuelType",
    "gearbox" "GearboxType",
    "powerHp" INTEGER,
    "engineCc" INTEGER,
    "rangeKm" INTEGER,
    "basePricePln" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarTrim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trimId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trimId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarMake_name_key" ON "CarMake"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CarMake_slug_key" ON "CarMake"("slug");

-- CreateIndex
CREATE INDEX "CarModel_makeId_idx" ON "CarModel"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_makeId_slug_key" ON "CarModel"("makeId", "slug");

-- CreateIndex
CREATE INDEX "CarTrim_modelId_idx" ON "CarTrim"("modelId");

-- CreateIndex
CREATE INDEX "Rating_trimId_idx" ON "Rating"("trimId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_trimId_key" ON "Rating"("userId", "trimId");

-- CreateIndex
CREATE INDEX "Comment_trimId_idx" ON "Comment"("trimId");

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "CarMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarTrim" ADD CONSTRAINT "CarTrim_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "CarTrim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "CarTrim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
