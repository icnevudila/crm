'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Activity } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { useData } from '@/hooks/useData'
import { useSession } from 'next-auth/react'

import type { RecentActivitiesResponse } from '@/components/dashboard/types'

interface RecentActivitiesSectionProps {
  isOpen: boolean
}

const ActivityTimeline = dynamic(
  () => import('@/components/ui/ActivityTimeline'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] animate-pulse rounded bg-gray-100" />
    ),
  }
)

export default function RecentActivitiesSection({
  isOpen,
}: RecentActivitiesSectionProps) {
  const t = useTranslations('dashboard')
  const { data: session } = useSession()

  const { data } = useData<RecentActivitiesResponse>(
    isOpen ? '/api/analytics/recent-activities' : null,
    {
      dedupingInterval: 180_000,
      refreshInterval: 300_000,
      revalidateOnFocus: false,
    }
  )

  if (!isOpen) {
    return null
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Activity className="h-5 w-5 text-indigo-600" />
          {t('recentActivities', { defaultMessage: 'Son Aktiviteler' })}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {t('recentActivitiesDescription', {
            defaultMessage: 'Sistem aktivite logları',
          })}
        </p>
      </div>

      <Card className="p-4 shadow-card transition-shadow hover:shadow-card-hover">
        {!session?.user ? (
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            <p>{t('noActivities', { defaultMessage: 'Henüz aktivite kaydı yok' })}</p>
          </div>
        ) : data?.activities && data.activities.length > 0 ? (
          <ActivityTimeline activities={data.activities} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            <p>{t('noActivities', { defaultMessage: 'Henüz aktivite kaydı yok' })}</p>
          </div>
        )}
      </Card>
    </section>
  )
}




