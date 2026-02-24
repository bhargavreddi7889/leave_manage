import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'

// PATCH /api/admin/working-days/[date]  — update a single day
export async function PATCH(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date } = params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
    }

    const body = await req.json()
    const { isWorkingDay, dayType, note } = body

    // Determine dayType if not provided
    const d = new Date(date)
    const dow = d.getDay()
    const computedType = isWorkingDay
      ? (dow === 0 || dow === 6 ? 'SPECIAL_WORKING' : (dayType || 'WEEKDAY'))
      : (dow === 0 || dow === 6 ? 'WEEKEND' : 'HOLIDAY')

    const result = await query(
      `INSERT INTO working_days (date, is_working_day, day_type, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date) DO UPDATE
         SET is_working_day = $2,
             day_type = $3,
             note = $4,
             updated_at = NOW()
       RETURNING *`,
      [date, isWorkingDay, computedType, note || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error updating working day:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
