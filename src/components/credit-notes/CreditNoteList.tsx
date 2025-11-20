'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CreditNoteForm from './CreditNoteForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { toast } from '@/lib/toast'

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

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  ISSUED: 'Düzenlendi',
  APPLIED: 'Uygulandı',
}

export default function CreditNoteList() {
  const locale = useLocale()
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

  // SWR ile veri çekme
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  if (returnOrderId) params.append('returnOrderId', returnOrderId)
  
  const apiUrl = `/api/credit-notes?${params.toString()}`
  const { data: creditNotes = [], isLoading, error, mutate: mutateCreditNotes } = useData<CreditNote[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleEdit = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, creditNoteNumber: string) => {
    if (!confirm(`${creditNoteNumber} alacak dekontunu silmek istediğinize emin misiniz?`)) {
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

      toast.success('Alacak dekontu silindi', { description: `${creditNoteNumber} başarıyla silindi.` })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    }
  }

  const handleFormClose = () => {
    setSelectedCreditNote(null)
    setFormOpen(false)
  }

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alacak Dekontları</h1>
          <p className="text-gray-500 mt-1">İade alacak dekontlarını yönetin</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCreditNote(null)
            setFormOpen(true)
          }} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Alacak Dekontu
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Dekont no, sebep ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="DRAFT">Taslak</SelectItem>
            <SelectItem value="ISSUED">Düzenlendi</SelectItem>
            <SelectItem value="APPLIED">Uygulandı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dekont No</TableHead>
              <TableHead>İade Siparişi</TableHead>
              <TableHead>Fatura</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditNotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  Alacak dekontu bulunamadı
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
                      {statusLabels[creditNote.status] || creditNote.status}
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
        onSuccess={async (savedCreditNote: CreditNote) => {
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
        }}
      />
    </div>
  )
}


