/**
 * Migration script to add old_earn_leave_balance column to users table
 * Run with: npm run db:add-old-earn-leave-balance
 */

import { query } from '../lib/db'

async function addOldEarnLeaveBalance() {
  try {
    console.log('Adding old_earn_leave_balance column to users table...')
    
    // Add column
    await query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "old_earn_leave_balance" DOUBLE PRECISION DEFAULT 0
    `)
    console.log('✓ Added old_earn_leave_balance column')
    
    // Add index
    await query(`
      CREATE INDEX IF NOT EXISTS "idx_users_old_earn_leave_balance" 
      ON "users"("old_earn_leave_balance") 
      WHERE "old_earn_leave_balance" > 0
    `)
    console.log('✓ Added index for old_earn_leave_balance')
    
    console.log('Migration completed successfully!')
    process.exit(0)
  } catch (error: any) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
}

addOldEarnLeaveBalance()

