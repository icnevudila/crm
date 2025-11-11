'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonList from '@/components/skeletons/SkeletonList'

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

interface ActivityLogDialogProps {
  open: boolean
  onClose: () => void
  entity: string // 'Deal', 'Quote', 'Invoice', etc.
  entityId: string
  entityTitle?: string // Kart başlığı (gösterim için)
}

async function fetchActivityLogs(entity: string, entityId: string): Promise<ActivityLog[]> {
  const params = new URLSearchParams()
  params.append('entity', entity)
  params.append('entityId', entityId)
  params.append('limit', '200') // Limit artırıldı - bağlı kayıtların işlemleri de gösterilecek

  const res = await fetch(`/api/activity?${params.toString()}`)
  if (!res.ok) {
    throw new Error('Failed to fetch activity logs')
  }
  return res.json()
}

const entityLabels: Record<string, string> = {
  Deal: 'Fırsat',
  Quote: 'Teklif',
  Invoice: 'Fatura',
  Customer: 'Müşteri',
  Task: 'Görev',
  Ticket: 'Destek',
  Shipment: 'Sevkiyat',
  Contract: 'Sözleşme',
}

export default function ActivityLogDialog({
  open,
  onClose,
  entity,
  entityId,
  entityTitle,
}: ActivityLogDialogProps) {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['activity', entity, entityId],
    queryFn: () => fetchActivityLogs(entity, entityId),
    enabled: open && !!entityId, // Sadece dialog açıkken ve entityId varsa çek
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entityLabels[entity] || entity} Geçmişi
            {entityTitle && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - {entityTitle}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Bu {entityLabels[entity] || entity.toLowerCase()} ile ilgili tüm işlem geçmişi
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <SkeletonList />
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Geçmiş yüklenirken bir hata oluştu
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz işlem geçmişi yok
            </div>
          ) : (
            <ActivityTimeline activities={activities} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}





