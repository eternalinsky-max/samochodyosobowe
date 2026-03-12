-- CreateTable
CREATE TABLE "CarListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarListingImage_listingId_idx" ON "CarListingImage"("listingId");

-- CreateIndex
CREATE INDEX "CarListingImage_listingId_sortOrder_idx" ON "CarListingImage"("listingId", "sortOrder");

-- AddForeignKey
ALTER TABLE "CarListingImage" ADD CONSTRAINT "CarListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
