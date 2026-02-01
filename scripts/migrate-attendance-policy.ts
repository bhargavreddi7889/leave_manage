import { config } from 'dotenv'
config()

import { query } from '../lib/db'

/**
 * Migration script to add attendance policy table and update attendance table
 */
async function migrateAttendancePolicy() {
  console.log('Starting attendance policy migration...')

  try {
    // 1. Add new columns to attendance table
    console.log('Adding columns to attendance table...')
    await query(`
      ALTER TABLE "attendance"
      ADD COLUMN IF NOT EXISTS "is_late_entry" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "is_early_exit" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "working_hours" DOUBLE PRECISION;
    `)
    console.log('✓ Added columns to attendance table')

    // 2. Create attendance_policies table
    console.log('Creating attendance_policies table...')
    await query(`
      CREATE TABLE IF NOT EXISTS "attendance_policies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "office_start_time" TIME NOT NULL DEFAULT '10:00:00',
        "office_end_time" TIME NOT NULL DEFAULT '17:00:00',
        "min_hours_full_day" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
        "min_hours_half_day" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
        "grace_period_minutes" INTEGER DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    console.log('✓ Created attendance_policies table')

    // 3. Insert default policy if none exists
    console.log('Inserting default policy...')
    await query(`
      INSERT INTO "attendance_policies" (office_start_time, office_end_time, min_hours_full_day, min_hours_half_day, grace_period_minutes, is_active)
      SELECT '10:00:00', '17:00:00', 7.0, 4.0, 0, true
      WHERE NOT EXISTS (SELECT 1 FROM "attendance_policies" WHERE is_active = true);
    `)
    console.log('✓ Inserted default policy')

    console.log('\n✅ Attendance policy migration completed successfully!')
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.warn(`⚠️  Warning: ${error.message}. Skipping this step.`)
    } else {
      console.error('Error during migration:', error)
      throw error
    }
  }
}

migrateAttendancePolicy()
  .then(() => {
    console.log('Migration process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })

