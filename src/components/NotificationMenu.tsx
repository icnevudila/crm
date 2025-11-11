'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationMenuProps {
  userId: string
}

export default function NotificationMenu({ userId }: NotificationMenuProps) {
  return (
    <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 transition-colors">
      <Bell className="h-5 w-5 text-gray-600" />
    </Button>
  )
}






