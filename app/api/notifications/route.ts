import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const notifications = await getUserNotifications(session.user.id, limit)
    const unreadCount = await getUnreadNotificationCount(session.user.id)

    const filtered = unreadOnly 
      ? notifications.filter(n => !n.read)
      : notifications

    return NextResponse.json({
      notifications: filtered,
      unreadCount,
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await markAllNotificationsAsRead(session.user.id)
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId, session.user.id)
      return NextResponse.json({ success: true, message: 'Notification marked as read' })
    }

    return NextResponse.json(
      { error: 'Missing notificationId or markAllAsRead flag' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

