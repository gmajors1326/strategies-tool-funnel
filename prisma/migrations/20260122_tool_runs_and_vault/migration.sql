-- Add columns to ToolRun
ALTER TABLE "ToolRun"
ADD COLUMN "toolId" TEXT,
ADD COLUMN "toolSlug" TEXT,
ADD COLUMN "input" JSONB,
ADD COLUMN "output" JSONB;

-- Create indexes for new ToolRun columns
CREATE INDEX "ToolRun_toolSlug_idx" ON "ToolRun"("toolSlug");
CREATE INDEX "ToolRun_userId_toolSlug_createdAt_idx" ON "ToolRun"("userId", "toolSlug", "createdAt");

-- Create enum for VaultItem
CREATE TYPE "VaultItemKind" AS ENUM ('RUN_SNAPSHOT', 'TEMPLATE', 'CHECKLIST', 'NOTE');

-- Create VaultItem table
CREATE TABLE "VaultItem" (
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

-- Create VaultItem indexes
CREATE INDEX "VaultItem_userId_idx" ON "VaultItem"("userId");
CREATE INDEX "VaultItem_toolSlug_idx" ON "VaultItem"("toolSlug");
CREATE INDEX "VaultItem_userId_kind_createdAt_idx" ON "VaultItem"("userId", "kind", "createdAt");
