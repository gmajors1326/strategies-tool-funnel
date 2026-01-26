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

-- CreateTable
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

-- CreateTable
CREATE TABLE IF NOT EXISTS "ToolRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "toolKey" TEXT NOT NULL,
    "inputsJson" JSONB NOT NULL,
    "outputsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dmEngine" BOOLEAN NOT NULL DEFAULT false,
    "strategy" BOOLEAN NOT NULL DEFAULT false,
    "allAccess" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_plan_idx" ON "User"("plan");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolRun_userId_idx" ON "ToolRun"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolRun_toolKey_idx" ON "ToolRun"("toolKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolRun_createdAt_idx" ON "ToolRun"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Otp_email_idx" ON "Otp"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanEntitlement_userId_key" ON "PlanEntitlement"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanEntitlement_userId_idx" ON "PlanEntitlement"("userId");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Profile_userId_fkey') THEN
    ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ToolRun_userId_fkey') THEN
    ALTER TABLE "ToolRun" ADD CONSTRAINT "ToolRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Otp_email_fkey') THEN
    ALTER TABLE "Otp" ADD CONSTRAINT "Otp_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanEntitlement_userId_fkey') THEN
    ALTER TABLE "PlanEntitlement" ADD CONSTRAINT "PlanEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

