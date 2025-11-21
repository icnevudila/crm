'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PaymentPlanForm from './PaymentPlanForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
import { useTranslations } from 'next-intl'

interface PaymentPlan {
  id: string
  name: string
  invoiceId?: string
  customerId?: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  installmentCount: number
  installmentFrequency: string
  status: string
  invoice?: { id: string; invoiceNumber?: string; title?: string }
  customer?: { id: string; name?: string; email?: string }
  installments?: Array<{
    id: string
    installmentNumber: number
    amount: number
    dueDate: string
    status: string
    paidAt?: string
  }>
  createdAt: string
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  COMPLETED: 'Tamamlandı',
  DEFAULTED: 'Vadesi Geçti',
  CANCELLED: 'İptal Edildi',
}

const frequencyLabels: Record<string, string> = {
  WEEKLY: 'Haftalık',
  MONTHLY: 'Aylık',
  QUARTERLY: 'Çeyreklik',
}

export default function PaymentPlanList() {
  const locale = useLocale()
  const t = useTranslations('paymentPlans')
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // URL'den invoiceId parametresini oku
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const invoiceIdParam = params.get('invoiceId')
      if (invoiceIdParam) {
        setInvoiceId(invoiceIdParam)
      }
    }
  }, [])

  // SWR ile veri çekme
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  if (invoiceId) params.append('invoiceId', invoiceId)
  
  const apiUrl = `/api/payment-plans?${params.toString()}`
  const { data: plans = [], isLoading, error, mutate: mutatePlans } = useData<PaymentPlan[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleEdit = (plan: PaymentPlan) => {
    setSelectedPlan(plan)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Ödeme Planını Sil?',
      description: `${name} ödeme planını silmek istediğinize emin misiniz?`,
      confirmLabel: 'Sil',
      cancelLabel: 'İptal',
      variant: 'destructive'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const res = await fetch(`/api/payment-plans/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete plan')
      }
      
      // Optimistic update
      const updatedPlans = plans.filter((item) => item.id !== id)
      await mutatePlans(updatedPlans, { revalidate: false })
      
      await Promise.all([
        mutate('/api/payment-plans', updatedPlans, { revalidate: false }),
        mutate('/api/payment-plans?', updatedPlans, { revalidate: false }),
        mutate(apiUrl, updatedPlans, { revalidate: false }),
      ])

      toast.success('Ödeme planı silindi')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error?.message || t('deleteFailed'))
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedPlan(null)
  }

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Veriler yüklenirken bir hata oluştu.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedPlan(null)
            setFormOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('newPlan')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{statusLabels.ACTIVE}</SelectItem>
            <SelectItem value="COMPLETED">{statusLabels.COMPLETED}</SelectItem>
            <SelectItem value="DEFAULTED">{statusLabels.DEFAULTED}</SelectItem>
            <SelectItem value="CANCELLED">{statusLabels.CANCELLED}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('noPlansFound')}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.name')}</TableHead>
                <TableHead>{t('tableHeaders.invoice')}</TableHead>
                <TableHead>{t('tableHeaders.customer')}</TableHead>
                <TableHead>{t('tableHeaders.totalAmount')}</TableHead>
                <TableHead>{t('tableHeaders.paidAmount')}</TableHead>
                <TableHead>{t('tableHeaders.remainingAmount')}</TableHead>
                <TableHead>{t('tableHeaders.installmentCount')}</TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {plan.invoice ? (
                      <Link
                        href={`/${locale}/invoices/${plan.invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {plan.invoice.invoiceNumber || plan.invoice.title || 'Fatura'}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.customer ? (
                      <Link
                        href={`/${locale}/customers/${plan.customer.id}`}
                        className="text-primary hover:underline"
                      >
                        {plan.customer.name || 'Müşteri'}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(plan.totalAmount)}</TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(plan.paidAmount)}
                  </TableCell>
                  <TableCell className="text-orange-600">
                    {formatCurrency(plan.remainingAmount)}
                  </TableCell>
                  <TableCell>
                    {plan.installmentCount} {frequencyLabels[plan.installmentFrequency] || plan.installmentFrequency}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(plan.status)}>
                      {statusLabels[plan.status] || plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/payment-plans/${plan.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id, plan.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <PaymentPlanForm
        plan={selectedPlan || undefined}
        open={formOpen}
        onClose={handleFormClose}
        invoiceId={invoiceId || undefined}
        onSuccess={async (savedPlan: PaymentPlan) => {
          let updatedPlans: PaymentPlan[]
          
          if (selectedPlan) {
            updatedPlans = plans.map((item) =>
              item.id === savedPlan.id ? savedPlan : item
            )
          } else {
            updatedPlans = [savedPlan, ...plans]
          }
          
          await mutatePlans(updatedPlans, { revalidate: false })
          
          await Promise.all([
            mutate('/api/payment-plans', updatedPlans, { revalidate: false }),
            mutate('/api/payment-plans?', updatedPlans, { revalidate: false }),
            mutate(apiUrl, updatedPlans, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}

