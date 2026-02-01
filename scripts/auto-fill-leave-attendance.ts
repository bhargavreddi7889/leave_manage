import { config } from 'dotenv'
config()

import { query, queryMany } from '../lib/db'

/**
 * Auto-fill attendance for approved leaves
 * This should be run as a daily cron job
 */
async function autoFillLeaveAttendance() {
  try {
    console.log('Starting auto-fill attendance for approved leaves...')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all approved leave requests that include today
    const approvedLeaves = await queryMany(
      `SELECT lr.*, u.id as user_id, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'APPROVED'
       AND lr.start_date <= $1
       AND lr.end_date >= $1`,
      [today]
    )

    console.log(`Found ${approvedLeaves.length} approved leaves for today`)

    let created = 0
    let skipped = 0

    for (const leave of approvedLeaves) {
      // Check if attendance already exists for this user and date
      const existing = await query(
        `SELECT id FROM attendance WHERE user_id = $1 AND date = $2`,
        [leave.user_id, today]
      )

      if (existing.rows.length > 0) {
        // Update existing attendance to ON_LEAVE if not already set
        await query(
          `UPDATE attendance 
           SET status = 'ON_LEAVE', marked_by = 'SYSTEM', updated_at = NOW()
           WHERE user_id = $1 AND date = $2 AND status != 'ON_LEAVE'`,
          [leave.user_id, today]
        )
        skipped++
        continue
      }

      // Create new attendance record for leave
      await query(
        `INSERT INTO attendance (user_id, date, status, marked_by, remarks)
         VALUES ($1, $2, 'ON_LEAVE', 'SYSTEM', $3)
         ON CONFLICT (user_id, date) DO UPDATE 
         SET status = 'ON_LEAVE', marked_by = 'SYSTEM', updated_at = NOW()`,
        [leave.user_id, today, `Auto-filled from ${leave.leave_type_name} leave`]
      )
      created++
    }

    console.log(`✓ Created ${created} attendance records`)
    console.log(`✓ Updated ${skipped} existing records`)
    console.log('Auto-fill completed!')
  } catch (error) {
    console.error('Error auto-filling attendance:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  autoFillLeaveAttendance()
    .then(() => {
      console.log('Process complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { autoFillLeaveAttendance }

