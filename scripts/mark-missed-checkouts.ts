import { config } from 'dotenv'
config()

import { query, queryMany } from '../lib/db'

/**
 * End-of-day script to mark MISSED_CHECKOUT for users who checked in but didn't check out
 * This should be run at end of day (e.g., midnight or 1 AM)
 */
async function markMissedCheckouts() {
  console.log('Starting missed checkout marking process...')

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all attendance records with check-in but no check-out for today
    const missedCheckouts = await queryMany(
      `SELECT a.*, u.first_name, u.last_name, u.employee_id
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.date = $1
       AND a.check_in IS NOT NULL
       AND a.check_out IS NULL
       AND a.status != 'ON_LEAVE'
       AND a.marked_by = 'USER'`,
      [today]
    )

    if (missedCheckouts.length === 0) {
      console.log('No missed checkouts found for today.')
      return
    }

    console.log(`Found ${missedCheckouts.length} missed checkouts:`)

    for (const record of missedCheckouts) {
      // Update status to MISSED_CHECKOUT
      await query(
        `UPDATE attendance
         SET status = 'MISSED_CHECKOUT',
             working_hours = 0,
             remarks = COALESCE(remarks, '') || 'Missed checkout - marked by system at end of day. Requires admin review.',
             updated_at = NOW()
         WHERE id = $1`,
        [record.id]
      )

      console.log(`  ✓ Marked ${record.first_name} ${record.last_name} (${record.employee_id}) - Check-in: ${new Date(record.check_in).toLocaleTimeString()}`)
    }

    console.log(`\n✅ Successfully marked ${missedCheckouts.length} missed checkouts`)
  } catch (error: any) {
    console.error('Error marking missed checkouts:', error)
    throw error
  }
}

markMissedCheckouts()
  .then(() => {
    console.log('Missed checkout marking process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Missed checkout marking process failed:', error)
    process.exit(1)
  })

