-- AlterTable
ALTER TABLE "CarListing" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ListingRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerRating" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingRating_listingId_idx" ON "ListingRating"("listingId");

-- CreateIndex
CREATE INDEX "ListingRating_userId_idx" ON "ListingRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingRating_userId_listingId_key" ON "ListingRating"("userId", "listingId");

-- CreateIndex
CREATE INDEX "SellerRating_toUserId_idx" ON "SellerRating"("toUserId");

-- CreateIndex
CREATE INDEX "SellerRating_fromUserId_idx" ON "SellerRating"("fromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerRating_fromUserId_toUserId_key" ON "SellerRating"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "ListingRating" ADD CONSTRAINT "ListingRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRating" ADD CONSTRAINT "ListingRating_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
