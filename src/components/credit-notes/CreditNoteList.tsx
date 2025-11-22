'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CreditNoteForm from './CreditNoteForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import RefreshButton from '@/components/ui/RefreshButton'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'

interface CreditNote {
  id: string
  creditNoteNumber: string
  returnOrderId?: string
  invoiceId?: string
  customerId?: string
  amount: number
  reason?: string
  status: string
  returnOrder?: { id: string; returnNumber?: string; status?: string }
  invoice?: { id: string; invoiceNumber?: string; title?: string }
  customer?: { id: string; name?: string; email?: string }
  createdAt: string
}

export default function CreditNoteList() {
  const locale = useLocale()
  const t = useTranslations('creditNotes')
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null)
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null) // Return Order'dan geliyorsa

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // URL'den returnOrderId parametresini oku
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const returnOrderIdParam = params.get('returnOrderId')
      if (returnOrderIdParam) {
        setReturnOrderId(returnOrderIdParam)
      }
    }
  }, [])

  // API URL'ini memoize et
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (returnOrderId) params.append('returnOrderId', returnOrderId)
    return `/api/credit-notes?${params.toString()}`
  }, [debouncedSearch, status, returnOrderId])

  const { data: creditNotes = [], isLoading, error, mutate: mutateCreditNotes } = useData<CreditNote[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    refreshInterval: 0, // Auto refresh YOK
  })

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutateCreditNotes(undefined, { revalidate: true }),
      mutate('/api/credit-notes', undefined, { revalidate: true }),
      mutate('/api/credit-notes?', undefined, { revalidate: true }),
    ])
  }, [mutateCreditNotes])

  const handleEdit = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, creditNoteNumber: string) => {
    const confirmed = await confirm({
      title: t('deleteConfirm', { creditNoteNumber, defaultMessage: 'Alacak Dekontunu Sil?' }),
      description: t('deleteConfirm', { creditNoteNumber, defaultMessage: `${creditNoteNumber} alacak dekontunu silmek istediğinize emin misiniz?` }),
      confirmLabel: t('delete', { defaultMessage: 'Sil' }),
      cancelLabel: t('cancel', { defaultMessage: 'İptal' }),
      variant: 'destructive'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const res = await fetch(`/api/credit-notes/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete credit note')
      }
      
      // Optimistic update
      const updatedCreditNotes = creditNotes.filter((item) => item.id !== id)
      
      await mutateCreditNotes(updatedCreditNotes, { revalidate: false })
      
      await Promise.all([
        mutate('/api/credit-notes', updatedCreditNotes, { revalidate: false }),
        mutate('/api/credit-notes?', updatedCreditNotes, { revalidate: false }),
        mutate(apiUrl, updatedCreditNotes, { revalidate: false }),
      ])

      toast.success(t('deleteSuccess', { defaultMessage: 'Alacak dekontu silindi' }), { 
        description: t('deleteSuccessMessage', { creditNoteNumber, defaultMessage: `${creditNoteNumber} başarıyla silindi.` })
      })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('deleteFailed', { defaultMessage: 'Silme işlemi başarısız' }), { 
        description: error?.message || t('unknownError', { defaultMessage: 'Bir hata oluştu' })
      })
    }
  }

  const handleFormClose = () => {
    setSelectedCreditNote(null)
    setFormOpen(false)
  }

  // onSuccess callback'ini memoize et - component'in en üst seviyesinde
  const handleFormSuccess = useCallback(async (savedCreditNote: CreditNote) => {
    let updatedCreditNotes: CreditNote[]
    
    if (selectedCreditNote) {
      updatedCreditNotes = creditNotes.map((item) =>
        item.id === savedCreditNote.id ? savedCreditNote : item
      )
    } else {
      updatedCreditNotes = [savedCreditNote, ...creditNotes]
    }
    
    await mutateCreditNotes(updatedCreditNotes, { revalidate: false })
    
    await Promise.all([
      mutate('/api/credit-notes', updatedCreditNotes, { revalidate: false }),
      mutate('/api/credit-notes?', updatedCreditNotes, { revalidate: false }),
      mutate(apiUrl, updatedCreditNotes, { revalidate: false }),
    ])
  }, [selectedCreditNote, creditNotes, mutateCreditNotes, apiUrl])

  // Otomasyon bilgilerini memoize et
  const automations = useMemo(() => [
    {
      action: t('automationIssued', { defaultMessage: 'Alacak dekontu "Issued" olduğunda' }),
      result: t('automationIssuedResult', { defaultMessage: 'Finance kaydı otomatik oluşturulur' }),
      details: [
        t('automationIssuedDetails1', { defaultMessage: 'EXPENSE tipinde finans kaydı oluşturulur' }),
        t('automationIssuedDetails2', { defaultMessage: 'İade tutarı finans sistemine yansır' }),
      ],
    },
    {
      action: t('automationApplied', { defaultMessage: 'Alacak dekontu "Applied" olduğunda' }),
      result: t('automationAppliedResult', { defaultMessage: 'Fatura ile eşleştirilir' }),
      details: [
        t('automationAppliedDetails1', { defaultMessage: 'İlgili faturaya uygulanır' }),
        t('automationAppliedDetails2', { defaultMessage: 'Fatura bakiyesi güncellenir' }),
      ],
    },
  ], [t])

  // Stats URL'ini memoize et
  const statsUrl = useMemo(() => '/api/stats/credit-notes', [])

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="credit-notes" statsUrl={statsUrl} />

      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle', { defaultMessage: 'Alacak Dekontları Otomasyonları' })}
        automations={automations}
      />

      {/* Filtreler ve Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1">
            <Input
              placeholder={t('searchPlaceholder', { defaultMessage: 'Dekont no ara...' })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('selectStatus', { defaultMessage: 'Durum' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses', { defaultMessage: 'Tüm Durumlar' })}</SelectItem>
              <SelectItem value="DRAFT">{t('statusDraft', { defaultMessage: 'Taslak' })}</SelectItem>
              <SelectItem value="ISSUED">{t('statusIssued', { defaultMessage: 'Düzenlendi' })}</SelectItem>
              <SelectItem value="APPLIED">{t('statusApplied', { defaultMessage: 'Uygulandı' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefresh} />
          <Button 
            onClick={() => {
              setSelectedCreditNote(null)
              setFormOpen(true)
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newCreditNote', { defaultMessage: 'Yeni Alacak Dekontu' })}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.creditNoteNumber', { defaultMessage: 'Dekont No' })}</TableHead>
              <TableHead>{t('tableHeaders.returnOrder', { defaultMessage: 'İade Siparişi' })}</TableHead>
              <TableHead>{t('tableHeaders.invoice', { defaultMessage: 'Fatura' })}</TableHead>
              <TableHead>{t('tableHeaders.customer', { defaultMessage: 'Müşteri' })}</TableHead>
              <TableHead>{t('tableHeaders.status', { defaultMessage: 'Durum' })}</TableHead>
              <TableHead>{t('tableHeaders.amount', { defaultMessage: 'Tutar' })}</TableHead>
              <TableHead>{t('tableHeaders.issueDate', { defaultMessage: 'Oluşturulma' })}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions', { defaultMessage: 'İşlemler' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditNotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  {t('noCreditNotesFound', { defaultMessage: 'Alacak dekontu bulunamadı' })}
                </TableCell>
              </TableRow>
            ) : (
              creditNotes.map((creditNote) => (
                <TableRow key={creditNote.id}>
                  <TableCell>
                    <div className="font-medium">{creditNote.creditNoteNumber}</div>
                  </TableCell>
                  <TableCell>
                    {creditNote.returnOrder ? (
                      <Link 
                        href={`/${locale}/return-orders/${creditNote.returnOrder.id}`}
                        className="text-indigo-600 hover:underline"
                        prefetch={true}
                      >
                        {creditNote.returnOrder.returnNumber || 'N/A'}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {creditNote.invoice ? (
                      <Link 
                        href={`/${locale}/invoices/${creditNote.invoice.id}`}
                        className="text-indigo-600 hover:underline"
                        prefetch={true}
                      >
                        {creditNote.invoice.invoiceNumber || creditNote.invoice.title || 'N/A'}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {creditNote.customer?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(creditNote.status)}>
                      {creditNote.status === 'DRAFT' ? t('statusDraft', { defaultMessage: 'Taslak' }) :
                       creditNote.status === 'ISSUED' ? t('statusIssued', { defaultMessage: 'Düzenlendi' }) :
                       creditNote.status === 'APPLIED' ? t('statusApplied', { defaultMessage: 'Uygulandı' }) :
                       creditNote.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(creditNote.amount || 0)}
                  </TableCell>
                  <TableCell>
                    {new Date(creditNote.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/credit-notes/${creditNote.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(creditNote)}
                        disabled={creditNote.status === 'APPLIED'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(creditNote.id, creditNote.creditNoteNumber)}
                        className="text-red-600 hover:text-red-700"
                        disabled={creditNote.status === 'APPLIED'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <CreditNoteForm
        creditNote={selectedCreditNote || undefined}
        open={formOpen}
        onClose={handleFormClose}
        returnOrderId={returnOrderId || undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}


