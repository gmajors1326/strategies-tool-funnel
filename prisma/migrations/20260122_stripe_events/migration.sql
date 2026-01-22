-- CreateTable
CREATE TABLE IF NOT EXISTS "StripeEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StripeEvent_eventId_key" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StripeEvent_type_idx" ON "StripeEvent"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StripeEvent_createdAt_idx" ON "StripeEvent"("createdAt");
