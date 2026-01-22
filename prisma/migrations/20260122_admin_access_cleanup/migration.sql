-- Drop legacy admin access table (no longer used)
DROP TABLE IF EXISTS "AdminAccess";

-- Add index for admin flag lookups
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
