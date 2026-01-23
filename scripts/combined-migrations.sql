-- Fully idempotent Prisma migrations (run in Supabase SQL editor)
-- Safe to re-run: all CREATE/ALTER/INDEX/FK guarded.

-- === 20260118040000_init ===
-- CreateEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
    CREATE TYPE "Plan" AS ENUM ('FREE', 'DM_ENGINE', 'THE_STRATEGY', 'ALL_ACCESS');
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "freeVerifiedRunsRemaining" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followerRange" TEXT,
    "postingFrequency" TEXT,
    "engagementTime" TEXT,
    "primaryGoal" TEXT,
    "biggestFriction" TEXT,
    "niche" TEXT,
    "sellingType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ToolRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "toolKey" TEXT NOT NULL,
    "inputsJson" JSONB NOT NULL,
    "outputsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ToolRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlanEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dmEngine" BOOLEAN NOT NULL DEFAULT false,
    "strategy" BOOLEAN NOT NULL DEFAULT false,
    "allAccess" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_plan_idx" ON "User"("plan");
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");
CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId");
CREATE INDEX IF NOT EXISTS "ToolRun_userId_idx" ON "ToolRun"("userId");
CREATE INDEX IF NOT EXISTS "ToolRun_toolKey_idx" ON "ToolRun"("toolKey");
CREATE INDEX IF NOT EXISTS "ToolRun_createdAt_idx" ON "ToolRun"("createdAt");
CREATE INDEX IF NOT EXISTS "Otp_email_idx" ON "Otp"("email");
CREATE INDEX IF NOT EXISTS "Otp_expiresAt_idx" ON "Otp"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PlanEntitlement_userId_key" ON "PlanEntitlement"("userId");
CREATE INDEX IF NOT EXISTS "PlanEntitlement_userId_idx" ON "PlanEntitlement"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Profile_userId_fkey') THEN
    ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ToolRun_userId_fkey') THEN
    ALTER TABLE "ToolRun" ADD CONSTRAINT "ToolRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Otp_email_fkey') THEN
    ALTER TABLE "Otp" ADD CONSTRAINT "Otp_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanEntitlement_userId_fkey') THEN
    ALTER TABLE "PlanEntitlement" ADD CONSTRAINT "PlanEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- === 20260119000000_knowledge_vault ===
CREATE TABLE IF NOT EXISTS "KnowledgeItem" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "planRequired" TEXT NOT NULL DEFAULT 'free',
    "style" TEXT NOT NULL DEFAULT 'both',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromptProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "dos" TEXT NOT NULL,
    "donts" TEXT NOT NULL,
    "bannedPhrases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toneNotes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromptProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromptRubric" (
    "id" TEXT NOT NULL,
    "toolKey" TEXT NOT NULL,
    "inputHints" TEXT NOT NULL,
    "outputSchemaJson" JSONB NOT NULL,
    "reasoningRules" TEXT NOT NULL,
    "safetyRules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromptRubric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "toolKey" TEXT NOT NULL,
    "style" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costEstimate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeItem_key_key" ON "KnowledgeItem"("key");
CREATE INDEX IF NOT EXISTS "KnowledgeItem_category_idx" ON "KnowledgeItem"("category");
CREATE INDEX IF NOT EXISTS "KnowledgeItem_planRequired_idx" ON "KnowledgeItem"("planRequired");
CREATE INDEX IF NOT EXISTS "KnowledgeItem_style_idx" ON "KnowledgeItem"("style");
CREATE INDEX IF NOT EXISTS "KnowledgeItem_priority_idx" ON "KnowledgeItem"("priority");
CREATE UNIQUE INDEX IF NOT EXISTS "PromptProfile_name_key" ON "PromptProfile"("name");
CREATE INDEX IF NOT EXISTS "PromptProfile_style_idx" ON "PromptProfile"("style");
CREATE UNIQUE INDEX IF NOT EXISTS "PromptRubric_toolKey_key" ON "PromptRubric"("toolKey");
CREATE INDEX IF NOT EXISTS "AiUsageLog_userId_idx" ON "AiUsageLog"("userId");
CREATE INDEX IF NOT EXISTS "AiUsageLog_toolKey_idx" ON "AiUsageLog"("toolKey");
CREATE INDEX IF NOT EXISTS "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiUsageLog_userId_fkey') THEN
    ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- === 20260121_support_tickets ===
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "authorId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportMessage_authorRole_idx" ON "SupportMessage"("authorRole");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_userId_fkey') THEN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportMessage_ticketId_fkey') THEN
    ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- === 20260122_tool_runs_and_vault ===
ALTER TABLE "ToolRun"
ADD COLUMN IF NOT EXISTS "toolId" TEXT,
ADD COLUMN IF NOT EXISTS "toolSlug" TEXT,
ADD COLUMN IF NOT EXISTS "input" JSONB,
ADD COLUMN IF NOT EXISTS "output" JSONB;

CREATE INDEX IF NOT EXISTS "ToolRun_toolSlug_idx" ON "ToolRun"("toolSlug");
CREATE INDEX IF NOT EXISTS "ToolRun_userId_toolSlug_createdAt_idx" ON "ToolRun"("userId", "toolSlug", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VaultItemKind') THEN
    CREATE TYPE "VaultItemKind" AS ENUM ('RUN_SNAPSHOT', 'TEMPLATE', 'CHECKLIST', 'NOTE');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "VaultItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolSlug" TEXT,
    "kind" "VaultItemKind" NOT NULL DEFAULT 'RUN_SNAPSHOT',
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VaultItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VaultItem_userId_idx" ON "VaultItem"("userId");
CREATE INDEX IF NOT EXISTS "VaultItem_toolSlug_idx" ON "VaultItem"("toolSlug");
CREATE INDEX IF NOT EXISTS "VaultItem_userId_kind_createdAt_idx" ON "VaultItem"("userId", "kind", "createdAt");

-- === 20260122_stripe_events ===
CREATE TABLE IF NOT EXISTS "StripeEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StripeEvent_eventId_key" ON "StripeEvent"("eventId");
CREATE INDEX IF NOT EXISTS "StripeEvent_type_idx" ON "StripeEvent"("type");
CREATE INDEX IF NOT EXISTS "StripeEvent_createdAt_idx" ON "StripeEvent"("createdAt");

-- === 20260122_user_active_org ===
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeOrgId" TEXT;
CREATE INDEX IF NOT EXISTS "User_activeOrgId_idx" ON "User"("activeOrgId");

DO $$
DECLARE
  user_type TEXT;
  org_type TEXT;
BEGIN
  IF to_regclass('public."Organization"') IS NOT NULL THEN
    SELECT data_type INTO user_type
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'activeOrgId';

    SELECT data_type INTO org_type
    FROM information_schema.columns
    WHERE table_name = 'Organization' AND column_name = 'id';

    IF user_type IS NOT NULL AND org_type IS NOT NULL AND user_type = org_type THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'User_activeOrgId_fkey'
      ) THEN
        ALTER TABLE "User"
        ADD CONSTRAINT "User_activeOrgId_fkey"
        FOREIGN KEY ("activeOrgId") REFERENCES "Organization"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- === 20260122_admin_access_cleanup ===
DROP TABLE IF EXISTS "AdminAccess";
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'isAdmin'
  ) THEN
    CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
  END IF;
END $$;

-- === 20260122_admin_audit_log ===
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorEmail_idx" ON "AdminAuditLog"("actorEmail");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- === 20260122_add_webhook_delivery ===
CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
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

CREATE TABLE IF NOT EXISTS "WebhookSecret" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "WebhookSecret_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookDelivery_eventId_key" ON "WebhookDelivery"("eventId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_customerId_idx" ON "WebhookDelivery"("customerId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_receivedAt_idx" ON "WebhookDelivery"("receivedAt");
CREATE INDEX IF NOT EXISTS "WebhookSecret_customerId_idx" ON "WebhookSecret"("customerId");
CREATE INDEX IF NOT EXISTS "WebhookSecret_active_idx" ON "WebhookSecret"("active");

-- === 20260122_create_webhook_deliveries ===
DO $$
BEGIN
  IF to_regclass('public."WebhookDelivery"') IS NOT NULL AND to_regclass('public."webhook_deliveries"') IS NULL THEN
    ALTER TABLE "WebhookDelivery" RENAME TO "webhook_deliveries";
  END IF;
END $$;

DROP INDEX IF EXISTS "WebhookDelivery_eventId_idx";

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

DO $$
BEGIN
  IF to_regclass('public."webhook_deliveries"') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebhookDelivery_pkey') THEN
      ALTER TABLE "webhook_deliveries" RENAME CONSTRAINT "WebhookDelivery_pkey" TO "webhook_deliveries_pkey";
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "webhook_deliveries_type_idx" ON "webhook_deliveries"("type");

-- === 20260123_user_is_admin ===
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- === 20260123_admin_access ===
CREATE TABLE IF NOT EXISTS "AdminAccess" (
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAccess_pkey" PRIMARY KEY ("email")
);
