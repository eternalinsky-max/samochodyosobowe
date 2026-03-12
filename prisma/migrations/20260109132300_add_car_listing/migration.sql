/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[firebaseUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firebaseUid` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "firebaseUid" TEXT NOT NULL,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "CarListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "mileageKm" INTEGER,
    "pricePln" INTEGER,
    "fuelType" "FuelType",
    "gearbox" "GearboxType",
    "bodyType" "BodyType",
    "city" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarListing_make_idx" ON "CarListing"("make");

-- CreateIndex
CREATE INDEX "CarListing_model_idx" ON "CarListing"("model");

-- CreateIndex
CREATE INDEX "CarListing_isActive_idx" ON "CarListing"("isActive");

-- CreateIndex
CREATE INDEX "CarListing_pricePln_idx" ON "CarListing"("pricePln");

-- CreateIndex
CREATE INDEX "CarListing_year_idx" ON "CarListing"("year");

-- CreateIndex
CREATE INDEX "CarListing_userId_idx" ON "CarListing"("userId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- AddForeignKey
ALTER TABLE "CarListing" ADD CONSTRAINT "CarListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
