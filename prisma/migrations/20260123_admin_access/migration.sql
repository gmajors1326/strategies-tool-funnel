-- Create AdminAccess allowlist table
CREATE TABLE IF NOT EXISTS "AdminAccess" (
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAccess_pkey" PRIMARY KEY ("email")
);
