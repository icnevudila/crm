'use client'

import { useState, useEffect } from 'react'
import { useData } from '@/hooks/useData'
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
  const apiUrl = open && entityId ? (() => {
    const params = new URLSearchParams()
    params.append('entity', entity)
    params.append('entityId', entityId)
    params.append('limit', '200')
    return `/api/activity?${params.toString()}`
  })() : null

  const { data: activities = [], isLoading, error } = useData<ActivityLog[]>(
    apiUrl,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )

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





