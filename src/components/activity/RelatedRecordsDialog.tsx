'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const fetchRelatedData = useCallback(async () => {
    if (!entityId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setRelatedRecords([])
    setActivities([])
    
    try {
      // Deal için ilişkili kayıtları çek
      if (entity === 'Deal') {
        try {
          const res = await fetch(`/api/deals/${entityId}`, {
            credentials: 'include',
            cache: 'no-store',
          })
          
          if (!res.ok) {
            // 404 veya diğer hatalar için boş array döndür
            if (res.status === 404) {
              console.warn(`Deal ${entityId} bulunamadı`)
            } else {
              const errorText = await res.text().catch(() => '')
              console.error(`Deal fetch error (${res.status}):`, errorText.substring(0, 200))
            }
            setRelatedRecords([])
          } else {
            // Content-Type kontrolü
            const contentType = res.headers.get('content-type') || ''
            if (!contentType.includes('application/json')) {
              console.error('Deal API JSON döndürmedi:', contentType)
              setRelatedRecords([])
            } else {
              const deal = await res.json().catch((jsonError) => {
                console.error('Deal JSON parse error:', jsonError)
                return null
              })
              
              if (deal) {
                // İlişkili kayıtları formatla
                const records: any[] = []
                
                // Quotes
                if (deal.Quote && Array.isArray(deal.Quote)) {
                  deal.Quote.forEach((q: any) => {
                    if (q?.id) {
                      records.push({
                        id: q.id,
                        type: 'quote',
                        title: q.title || 'Teklif',
                        link: `/${locale}/quotes/${q.id}`,
                      })
                    }
                  })
                }
                
                // Meetings
                if (deal.Meeting && Array.isArray(deal.Meeting)) {
                  deal.Meeting.forEach((m: any) => {
                    if (m?.id) {
                      records.push({
                        id: m.id,
                        type: 'meeting',
                        title: m.title || 'Görüşme',
                        link: `/${locale}/meetings/${m.id}`,
                      })
                    }
                  })
                }
                
                // Contracts
                if (deal.Contract && Array.isArray(deal.Contract)) {
                  deal.Contract.forEach((c: any) => {
                    if (c?.id) {
                      records.push({
                        id: c.id,
                        type: 'contract',
                        title: c.title || 'Sözleşme',
                        link: `/${locale}/contracts/${c.id}`,
                      })
                    }
                  })
                }
                
                setRelatedRecords(records)
              }
            }
          }
        } catch (fetchError: any) {
          console.error('Deal fetch network error:', fetchError?.message || fetchError)
          setRelatedRecords([])
        }
      } else if (entity === 'Quote') {
        try {
          const res = await fetch(`/api/quotes/${entityId}`, {
            credentials: 'include',
            cache: 'no-store',
          })
          
          if (!res.ok) {
            if (res.status === 404) {
              console.warn(`Quote ${entityId} bulunamadı`)
            } else {
              const errorText = await res.text().catch(() => '')
              console.error(`Quote fetch error (${res.status}):`, errorText.substring(0, 200))
            }
            setRelatedRecords([])
          } else {
            const contentType = res.headers.get('content-type') || ''
            if (!contentType.includes('application/json')) {
              console.error('Quote API JSON döndürmedi:', contentType)
              setRelatedRecords([])
            } else {
              const quote = await res.json().catch((jsonError) => {
                console.error('Quote JSON parse error:', jsonError)
                return null
              })
              
              if (quote) {
                const records: any[] = []
                
                if (quote.Deal?.id) {
                  records.push({
                    id: quote.Deal.id,
                    type: 'deal',
                    title: quote.Deal.title || 'Fırsat',
                    link: `/${locale}/deals/${quote.Deal.id}`,
                  })
                }
                
                if (quote.Invoice && Array.isArray(quote.Invoice)) {
                  quote.Invoice.forEach((i: any) => {
                    if (i?.id) {
                      records.push({
                        id: i.id,
                        type: 'invoice',
                        title: i.title || 'Fatura',
                        link: `/${locale}/invoices/${i.id}`,
                      })
                    }
                  })
                }
                
                setRelatedRecords(records)
              }
            }
          }
        } catch (fetchError: any) {
          console.error('Quote fetch network error:', fetchError?.message || fetchError)
          setRelatedRecords([])
        }
      } else if (entity === 'Invoice') {
        try {
          const res = await fetch(`/api/invoices/${entityId}`, {
            credentials: 'include',
            cache: 'no-store',
          })
          
          if (!res.ok) {
            if (res.status === 404) {
              console.warn(`Invoice ${entityId} bulunamadı`)
            } else {
              const errorText = await res.text().catch(() => '')
              console.error(`Invoice fetch error (${res.status}):`, errorText.substring(0, 200))
            }
            setRelatedRecords([])
          } else {
            const contentType = res.headers.get('content-type') || ''
            if (!contentType.includes('application/json')) {
              console.error('Invoice API JSON döndürmedi:', contentType)
              setRelatedRecords([])
            } else {
              const invoice = await res.json().catch((jsonError) => {
                console.error('Invoice JSON parse error:', jsonError)
                return null
              })
              
              if (invoice) {
                const records: any[] = []
                
                if (invoice.Quote?.id) {
                  records.push({
                    id: invoice.Quote.id,
                    type: 'quote',
                    title: invoice.Quote.title || 'Teklif',
                    link: `/${locale}/quotes/${invoice.Quote.id}`,
                  })
                }
                
                if (invoice.Deal?.id) {
                  records.push({
                    id: invoice.Deal.id,
                    type: 'deal',
                    title: invoice.Deal.title || 'Fırsat',
                    link: `/${locale}/deals/${invoice.Deal.id}`,
                  })
                }
                
                if (invoice.Shipment && Array.isArray(invoice.Shipment)) {
                  invoice.Shipment.forEach((s: any) => {
                    if (s?.id) {
                      records.push({
                        id: s.id,
                        type: 'shipment',
                        title: s.tracking || 'Sevkiyat',
                        link: `/${locale}/shipments/${s.id}`,
                      })
                    }
                  })
                }
                
                setRelatedRecords(records)
              }
            }
          }
        } catch (fetchError: any) {
          console.error('Invoice fetch network error:', fetchError?.message || fetchError)
          setRelatedRecords([])
        }
      }
      
      // ActivityLog'ları çek
      try {
        const activityRes = await fetch(`/api/activity?entity=${entity}&entityId=${entityId}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        
        if (activityRes.ok) {
          const contentType = activityRes.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const activityData = await activityRes.json().catch((jsonError) => {
              console.error('Activity JSON parse error:', jsonError)
              return []
            })
            setActivities(Array.isArray(activityData) ? activityData : [])
          } else {
            console.error('Activity API JSON döndürmedi:', contentType)
            setActivities([])
          }
        } else {
          // Activity log yoksa boş array
          setActivities([])
        }
      } catch (activityError: any) {
        console.error('Activity fetch network error:', activityError?.message || activityError)
        setActivities([])
      }
    } catch (error: any) {
      console.error('Error fetching related data:', error?.message || error)
      setRelatedRecords([])
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [entity, entityId, locale])

  useEffect(() => {
    if (open && entityId) {
      fetchRelatedData()
    }
  }, [open, entityId, fetchRelatedData])

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


































