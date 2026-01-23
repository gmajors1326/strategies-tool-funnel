-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSecret" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_eventId_key" ON "WebhookDelivery"("eventId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_customerId_idx" ON "WebhookDelivery"("customerId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_receivedAt_idx" ON "WebhookDelivery"("receivedAt");

-- CreateIndex
CREATE INDEX "WebhookSecret_customerId_idx" ON "WebhookSecret"("customerId");

-- CreateIndex
CREATE INDEX "WebhookSecret_active_idx" ON "WebhookSecret"("active");
