'use client'

import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import NotificationItem from './NotificationItem'
import { useData } from '@/hooks/useData'
import { useLocale } from 'next-intl'
import Link from 'next/link'

interface NotificationMenuProps {
  userId: string
}

interface Notification {
  id: string
  title: string
  message: string | null
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  priority?: 'low' | 'normal' | 'high' | 'critical'
  link: string | null
  relatedTo: string | null
  relatedId: string | null
  isRead: boolean
  createdAt: string
}

export default function NotificationMenu({ userId }: NotificationMenuProps) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  
  // Bildirimleri çek - 30 saniyede bir refresh
  const { data: notifications = [], isLoading, mutate } = useData<Notification[]>(
    `/api/notifications?read=false&limit=20`,
    {
      refreshInterval: 30000, // 30 saniyede bir refresh
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: [notificationId],
          read: true,
        }),
      })

      if (res.ok) {
        // Optimistic update
        mutate(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          { revalidate: false }
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Tümünü okundu olarak işaretle
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: unreadIds,
          read: true,
        }),
      })

      if (res.ok) {
        // Optimistic update
        mutate(
          notifications.map((n) => ({ ...n, isRead: true })),
          { revalidate: false }
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Bildirim tıklandığında
  const handleNotificationClick = (notification: Notification) => {
    // ÖNEMLİ: Yönlendirmeyi bekletme - markAsRead'i arka planda çalıştır
    if (!notification.isRead) {
      // Optimistic update - hemen UI'da güncelle
      mutate(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        ),
        { revalidate: false }
      )
      // API çağrısını arka planda yap (yönlendirmeyi bekletme)
      markAsRead(notification.id).catch((error) => {
        console.error('Error marking notification as read:', error)
        // Hata olursa geri al (revalidate)
        mutate()
      })
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-indigo-50 transition-colors"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Bildirimler</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Yükleniyor...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Bildirim yok</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link
              href={`/${locale}/notifications`}
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium py-2"
            >
              Tümünü Gör
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}































