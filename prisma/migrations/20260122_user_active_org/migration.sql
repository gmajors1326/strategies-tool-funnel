-- Add activeOrgId to User (if missing)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeOrgId" TEXT;

-- Index for activeOrgId
CREATE INDEX IF NOT EXISTS "User_activeOrgId_idx" ON "User"("activeOrgId");

-- Foreign key constraint (optional relation)
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
