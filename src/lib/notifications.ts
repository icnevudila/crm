import { createClientSupabase } from './supabase'
import { createNotification } from './notification-helper'

/**
 * Bildirimi okundu olarak işaretle
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in markNotificationRead:', error)
    throw error
  }
}

/**
 * Kullanıcının tüm bildirimlerini okundu olarak işaretle
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', userId)
      .eq('isRead', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error)
    throw error
  }
}

/**
 * Kullanıcının okunmamış bildirim sayısını getir
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const supabase = createClientSupabase()
    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('isRead', false)

    if (error) {
      console.error('Error getting unread notification count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error)
    return 0
  }
}

/**
 * Kullanıcının bildirimlerini getir
 */
export async function fetchUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const supabase = createClientSupabase()
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchUserNotifications:', error)
    return []
  }
}

/**
 * Görev atama bildirimi oluştur
 */
export async function notifyTaskAssignment({
  userId,
  companyId,
  taskId,
  taskTitle,
}: {
  userId: string
  companyId: string
  taskId: string
  taskTitle: string
}): Promise<void> {
  try {
    await createNotification({
      userId,
      companyId,
      title: 'Yeni Görev Atandı',
      message: `"${taskTitle}" görevi size atandı.`,
      type: 'info',
      relatedTo: 'Task',
      relatedId: taskId,
      link: `/tr/tasks/${taskId}`,
      priority: 'normal',
    })
  } catch (error) {
    console.error('Error in notifyTaskAssignment:', error)
    // Bildirim oluşturma hatası ana işlemi engellemez
  }
}



































