import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { name, maxDays, carryForward, isActive } = body

    // Build update query dynamically
    const updates: string[] = []
    const updateParams: any[] = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      updateParams.push(name)
    }

    if (maxDays !== undefined) {
      updates.push(`max_days = $${paramCount++}`)
      updateParams.push(parseInt(maxDays))
    }

    if (carryForward !== undefined) {
      updates.push(`carry_forward = $${paramCount++}`)
      updateParams.push(carryForward)
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      updateParams.push(isActive)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push(`updated_at = NOW()`)
    updateParams.push(id)

    const sql = `UPDATE leave_types SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
    
    const result = await query(sql, updateParams)

    const row = result.rows[0]
    return NextResponse.json({
      id: row.id,
      name: row.name,
      type: row.type,
      maxDays: row.max_days,
      carryForward: row.carry_forward,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating leave type:', error)
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { error: 'Leave type name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if there are any leave requests using this leave type
    const leaveRequestsCheck = await query(
      'SELECT COUNT(*) as count FROM leave_requests WHERE leave_type_id = $1',
      [id]
    )

    if (parseInt(leaveRequestsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete leave type that has associated leave requests. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await query('DELETE FROM leave_types WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting leave type:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
