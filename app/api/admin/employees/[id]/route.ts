import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { createAuditLog } from '@/lib/audit-log'

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
    const { 
      firstName, 
      lastName, 
      employeeId, 
      email, 
      mobile, 
      phone, 
      department, 
      position, 
      role, 
      hodId, 
      isActive 
    } = body

    // Get existing employee for audit
    const existingEmployee = await queryOne(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Prevent admin from demoting themselves
    if (id === session.user.id && role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot change your own role from ADMIN' },
        { status: 400 }
      )
    }

    // Validate mobile uniqueness if mobile is being updated
    if (mobile !== undefined && mobile !== null && mobile !== '') {
      const existingMobile = await queryOne(
        'SELECT id FROM users WHERE mobile = $1 AND id != $2',
        [mobile, id]
      )
      if (existingMobile) {
        return NextResponse.json(
          { error: 'Mobile number already exists' },
          { status: 400 }
        )
      }
    }

    // Validate email uniqueness if email is being updated
    if (email !== undefined && email !== null && email !== '') {
      const existingEmail = await queryOne(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      )
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Validate employee ID uniqueness if employeeId is being updated
    if (employeeId !== undefined && employeeId !== null && employeeId !== '') {
      const existingEmployeeId = await queryOne(
        'SELECT id FROM users WHERE employee_id = $1 AND id != $2',
        [employeeId, id]
      )
      if (existingEmployeeId) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 400 }
        )
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const queryParams: any[] = []
    let paramCount = 1

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`)
      queryParams.push(firstName)
    }

    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`)
      queryParams.push(lastName)
    }

    if (employeeId !== undefined) {
      updates.push(`employee_id = $${paramCount++}`)
      queryParams.push(employeeId)
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`)
      queryParams.push(email || null)
    }

    if (mobile !== undefined) {
      updates.push(`mobile = $${paramCount++}`)
      queryParams.push(mobile || null)
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`)
      queryParams.push(phone || null)
    }

    if (department !== undefined) {
      updates.push(`department = $${paramCount++}`)
      queryParams.push(department || null)
    }

    if (position !== undefined) {
      updates.push(`position = $${paramCount++}`)
      queryParams.push(position || null)
    }

    if (role !== undefined) {
      if (!['EMPLOYEE', 'HOD', 'ADMIN'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
      updates.push(`role = $${paramCount++}`)
      queryParams.push(role)
    }

    if (hodId !== undefined) {
      // Check if user is Admin - Admin should never have a HOD
      const currentUser = await query('SELECT role FROM users WHERE id = $1', [id])
      const isAdmin = currentUser.rows[0]?.role === 'ADMIN' || role === 'ADMIN'
      
      if (isAdmin) {
        // Force Admin users to have no HOD
        updates.push(`hod_id = $${paramCount++}`)
        queryParams.push(null)
      } else {
        updates.push(`hod_id = $${paramCount++}`)
        // Convert empty string to null for database
        queryParams.push(hodId === '' ? null : hodId)
      }
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      queryParams.push(isActive)
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

    // Create audit log
    await createAuditLog({
      actionType: 'EMPLOYEE_UPDATE',
      entityType: 'EMPLOYEE',
      entityId: id,
      userId: session.user.id,
      oldValues: {
        firstName: existingEmployee.first_name,
        lastName: existingEmployee.last_name,
        employeeId: existingEmployee.employee_id,
        email: existingEmployee.email,
        mobile: existingEmployee.mobile,
        phone: existingEmployee.phone,
        department: existingEmployee.department,
        position: existingEmployee.position,
        role: existingEmployee.role,
        hodId: existingEmployee.hod_id,
        isActive: existingEmployee.is_active,
      },
      newValues: {
        firstName: firstName !== undefined ? firstName : existingEmployee.first_name,
        lastName: lastName !== undefined ? lastName : existingEmployee.last_name,
        employeeId: employeeId !== undefined ? employeeId : existingEmployee.employee_id,
        email: email !== undefined ? (email || null) : existingEmployee.email,
        mobile: mobile !== undefined ? (mobile || null) : existingEmployee.mobile,
        phone: phone !== undefined ? (phone || null) : existingEmployee.phone,
        department: department !== undefined ? department : existingEmployee.department,
        position: position !== undefined ? position : existingEmployee.position,
        role: role !== undefined ? role : existingEmployee.role,
        hodId: hodId !== undefined ? (hodId === '' ? null : hodId) : existingEmployee.hod_id,
        isActive: isActive !== undefined ? isActive : existingEmployee.is_active,
      },
      reason: 'Employee updated',
      req,
    })

    return NextResponse.json({
      id: row.id,
      email: row.email,
      mobile: row.mobile,
      firstName: row.first_name,
      lastName: row.last_name,
      employeeId: row.employee_id,
      phone: row.phone,
      department: row.department,
      position: row.position,
      hodId: row.hod_id,
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

    // Get existing employee for audit
    const existingEmployee = await queryOne(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Soft delete - set deleted_at timestamp
    await query(
      `UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1`,
      [id]
    )

    // Create audit log
    await createAuditLog({
      actionType: 'EMPLOYEE_DELETE',
      entityType: 'EMPLOYEE',
      entityId: id,
      userId: session.user.id,
      oldValues: {
        email: existingEmployee.email,
        firstName: existingEmployee.first_name,
        lastName: existingEmployee.last_name,
        employeeId: existingEmployee.employee_id,
        role: existingEmployee.role,
        isActive: existingEmployee.is_active,
      },
      newValues: { deletedAt: new Date().toISOString(), isActive: false },
      reason: 'Employee deleted (soft delete)',
      req,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
