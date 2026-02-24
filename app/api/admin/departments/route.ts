import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { queryMany } from '@/lib/db'

// GET - List distinct active departments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await queryMany(
      `SELECT DISTINCT department FROM users
       WHERE is_active = true AND department IS NOT NULL AND department != ''
       ORDER BY department`
    )

    return NextResponse.json(rows.map((r: any) => r.department))
  } catch (error: any) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
