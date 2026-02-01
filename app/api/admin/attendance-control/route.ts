import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getAttendanceControl, toggleAttendanceControl } from '@/lib/attendance-control'
import { createAuditLog } from '@/lib/audit-log'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const control = await getAttendanceControl()
    
    if (!control) {
      return NextResponse.json({ isEnabled: false })
    }

    return NextResponse.json({
      isEnabled: control.isEnabled,
      enabledAt: control.enabledAt,
      enabledBy: control.enabledBy,
      disabledAt: control.disabledAt,
      disabledBy: control.disabledBy,
    })
  } catch (error: any) {
    console.error('Error fetching attendance control:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      )
    }

    // Get current state for audit
    const currentControl = await getAttendanceControl()
    const oldValue = currentControl?.isEnabled || false

    // Toggle attendance control
    const success = await toggleAttendanceControl(enabled, session.user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update attendance control' },
        { status: 500 }
      )
    }

    // Create audit log
    await createAuditLog({
      actionType: 'ATTENDANCE_CONTROL_TOGGLE',
      entityType: 'ATTENDANCE_CONTROL',
      userId: session.user.id,
      oldValues: { isEnabled: oldValue },
      newValues: { isEnabled: enabled },
      reason: enabled ? 'Attendance system enabled' : 'Attendance system disabled',
      req,
    })

    return NextResponse.json({ 
      success: true, 
      isEnabled: enabled,
      message: enabled ? 'Attendance system enabled' : 'Attendance system disabled'
    })
  } catch (error: any) {
    console.error('Error updating attendance control:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

