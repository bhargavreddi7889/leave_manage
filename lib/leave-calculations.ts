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

  // Ensure all leave types have a balance entry
  const balanceMap = new Map(balances.map((b: any) => [b.leave_type_id, b]))
  
  return leaveTypes.map((lt: any) => {
    const balance = balanceMap.get(lt.id)
    const maxDays = lt.max_days || lt.maxDays
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

  const balances = await Promise.all(
    leaveTypes.map((lt: any) =>
      query(
        `INSERT INTO leave_balances (user_id, leave_type_id, balance, year)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, leave_type_id, year) DO UPDATE SET balance = EXCLUDED.balance
         RETURNING *`,
        [userId, lt.id, lt.max_days || lt.maxDays, year]
      )
    )
  )

  return balances.map(b => b.rows[0])
}

