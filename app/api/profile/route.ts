import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone, department, position } = body

    const result = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, department = $4, position = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, first_name, last_name, email, phone, department, position`,
      [firstName, lastName, phone || null, department || null, position || null, session.user.id]
    )
    
    const row = result.rows[0]
    return NextResponse.json({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      department: row.department,
      position: row.position,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

