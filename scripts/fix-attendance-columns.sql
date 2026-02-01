-- Migration script to add missing attendance columns
-- Run this if you're getting column errors during check-in

-- Add is_late_entry column if it doesn't exist
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "is_late_entry" BOOLEAN DEFAULT false;

-- Add is_early_exit column if it doesn't exist
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "is_early_exit" BOOLEAN DEFAULT false;

-- Add working_hours column if it doesn't exist
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "working_hours" DOUBLE PRECISION DEFAULT NULL;

-- Add marked_by column if it doesn't exist
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "marked_by" VARCHAR(50) DEFAULT 'USER';

-- Add override_reason column if it doesn't exist (for admin edits)
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "override_reason" TEXT DEFAULT NULL;

-- Update existing records to have default values
UPDATE "attendance" 
SET is_late_entry = COALESCE(is_late_entry, false),
    is_early_exit = COALESCE(is_early_exit, false),
    marked_by = COALESCE(marked_by, 'USER')
WHERE is_late_entry IS NULL OR is_early_exit IS NULL OR marked_by IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN "attendance"."is_late_entry" IS 'Whether the employee checked in after office start time';
COMMENT ON COLUMN "attendance"."is_early_exit" IS 'Whether the employee checked out before office end time';
COMMENT ON COLUMN "attendance"."working_hours" IS 'Total working hours calculated from check-in to check-out';
COMMENT ON COLUMN "attendance"."marked_by" IS 'Who marked the attendance: USER, SYSTEM, ADMIN, HOD';
COMMENT ON COLUMN "attendance"."override_reason" IS 'Reason for admin/HOD override or correction';

