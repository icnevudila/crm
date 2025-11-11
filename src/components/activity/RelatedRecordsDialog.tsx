'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Package, Users, Briefcase, History, Loader2 } from 'lucide-react'
import Link from 'next/link'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import ActivityTimeline from '@/components/ui/ActivityTimeline'

interface RelatedRecordsDialogProps {
  open: boolean
  onClose: () => void
  entity: 'Deal' | 'Quote' | 'Invoice'
  entityId: string
  entityTitle: string
}

export default function RelatedRecordsDialog({
  open,
  onClose,
  entity,
  entityId,
  entityTitle,
}: RelatedRecordsDialogProps) {
  const locale = useLocale()
  const [relatedRecords, setRelatedRecords] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'records' | 'history'>('records')

  useEffect(() => {
    if (open && entityId) {
      fetchRelatedData()
    }
  }, [open, entityId, entity])

  const fetchRelatedData = async () => {
    setLoading(true)
    try {
      // Deal için ilişkili kayıtları çek
      if (entity === 'Deal') {
        const res = await fetch(`/api/deals/${entityId}`)
        if (res.ok) {
          const deal = await res.json()
          
          // İlişkili kayıtları formatla
          const records: any[] = []
          
          // Quotes
          if (deal.Quote && Array.isArray(deal.Quote)) {
            deal.Quote.forEach((q: any) => {
              records.push({
                id: q.id,
                type: 'quote',
                title: q.title,
                link: `/${locale}/quotes/${q.id}`,
              })
            })
          }
          
          // Meetings
          if (deal.Meeting && Array.isArray(deal.Meeting)) {
            deal.Meeting.forEach((m: any) => {
              records.push({
                id: m.id,
                type: 'meeting',
                title: m.title,
                link: `/${locale}/meetings/${m.id}`,
              })
            })
          }
          
          // Contracts
          if (deal.Contract && Array.isArray(deal.Contract)) {
            deal.Contract.forEach((c: any) => {
              records.push({
                id: c.id,
                type: 'contract',
                title: c.title,
                link: `/${locale}/contracts/${c.id}`,
              })
            })
          }
          
          setRelatedRecords(records)
        }
      } else if (entity === 'Quote') {
        const res = await fetch(`/api/quotes/${entityId}`)
        if (res.ok) {
          const quote = await res.json()
          const records: any[] = []
          
          if (quote.Deal) {
            records.push({
              id: quote.Deal.id,
              type: 'deal',
              title: quote.Deal.title,
              link: `/${locale}/deals/${quote.Deal.id}`,
            })
          }
          
          if (quote.Invoice && Array.isArray(quote.Invoice)) {
            quote.Invoice.forEach((i: any) => {
              records.push({
                id: i.id,
                type: 'invoice',
                title: i.title,
                link: `/${locale}/invoices/${i.id}`,
              })
            })
          }
          
          setRelatedRecords(records)
        }
      } else if (entity === 'Invoice') {
        const res = await fetch(`/api/invoices/${entityId}`)
        if (res.ok) {
          const invoice = await res.json()
          const records: any[] = []
          
          if (invoice.Quote) {
            records.push({
              id: invoice.Quote.id,
              type: 'quote',
              title: invoice.Quote.title,
              link: `/${locale}/quotes/${invoice.Quote.id}`,
            })
          }
          
          if (invoice.Deal) {
            records.push({
              id: invoice.Deal.id,
              type: 'deal',
              title: invoice.Deal.title,
              link: `/${locale}/deals/${invoice.Deal.id}`,
            })
          }
          
          if (invoice.Shipment && Array.isArray(invoice.Shipment)) {
            invoice.Shipment.forEach((s: any) => {
              records.push({
                id: s.id,
                type: 'shipment',
                title: s.tracking || 'Sevkiyat',
                link: `/${locale}/shipments/${s.id}`,
              })
            })
          }
          
          setRelatedRecords(records)
        }
      }
      
      // ActivityLog'ları çek
      const activityRes = await fetch(`/api/activity?entity=${entity}&entityId=${entityId}`)
      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setActivities(activityData || [])
      }
    } catch (error) {
      console.error('Error fetching related data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entity === 'Deal' ? 'Fırsat' : entity === 'Quote' ? 'Teklif' : 'Fatura'} Geçmişi - {entityTitle}
          </DialogTitle>
          <DialogDescription>
            Bu {entity === 'Deal' ? 'fırsat' : entity === 'Quote' ? 'teklif' : 'fatura'} ile ilgili tüm işlem geçmişi ve ilişkili kayıtlar
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-4">
          <Button
            variant={activeTab === 'records' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('records')}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            İlişkili Kayıtlar
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600"
          >
            <History className="h-4 w-4 mr-2" />
            İşlem Geçmişi
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {activeTab === 'records' && (
              <div className="space-y-4">
                {relatedRecords.length > 0 ? (
                  <RelatedRecordsSuggestions
                    entityType={entity.toLowerCase() as 'deal' | 'quote' | 'invoice'}
                    entityId={entityId}
                    relatedRecords={relatedRecords}
                  />
                ) : (
                  <Card className="p-6 text-center text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Henüz ilişkili kayıt bulunmuyor</p>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {activities.length > 0 ? (
                  <ActivityTimeline activities={activities} />
                ) : (
                  <Card className="p-6 text-center text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Henüz işlem geçmişi yok</p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}












