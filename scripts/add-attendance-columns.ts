import { config } from 'dotenv'
config()

import { query } from '../lib/db'

async function addMissingColumns() {
  console.log('Adding missing columns to attendance table...')

  try {
    // Add is_late_entry
    try {
      await query(`ALTER TABLE "attendance" ADD COLUMN "is_late_entry" BOOLEAN DEFAULT false`)
      console.log('✓ Added is_late_entry column')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  is_late_entry column already exists')
      } else {
        console.error('❌ Error adding is_late_entry:', error.message)
      }
    }

    // Add is_early_exit
    try {
      await query(`ALTER TABLE "attendance" ADD COLUMN "is_early_exit" BOOLEAN DEFAULT false`)
      console.log('✓ Added is_early_exit column')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  is_early_exit column already exists')
      } else {
        console.error('❌ Error adding is_early_exit:', error.message)
      }
    }

    // Add working_hours
    try {
      await query(`ALTER TABLE "attendance" ADD COLUMN "working_hours" DOUBLE PRECISION DEFAULT NULL`)
      console.log('✓ Added working_hours column')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  working_hours column already exists')
      } else {
        console.error('❌ Error adding working_hours:', error.message)
      }
    }

    // Add marked_by
    try {
      await query(`ALTER TABLE "attendance" ADD COLUMN "marked_by" VARCHAR(50) DEFAULT 'USER'`)
      console.log('✓ Added marked_by column')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  marked_by column already exists')
      } else {
        console.error('❌ Error adding marked_by:', error.message)
      }
    }

    // Add override_reason
    try {
      await query(`ALTER TABLE "attendance" ADD COLUMN "override_reason" TEXT DEFAULT NULL`)
      console.log('✓ Added override_reason column')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  override_reason column already exists')
      } else {
        console.error('❌ Error adding override_reason:', error.message)
      }
    }

    console.log('\n✅ All columns added successfully!')
  } catch (error: any) {
    console.error('Error:', error)
    throw error
  }
}

addMissingColumns()
  .then(() => {
    console.log('Column addition complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

