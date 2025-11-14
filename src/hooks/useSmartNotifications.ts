/**
 * Smart Notifications Hook
 * Akıllı bildirimler ve hatırlatıcılar için
 */

import { useEffect, useCallback, useRef } from 'react'
import { toastWarning } from '@/lib/toast'
import { useSession } from '@/hooks/useSession'

interface NotificationRule {
  /**
   * Bildirim tipi
   */
  type: 'deadline' | 'payment' | 'meeting' | 'task' | 'low_stock'
  
  /**
   * API endpoint (bildirim verilerini çekmek için)
   */
  apiUrl: string
  
  /**
   * Bildirim mesajı formatı
   */
  message: (item: any) => string
  
  /**
   * Kaç gün önceden bildirim gösterilecek
   */
  daysBefore?: number
  
  /**
   * Kontrol sıklığı (dakika)
   */
  checkInterval?: number
}

/**
 * Smart Notifications Hook
 * Akıllı bildirimler ve hatırlatıcılar
 */
export function useSmartNotifications(rules: NotificationRule[]) {
  const { data: session } = useSession()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const notifiedIdsRef = useRef<Set<string>>(new Set())

  // Bildirim kontrolü
  const checkNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    for (const rule of rules) {
      try {
        const { data = [] } = await fetch(rule.apiUrl).then((r) => r.json())

        const now = new Date()
        const daysBefore = rule.daysBefore || 1

        for (const item of data) {
          const itemId = `${rule.type}-${item.id}`
          
          // Zaten bildirim gösterildiyse atla
          if (notifiedIdsRef.current.has(itemId)) continue

          let shouldNotify = false
          let notificationDate: Date | null = null

          // Tarih kontrolü
          if (rule.type === 'deadline' && item.dueDate) {
            notificationDate = new Date(item.dueDate)
            const diffDays = Math.ceil(
              (notificationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            shouldNotify = diffDays <= daysBefore && diffDays >= 0
          } else if (rule.type === 'payment' && item.dueDate) {
            notificationDate = new Date(item.dueDate)
            const diffDays = Math.ceil(
              (notificationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            shouldNotify = diffDays <= daysBefore && diffDays >= 0
          } else if (rule.type === 'meeting' && item.startDate) {
            notificationDate = new Date(item.startDate)
            const diffMinutes = Math.ceil(
              (notificationDate.getTime() - now.getTime()) / (1000 * 60)
            )
            shouldNotify = diffMinutes <= 30 && diffMinutes >= 0 // 30 dakika önceden
          } else if (rule.type === 'task' && item.dueDate) {
            notificationDate = new Date(item.dueDate)
            const diffDays = Math.ceil(
              (notificationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            shouldNotify = diffDays <= daysBefore && diffDays >= 0
          } else if (rule.type === 'low_stock' && item.stock !== undefined) {
            shouldNotify = item.stock <= (item.minStock || 10)
          }

          if (shouldNotify) {
            const message = rule.message(item)
            toastWarning(message, undefined, { duration: 10000 })
            
            // Bildirim gösterildi olarak işaretle
            notifiedIdsRef.current.add(itemId)
          }
        }
      } catch (error) {
        console.error(`Notification check error for ${rule.type}:`, error)
      }
    }
  }, [session, rules])

  // Periyodik kontrol
  useEffect(() => {
    if (!session?.user?.id) return

    // İlk kontrol
    checkNotifications()

    // Periyodik kontrol
    const interval = rules[0]?.checkInterval || 5 // Varsayılan 5 dakika
    intervalRef.current = setInterval(checkNotifications, interval * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session, checkNotifications, rules])

  // Bildirimleri temizle (sayfa yenilendiğinde)
  const clearNotifications = useCallback(() => {
    notifiedIdsRef.current.clear()
  }, [])

  return {
    clearNotifications,
    checkNotifications,
  }
}

