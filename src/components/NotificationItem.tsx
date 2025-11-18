'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NotificationItemProps {
  notification: {
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
  onClick?: () => void
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const badgeColor = {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  }[notification.priority || 'normal']

  const typeColor = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    system: 'bg-blue-100 text-blue-800 border-blue-200',
    info: 'bg-gray-100 text-gray-800 border-gray-200',
  }[notification.type]

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Az önce'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`
    return notificationDate.toLocaleDateString('tr-TR')
  }

  const content = (
    <div className={cn(
      'p-4 hover:bg-accent transition-colors',
      !notification.isRead && 'bg-blue-50/50',
      notification.link ? 'cursor-pointer' : ''
    )}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
            !notification.isRead ? 'bg-blue-600' : 'bg-gray-300'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium text-sm">{notification.title}</p>
            {notification.priority && (
              <Badge
                variant="outline"
                className={cn('text-xs font-semibold', badgeColor)}
              >
                {notification.priority === 'low' ? 'Düşük' :
                 notification.priority === 'normal' ? 'Normal' :
                 notification.priority === 'high' ? 'Yüksek' :
                 'Kritik'}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn('text-xs', typeColor)}
            >
              {notification.type}
            </Badge>
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground mb-1">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link 
        href={notification.link} 
        onClick={onClick} 
        className="block"
        prefetch={true} // ÖNEMLİ: Prefetch aktif - sayfa daha hızlı yüklenir
      >
        {content}
      </Link>
    )
  }

  return (
    <div onClick={onClick}>
      {content}
    </div>
  )
}































































































