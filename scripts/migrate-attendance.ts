import { config } from 'dotenv'
config()

import { query } from '../lib/db'

/**
 * Migration script to add attendance enhancements:
 * - marked_by column to attendance table
 * - attendance_audit_log table for Admin edits
 */
async function migrateAttendance() {
  console.log('Starting attendance migration...')

  try {
    // 1. Add marked_by column to attendance table
    console.log('Adding marked_by column to attendance table...')
    await query(`
      ALTER TABLE "attendance"
      ADD COLUMN IF NOT EXISTS "marked_by" VARCHAR(50) DEFAULT 'USER';
    `)
    console.log('✓ Added marked_by column')

    // 2. Create attendance_audit_log table
    console.log('Creating attendance_audit_log table...')
    await query(`
      CREATE TABLE IF NOT EXISTS "attendance_audit_log" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "attendance_id" UUID NOT NULL REFERENCES "attendance"("id") ON DELETE CASCADE,
        "modified_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "old_status" VARCHAR(50),
        "new_status" VARCHAR(50),
        "reason" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    console.log('✓ Created attendance_audit_log table')

    // 3. Create indexes
    console.log('Creating indexes...')
    await query(`
      CREATE INDEX IF NOT EXISTS "idx_attendance_audit_attendance_id" ON "attendance_audit_log"("attendance_id");
      CREATE INDEX IF NOT EXISTS "idx_attendance_audit_modified_by" ON "attendance_audit_log"("modified_by");
    `)
    console.log('✓ Created indexes')

    console.log('\n✅ Attendance migration completed successfully!')
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.warn(`⚠️  Warning: ${error.message}. Skipping this step.`)
    } else {
      console.error('Error during migration:', error)
      throw error
    }
  }
}

migrateAttendance()
  .then(() => {
    console.log('Migration process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })

