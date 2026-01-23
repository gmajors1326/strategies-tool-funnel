-- CreateTable: KnowledgeItem
CREATE TABLE "KnowledgeItem" (
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

-- CreateTable: PromptProfile
CREATE TABLE "PromptProfile" (
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

-- CreateTable: PromptRubric
CREATE TABLE "PromptRubric" (
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

-- CreateTable: AiUsageLog
CREATE TABLE "AiUsageLog" (
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

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeItem_key_key" ON "KnowledgeItem"("key");

-- CreateIndex
CREATE INDEX "KnowledgeItem_category_idx" ON "KnowledgeItem"("category");

-- CreateIndex
CREATE INDEX "KnowledgeItem_planRequired_idx" ON "KnowledgeItem"("planRequired");

-- CreateIndex
CREATE INDEX "KnowledgeItem_style_idx" ON "KnowledgeItem"("style");

-- CreateIndex
CREATE INDEX "KnowledgeItem_priority_idx" ON "KnowledgeItem"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "PromptProfile_name_key" ON "PromptProfile"("name");

-- CreateIndex
CREATE INDEX "PromptProfile_style_idx" ON "PromptProfile"("style");

-- CreateIndex
CREATE UNIQUE INDEX "PromptRubric_toolKey_key" ON "PromptRubric"("toolKey");

-- CreateIndex
CREATE INDEX "AiUsageLog_userId_idx" ON "AiUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AiUsageLog_toolKey_idx" ON "AiUsageLog"("toolKey");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
