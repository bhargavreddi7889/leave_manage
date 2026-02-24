import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryMany, queryOne } from '@/lib/db'

// GET /api/admin/working-days?year=2026&month=2  (month is 1-based)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year  = parseInt(searchParams.get('year')  || `${new Date().getFullYear()}`)
    const month = parseInt(searchParams.get('month') || `${new Date().getMonth() + 1}`)

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate   = new Date(year, month, 0).toISOString().split('T')[0]

    const rows = await queryMany(
      `SELECT date, is_working_day, day_type, note
       FROM working_days
       WHERE date >= $1 AND date <= $2
       ORDER BY date`,
      [startDate, endDate]
    )

    return NextResponse.json(rows)
  } catch (error: any) {
    console.error('Error fetching working days:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/working-days/init  — initialise a full year
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const year = parseInt(body.year) || new Date().getFullYear()

    const start = new Date(year, 0, 1)
    const end   = new Date(year, 11, 31)
    let inserted = 0

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dow = d.getDay()
      const isWeekend = dow === 0 || dow === 6
      const res = await query(
        `INSERT INTO working_days (date, is_working_day, day_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (date) DO NOTHING`,
        [dateStr, !isWeekend, isWeekend ? 'WEEKEND' : 'WEEKDAY']
      )
      if (res.rowCount && res.rowCount > 0) inserted++
    }

    return NextResponse.json({ message: `Initialised ${year}: ${inserted} days added.` })
  } catch (error: any) {
    console.error('Error initialising working days:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
