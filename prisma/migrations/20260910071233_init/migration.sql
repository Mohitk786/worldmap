-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('PRODUCT_URL', 'SOCIAL_PROFILE');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'UNDER_REVIEW', 'REMOVED');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentEventStatus" AS ENUM ('RECEIVED', 'APPLIED', 'DUPLICATE_IGNORED', 'REJECTED');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "topoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceFloor" INTEGER NOT NULL DEFAULT 5,
    "firstClaimedByNormalizedKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "platform" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "pitch" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "faviconUrl" TEXT,
    "countryId" TEXT NOT NULL,
    "currentAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "raiseCount" INTEGER NOT NULL DEFAULT 0,
    "early" BOOLEAN NOT NULL DEFAULT false,
    "firstPaidAt" TIMESTAMP(3) NOT NULL,
    "lastPaidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "resultingTotal" INTEGER NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkout" (
    "id" TEXT NOT NULL,
    "dodoSessionId" TEXT NOT NULL,
    "dodoPaymentId" TEXT,
    "visitorId" TEXT,
    "listingType" "ListingType" NOT NULL,
    "targetNormalizedKey" TEXT NOT NULL,
    "targetPlatform" TEXT,
    "targetDestinationUrl" TEXT NOT NULL,
    "targetDisplayName" TEXT NOT NULL,
    "targetPitch" TEXT,
    "targetDescription" TEXT,
    "targetImageUrl" TEXT,
    "targetFaviconUrl" TEXT,
    "targetCountryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'INITIATED',
    "tosAgreedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'dodo',
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "status" "PaymentEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "visitorId" TEXT,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "referrer" TEXT,
    "isCounted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "countryCode" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationFlag" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reporterEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ModerationFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_topoId_key" ON "Country"("topoId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

-- CreateIndex
CREATE INDEX "Country_slug_idx" ON "Country"("slug");

-- CreateIndex
CREATE INDEX "Listing_countryId_currentAmount_idx" ON "Listing"("countryId", "currentAmount");

-- CreateIndex
CREATE INDEX "Listing_normalizedKey_idx" ON "Listing"("normalizedKey");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_normalizedKey_countryId_key" ON "Listing"("normalizedKey", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_checkoutId_key" ON "Bid"("checkoutId");

-- CreateIndex
CREATE INDEX "Bid_listingId_createdAt_idx" ON "Bid"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Bid_createdAt_idx" ON "Bid"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_dodoSessionId_key" ON "Checkout"("dodoSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_dodoPaymentId_key" ON "Checkout"("dodoPaymentId");

-- CreateIndex
CREATE INDEX "Checkout_dodoSessionId_idx" ON "Checkout"("dodoSessionId");

-- CreateIndex
CREATE INDEX "Checkout_status_expiresAt_idx" ON "Checkout"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_eventId_key" ON "PaymentEvent"("eventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_status_idx" ON "PaymentEvent"("status");

-- CreateIndex
CREATE INDEX "Click_listingId_createdAt_idx" ON "Click"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Click_listingId_visitorId_createdAt_idx" ON "Click"("listingId", "visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "Click_ipHash_createdAt_idx" ON "Click"("ipHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_visitorId_key" ON "Visitor"("visitorId");

-- CreateIndex
CREATE INDEX "Visitor_lastSeenAt_idx" ON "Visitor"("lastSeenAt");

-- CreateIndex
CREATE INDEX "ModerationFlag_listingId_idx" ON "ModerationFlag"("listingId");

-- CreateIndex
CREATE INDEX "ModerationFlag_resolvedAt_idx" ON "ModerationFlag"("resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationFlag" ADD CONSTRAINT "ModerationFlag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
