import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { createAuditLog } from '@/lib/audit-log'

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

    // Get existing leave type for audit
    const existingLeaveType = await queryOne(
      `SELECT * FROM leave_types WHERE id = $1`,
      [id]
    )

    if (!existingLeaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      )
    }

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

    // Create audit log
    await createAuditLog({
      actionType: 'LEAVE_TYPE_UPDATE',
      entityType: 'LEAVE_TYPE',
      entityId: id,
      userId: session.user.id,
      oldValues: {
        name: existingLeaveType.name,
        maxDays: existingLeaveType.max_days,
        carryForward: existingLeaveType.carry_forward,
        isActive: existingLeaveType.is_active,
      },
      newValues: {
        name: name !== undefined ? name : existingLeaveType.name,
        maxDays: maxDays !== undefined ? parseInt(maxDays) : existingLeaveType.max_days,
        carryForward: carryForward !== undefined ? carryForward : existingLeaveType.carry_forward,
        isActive: isActive !== undefined ? isActive : existingLeaveType.is_active,
      },
      reason: 'Leave type updated',
      req,
    })

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

    // Get existing leave type for audit
    const existingLeaveType = await queryOne(
      `SELECT * FROM leave_types WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!existingLeaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      )
    }

    // Check if there are any leave requests using this leave type
    const leaveRequestsCheck = await query(
      'SELECT COUNT(*) as count FROM leave_requests WHERE leave_type_id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (parseInt(leaveRequestsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete leave type that has associated leave requests. Deactivate it instead.' },
        { status: 400 }
      )
    }

    // Soft delete - set deleted_at timestamp
    await query(
      `UPDATE leave_types SET deleted_at = NOW() WHERE id = $1`,
      [id]
    )

    // Create audit log
    await createAuditLog({
      actionType: 'LEAVE_TYPE_DELETE',
      entityType: 'LEAVE_TYPE',
      entityId: id,
      userId: session.user.id,
      oldValues: {
        name: existingLeaveType.name,
        type: existingLeaveType.type,
        maxDays: existingLeaveType.max_days,
        carryForward: existingLeaveType.carry_forward,
      },
      newValues: { deletedAt: new Date().toISOString() },
      reason: 'Leave type deleted (soft delete)',
      req,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting leave type:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
