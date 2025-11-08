/**
 * Bildirim Servisleri
 * Kullanıcılara bildirim gönderme ve yönetme
 */

import { getSupabaseWithServiceRole } from './supabase'

export interface NotificationData {
  userId: string
  companyId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'task_assigned' | 'deal_assigned' | 'quote_assigned'
  entityType?: string
  entityId?: string
}

/**
 * Kullanıcıya bildirim gönder
 */
export async function sendNotification(data: NotificationData) {
  try {
    const supabase = getSupabaseWithServiceRole()
    
    // Supabase database type tanımları eksik, Notification tablosu için type tanımı yok
    const { data: notification, error } = await (supabase
      .from('Notification') as any)
      .insert([
        {
          userId: data.userId,
          companyId: data.companyId,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          entityType: data.entityType,
          entityId: data.entityId,
          read: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Notification creation error:', error)
      return null
    }

    return notification
  } catch (error) {
    console.error('sendNotification error:', error)
    return null
  }
}

/**
 * İşlem atandığında bildirim gönder
 */
export async function notifyTaskAssignment(
  assignedUserId: string,
  companyId: string,
  taskId: string,
  taskTitle: string,
  assignedByName: string
) {
  return await sendNotification({
    userId: assignedUserId,
    companyId,
    title: 'Yeni Görev Atandı',
    message: `${assignedByName} size "${taskTitle}" görevini atadı.`,
    type: 'task_assigned',
    entityType: 'Task',
    entityId: taskId,
  })
}

/**
 * Deal atandığında bildirim gönder
 */
export async function notifyDealAssignment(
  assignedUserId: string,
  companyId: string,
  dealId: string,
  dealTitle: string,
  assignedByName: string
) {
  return await sendNotification({
    userId: assignedUserId,
    companyId,
    title: 'Yeni Fırsat Atandı',
    message: `${assignedByName} size "${dealTitle}" fırsatını atadı.`,
    type: 'deal_assigned',
    entityType: 'Deal',
    entityId: dealId,
  })
}

/**
 * Quote atandığında bildirim gönder
 */
export async function notifyQuoteAssignment(
  assignedUserId: string,
  companyId: string,
  quoteId: string,
  quoteTitle: string,
  assignedByName: string
) {
  return await sendNotification({
    userId: assignedUserId,
    companyId,
    title: 'Yeni Teklif Atandı',
    message: `${assignedByName} size "${quoteTitle}" teklifini atadı.`,
    type: 'quote_assigned',
    entityType: 'Quote',
    entityId: quoteId,
  })
}


