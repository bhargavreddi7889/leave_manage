-- Update attendance table to ensure VARCHAR(50) allows MISSED_CHECKOUT status
-- No schema change needed as status is already VARCHAR(50)
-- Just documenting valid statuses:
-- - PRESENT: User checked in and out properly
-- - ABSENT: User did not check in or marked absent by admin
-- - HALF_DAY: Working hours less than min_hours_half_day
-- - ON_LEAVE: User is on approved leave
-- - MISSED_CHECKOUT: User checked in but forgot to check out (marked at end of day)

-- The status column already supports this, no migration needed
-- But we can add a comment for documentation
COMMENT ON COLUMN attendance.status IS 'Valid values: PRESENT, ABSENT, HALF_DAY, ON_LEAVE, MISSED_CHECKOUT';

