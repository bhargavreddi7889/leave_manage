import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const routeParams = params instanceof Promise ? await params : params
    const { id } = routeParams
    const body = await req.json()
    const { role, managerId, isActive, department, position, phone } = body

    // Prevent admin from demoting themselves
    if (id === session.user.id && role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot change your own role from ADMIN' },
        { status: 400 }
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const queryParams: any[] = []
    let paramCount = 1

    if (role !== undefined) {
      if (!['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
      updates.push(`role = $${paramCount++}`)
      queryParams.push(role)
    }

    if (managerId !== undefined) {
      updates.push(`manager_id = $${paramCount++}`)
      // Convert empty string to null for database
      queryParams.push(managerId === '' ? null : managerId)
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      queryParams.push(isActive)
    }

    if (department !== undefined) {
      updates.push(`department = $${paramCount++}`)
      queryParams.push(department || null)
    }

    if (position !== undefined) {
      updates.push(`position = $${paramCount++}`)
      queryParams.push(position || null)
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`)
      queryParams.push(phone || null)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push(`updated_at = NOW()`)
    queryParams.push(id)

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
    
    const result = await query(sql, queryParams)

    const row = result.rows[0]
    return NextResponse.json({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      employeeId: row.employee_id,
      phone: row.phone,
      department: row.department,
      position: row.position,
      managerId: row.manager_id,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const routeParams = params instanceof Promise ? await params : params
    const { id } = routeParams

    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    await query('DELETE FROM users WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
