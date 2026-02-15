import { queryOne, queryMany, query } from './db'
import { calculateDays } from './utils'

export async function updateLeaveBalance(
  userId: string,
  leaveTypeId: string,
  days: number,
  year: number
) {
  const balance = await queryOne(
    `SELECT * FROM leave_balances 
     WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
    [userId, leaveTypeId, year]
  )

  if (balance) {
    const result = await query(
      `UPDATE leave_balances 
       SET balance = balance - $1, updated_at = NOW()
       WHERE user_id = $2 AND leave_type_id = $3 AND year = $4
       RETURNING *`,
      [days, userId, leaveTypeId, year]
    )
    return result.rows[0]
  }

  // Get max days for this leave type
  const leaveType = await queryOne(
    `SELECT * FROM leave_types WHERE id = $1`,
    [leaveTypeId]
  )

  if (!leaveType) {
    throw new Error('Leave type not found')
  }

  const result = await query(
    `INSERT INTO leave_balances (user_id, leave_type_id, balance, year)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, leaveTypeId, (leaveType.max_days || leaveType.maxDays) - days, year]
  )
  return result.rows[0]
}

export async function getLeaveBalance(userId: string, year: number = new Date().getFullYear()) {
  const balances = await queryMany(
    `SELECT lb.*, lt.*, lt.id as leave_type_id, lt.name as leave_type_name
     FROM leave_balances lb
     JOIN leave_types lt ON lb.leave_type_id = lt.id
     WHERE lb.user_id = $1 AND lb.year = $2`,
    [userId, year]
  )

  const leaveTypes = await queryMany(
    `SELECT * FROM leave_types WHERE is_active = true`
  )

  // Get old Earn Leave balance for the user (for Earn Leave calculation)
  const user = await queryOne(
    `SELECT old_earn_leave_balance FROM users WHERE id = $1`,
    [userId]
  )
  const oldEarnLeaveBalance = parseFloat(user?.old_earn_leave_balance || '0')

  // Ensure all leave types have a balance entry
  const balanceMap = new Map(balances.map((b: any) => [b.leave_type_id, b]))
  
  // Calculate Earn Leave balance dynamically from attendance
  // This needs to be done separately since it's async
  let earnLeaveBalance = oldEarnLeaveBalance // Default to old balance
  const earnLeaveType = leaveTypes.find((lt: any) => lt.type === 'EARN_LEAVE')
  if (earnLeaveType) {
    const dutyDays = await calculateDutyDays(userId, year)
    const earnedLeave = await calculateEarnedLeave(dutyDays)
    earnLeaveBalance = oldEarnLeaveBalance + earnedLeave
  }
  
  return leaveTypes.map((lt: any) => {
    const balance = balanceMap.get(lt.id)
    const maxDays = lt.max_days || lt.maxDays
    
    // For Earn Leave: Use calculated balance from attendance
    // Earn Leave should start at 0 (or old balance) and only increase when 20 duty days are completed
    if (lt.type === 'EARN_LEAVE') {
      return {
        leaveType: {
          id: lt.id,
          name: lt.name,
          type: lt.type,
          maxDays: maxDays,
          carryForward: lt.carry_forward || lt.carryForward,
          isActive: lt.is_active || lt.isActive,
          createdAt: lt.created_at || lt.createdAt,
          updatedAt: lt.updated_at || lt.updatedAt,
        },
        balance: earnLeaveBalance, // Calculated from attendance + old balance
        maxDays: maxDays,
      }
    }
    
    // For other leave types, use maxDays as default if no balance exists
    return {
      leaveType: {
        id: lt.id,
        name: lt.name,
        type: lt.type,
        maxDays: maxDays,
        carryForward: lt.carry_forward || lt.carryForward,
        isActive: lt.is_active || lt.isActive,
        createdAt: lt.created_at || lt.createdAt,
        updatedAt: lt.updated_at || lt.updatedAt,
      },
      balance: balance ? parseFloat(balance.balance) : maxDays,
      maxDays: maxDays,
    }
  })
}

export async function initializeLeaveBalances(userId: string, year: number) {
  const leaveTypes = await queryMany(
    `SELECT * FROM leave_types WHERE is_active = true`
  )

  // Get old Earn Leave balance for the user
  const user = await queryOne(
    `SELECT old_earn_leave_balance FROM users WHERE id = $1`,
    [userId]
  )
  const oldEarnLeaveBalance = parseFloat(user?.old_earn_leave_balance || '0')

  const balances = await Promise.all(
    leaveTypes.map((lt: any) => {
      // For Earn Leave, use old balance (carried forward) instead of max_days
      // For other leave types, use max_days
      const initialBalance = lt.type === 'EARN_LEAVE' 
        ? oldEarnLeaveBalance 
        : (lt.max_days || lt.maxDays)
      
      return query(
        `INSERT INTO leave_balances (user_id, leave_type_id, balance, year)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, leave_type_id, year) DO UPDATE SET balance = EXCLUDED.balance
         RETURNING *`,
        [userId, lt.id, initialBalance, year]
      )
    })
  )

  return balances.map(b => b.rows[0])
}

/**
 * Calculate total duty days from attendance data for a given year
 * Duty days = PRESENT (1 day) + HALF_DAY (0.5 day)
 * ABSENT and ON_LEAVE don't count as duty days
 */
export async function calculateDutyDays(userId: string, year: number): Promise<number> {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  
  const attendanceRecords = await queryMany(
    `SELECT status 
     FROM attendance 
     WHERE user_id = $1 
       AND date >= $2 
       AND date <= $3
       AND status IN ('PRESENT', 'HALF_DAY')`,
    [userId, startDate, endDate]
  )
  
  let dutyDays = 0
  attendanceRecords.forEach((record: any) => {
    if (record.status === 'PRESENT') {
      dutyDays += 1
    } else if (record.status === 'HALF_DAY') {
      dutyDays += 0.5
    }
  })
  
  return dutyDays
}

/**
 * Calculate earned leave based on duty days
 * Rule: 1 Earn Leave per 20 duty days
 * Maximum: 18 Earn Leaves per year
 */
export async function calculateEarnedLeave(dutyDays: number): Promise<number> {
  // 1 EL per 20 duty days
  const earnedLeave = Math.floor(dutyDays / 20)
  
  // Maximum 18 Earn Leaves per year
  return Math.min(earnedLeave, 18)
}

/**
 * Calculate and update Earn Leave balance for a user
 * Combines old balance (carried forward) with newly earned leave
 * Enforces maximum of 18 Earn Leaves per year
 */
export async function calculateAndUpdateEarnLeaveBalance(
  userId: string,
  year: number
): Promise<{ oldBalance: number; dutyDays: number; earnedLeave: number; totalBalance: number }> {
  // Get old Earn Leave balance from user record
  const user = await queryOne(
    `SELECT old_earn_leave_balance FROM users WHERE id = $1`,
    [userId]
  )
  
  const oldBalance = parseFloat(user?.old_earn_leave_balance || '0')
  
  // Calculate duty days for the year
  const dutyDays = await calculateDutyDays(userId, year)
  
  // Calculate newly earned leave based on duty days
  const earnedLeave = await calculateEarnedLeave(dutyDays)
  
  // Total balance = old balance + newly earned leave
  // But maximum is 18 per year (only newly earned leave is capped, old balance can exceed)
  const totalBalance = oldBalance + earnedLeave
  
  // Get Earn Leave leave type
  const earnLeaveType = await queryOne(
    `SELECT id FROM leave_types WHERE type = 'EARN_LEAVE' AND is_active = true LIMIT 1`,
    []
  )
  
  if (!earnLeaveType) {
    throw new Error('Earn Leave type not found')
  }
  
  // Update or insert leave balance
  await query(
    `INSERT INTO leave_balances (user_id, leave_type_id, balance, year)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, leave_type_id, year) 
     DO UPDATE SET balance = EXCLUDED.balance, updated_at = NOW()
     RETURNING *`,
    [userId, earnLeaveType.id, totalBalance, year]
  )
  
  return {
    oldBalance,
    dutyDays,
    earnedLeave,
    totalBalance
  }
}

/**
 * Calculate and update Earn Leave balances for all active employees
 * This should be run periodically (e.g., monthly or quarterly)
 */
export async function calculateEarnLeaveForAllUsers(year: number = new Date().getFullYear()): Promise<{
  processed: number
  results: Array<{ userId: string; oldBalance: number; dutyDays: number; earnedLeave: number; totalBalance: number }>
}> {
  const activeUsers = await queryMany(
    `SELECT id FROM users WHERE is_active = true AND role = 'EMPLOYEE'`,
    []
  )
  
  const results = []
  
  for (const user of activeUsers) {
    try {
      const result = await calculateAndUpdateEarnLeaveBalance(user.id, year)
      results.push({
        userId: user.id,
        ...result
      })
    } catch (error: any) {
      console.error(`Error calculating Earn Leave for user ${user.id}:`, error.message)
    }
  }
  
  return {
    processed: activeUsers.length,
    results
  }
}

