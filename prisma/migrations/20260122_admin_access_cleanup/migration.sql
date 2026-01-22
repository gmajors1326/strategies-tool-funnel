-- Drop legacy admin access table (no longer used)
DROP TABLE IF EXISTS "AdminAccess";

-- Add index for admin flag lookups (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'isAdmin'
  ) THEN
    CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
  END IF;
END $$;
