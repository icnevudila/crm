'use client'

import { useSmartNotifications } from '@/hooks/useSmartNotifications'

/**
 * Smart Notification Provider
 * Akıllı bildirimler ve hatırlatıcılar için
 */
export default function SmartNotificationProvider() {
  // Bildirim kuralları
  const rules = [
    {
      type: 'deadline' as const,
      apiUrl: '/api/deals?status=ACTIVE',
      message: (deal: any) =>
        `"${deal.title}" fırsatının kapanma tarihi yaklaşıyor (${new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')})`,
      daysBefore: 3,
      checkInterval: 5, // 5 dakika
    },
    {
      type: 'payment' as const,
      apiUrl: '/api/invoices?status=SENT',
      message: (invoice: any) =>
        `"${invoice.number}" faturasının ödeme tarihi yaklaşıyor (${new Date(invoice.dueDate).toLocaleDateString('tr-TR')})`,
      daysBefore: 3,
      checkInterval: 5,
    },
    {
      type: 'meeting' as const,
      apiUrl: '/api/meetings?status=SCHEDULED',
      message: (meeting: any) =>
        `"${meeting.title}" görüşmesi 30 dakika içinde başlayacak`,
      daysBefore: 0,
      checkInterval: 1, // 1 dakika (görüşmeler için daha sık kontrol)
    },
    {
      type: 'task' as const,
      apiUrl: '/api/tasks?status=PENDING',
      message: (task: any) =>
        `"${task.title}" görevinin son tarihi yaklaşıyor (${new Date(task.dueDate).toLocaleDateString('tr-TR')})`,
      daysBefore: 1,
      checkInterval: 5,
    },
    {
      type: 'low_stock' as const,
      apiUrl: '/api/products',
      message: (product: any) =>
        `"${product.name}" ürününün stoku düşük (Mevcut: ${product.stock}, Minimum: ${product.minStock || 10})`,
      daysBefore: 0,
      checkInterval: 10, // 10 dakika
    },
  ]

  useSmartNotifications(rules)

  return null
}


