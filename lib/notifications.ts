import { query, queryMany } from './db'

export type NotificationType = 
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'MISSED_CHECKOUT'
  | 'ATTENDANCE_MARKED_LOP'
  | 'LEAVE_PENDING'
  | 'ATTENDANCE_EDITED'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedEntityType?: 'LEAVE_REQUEST' | 'ATTENDANCE'
  relatedEntityId?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await query(
      `INSERT INTO notifications (
        user_id, type, title, message, 
        related_entity_type, related_entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.userId,
        params.type,
        params.title,
        params.message,
        params.relatedEntityType || null,
        params.relatedEntityId || null,
      ]
    )
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

export async function getUserNotifications(userId: string, limit: number = 50) {
  try {
    const notifications = await queryMany(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    )

    return notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      relatedEntityType: n.related_entity_type,
      relatedEntityId: n.related_entity_id,
      createdAt: n.created_at,
    }))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await query(
      `UPDATE notifications 
       SET read = true 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    )
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await query(
      `UPDATE notifications 
       SET read = true 
       WHERE user_id = $1 AND read = false`,
      [userId]
    )
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 AND read = false`,
      [userId]
    )
    return parseInt(result.rows[0]?.count || '0')
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

