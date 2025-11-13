'use client'

import { Clock, CheckCircle2, XCircle, Plus, Edit, Trash2 } from 'lucide-react'

import { formatUserFriendlyMessage, formatEntity } from '@/lib/logger-utils'

interface ActivityLog {
  id: string
  entity: string
  action: string
  description: string
  meta?: Record<string, any>
  createdAt: string
  User?: {
    name: string
    email: string
  }
}

interface ActivityTimelineProps {
  activities: ActivityLog[]
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4 text-green-600" />,
  UPDATE: <Edit className="h-4 w-4 text-blue-600" />,
  DELETE: <Trash2 className="h-4 w-4 text-red-600" />,
  STATUS_UPDATE: <CheckCircle2 className="h-4 w-4 text-purple-600" />,
  PAID: <CheckCircle2 className="h-4 w-4 text-green-600" />,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 border-green-300',
  UPDATE: 'bg-blue-100 border-blue-300',
  DELETE: 'bg-red-100 border-red-300',
  STATUS_UPDATE: 'bg-purple-100 border-purple-300',
  PAID: 'bg-green-100 border-green-300',
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-gray-500">
        <p>Henüz aktivite kaydı yok</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={`relative border-l-2 pl-8 pb-4 ${
            index !== activities.length - 1 ? 'border-gray-200' : 'border-transparent'
          }`}
        >
          <div
            className={`absolute left-0 top-1 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 ${
              actionColors[activity.action] || 'bg-gray-100 border-gray-300'
            }`}
          >
            {actionIcons[activity.action] || <Clock className="h-3 w-3 text-gray-600" />}
          </div>

          <div className="space-y-1">
            <p className="font-medium text-gray-900">
              {formatUserFriendlyMessage(activity.description, activity.meta)}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(activity.createdAt).toLocaleString('tr-TR')}</span>
              {activity.User && (
                <>
                  <span>•</span>
                  <span>{activity.User.name}</span>
                </>
              )}
              <span className="ml-auto rounded bg-gray-100 px-2 py-1 text-xs">
                {formatEntity(activity.entity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}







