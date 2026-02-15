-- Add old_earn_leave_balance column to users table
-- This stores the previous Earn Leave balance that should be carried forward
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "old_earn_leave_balance" DOUBLE PRECISION DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "idx_users_old_earn_leave_balance" ON "users"("old_earn_leave_balance") WHERE "old_earn_leave_balance" > 0;

