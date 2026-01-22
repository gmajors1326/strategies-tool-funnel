-- RenameTable
ALTER TABLE "WebhookDelivery" RENAME TO "webhook_deliveries";

-- DropIndex (eventId index is redundant since @unique already creates one)
DROP INDEX IF EXISTS "WebhookDelivery_eventId_idx";

-- RenameIndex (update index names to match new table name)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_customerId_idx') THEN
    ALTER INDEX "WebhookDelivery_customerId_idx" RENAME TO "webhook_deliveries_customerId_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_status_idx') THEN
    ALTER INDEX "WebhookDelivery_status_idx" RENAME TO "webhook_deliveries_status_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_receivedAt_idx') THEN
    ALTER INDEX "WebhookDelivery_receivedAt_idx" RENAME TO "webhook_deliveries_receivedAt_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_eventId_key') THEN
    ALTER INDEX "WebhookDelivery_eventId_key" RENAME TO "webhook_deliveries_eventId_key";
  END IF;
END $$;

-- RenameConstraint
ALTER TABLE "webhook_deliveries" RENAME CONSTRAINT "WebhookDelivery_pkey" TO "webhook_deliveries_pkey";

-- CreateIndex (add type index if it doesn't exist)
CREATE INDEX IF NOT EXISTS "webhook_deliveries_type_idx" ON "webhook_deliveries"("type");
