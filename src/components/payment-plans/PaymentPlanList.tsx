'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Edit, Trash2, Eye, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PaymentPlanForm from './PaymentPlanForm'
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

  // API URL'ini memoize et
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (invoiceId) params.append('invoiceId', invoiceId)
    return `/api/payment-plans?${params.toString()}`
  }, [debouncedSearch, status, invoiceId])

  const { data: plans = [], isLoading, error, mutate: mutatePlans } = useData<PaymentPlan[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    refreshInterval: 0, // Auto refresh YOK
  })

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutatePlans(undefined, { revalidate: true }),
      mutate('/api/payment-plans', undefined, { revalidate: true }),
      mutate('/api/payment-plans?', undefined, { revalidate: true }),
    ])
  }, [mutatePlans])

  const handleEdit = (plan: PaymentPlan) => {
    setSelectedPlan(plan)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: t('deleteConfirm', { name, defaultMessage: 'Ödeme Planını Sil?' }),
      description: t('deleteConfirm', { name, defaultMessage: `${name} ödeme planını silmek istediğinize emin misiniz?` }),
      confirmLabel: t('delete', { defaultMessage: 'Sil' }),
      cancelLabel: t('cancel', { defaultMessage: 'İptal' }),
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

      toast.success(t('deleteSuccess', { defaultMessage: 'Ödeme planı silindi' }))
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error?.message || t('deleteFailed', { defaultMessage: 'Silme işlemi başarısız' }))
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedPlan(null)
  }

  // onSuccess callback'ini memoize et - component'in en üst seviyesinde
  const handleFormSuccess = useCallback(async (savedPlan: PaymentPlan) => {
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
  }, [selectedPlan, plans, mutatePlans, apiUrl])

  // Otomasyon bilgilerini memoize et
  const automations = useMemo(() => [
    {
      action: t('automationInstallmentDue', { defaultMessage: 'Taksit vadesi geldiğinde' }),
      result: t('automationInstallmentDueResult', { defaultMessage: 'Otomatik bildirim gönderilir' }),
      details: [
        t('automationInstallmentDueDetails1', { defaultMessage: 'Müşteriye ödeme hatırlatması gönderilir' }),
        t('automationInstallmentDueDetails2', { defaultMessage: 'Admin/Sales rollere bildirim gönderilir' }),
      ],
    },
    {
      action: t('automationOverdue', { defaultMessage: 'Taksit vadesi geçtiğinde' }),
      result: t('automationOverdueResult', { defaultMessage: 'Otomatik uyarı gönderilir' }),
      details: [
        t('automationOverdueDetails1', { defaultMessage: 'Plan durumu "Vadesi Geçti" olarak güncellenir' }),
        t('automationOverdueDetails2', { defaultMessage: 'Yöneticilere acil bildirim gönderilir' }),
      ],
    },
  ], [t])

  // Stats URL'ini memoize et
  const statsUrl = useMemo(() => '/api/stats/payment-plans', [])

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        {t('errorLoading', { defaultMessage: 'Veriler yüklenirken bir hata oluştu.' })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="payment-plans" statsUrl={statsUrl} />

      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle', { defaultMessage: 'Ödeme Planları Otomasyonları' })}
        automations={automations}
      />

      {/* Filtreler ve Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1">
            <Input
              placeholder={t('searchPlaceholder', { defaultMessage: 'Plan adı ara...' })}
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
              <SelectItem value="ACTIVE">{t('statusActive', { defaultMessage: 'Aktif' })}</SelectItem>
              <SelectItem value="COMPLETED">{t('statusCompleted', { defaultMessage: 'Tamamlandı' })}</SelectItem>
              <SelectItem value="DEFAULTED">{t('statusDefaulted', { defaultMessage: 'Vadesi Geçti' })}</SelectItem>
              <SelectItem value="CANCELLED">{t('statusCancelled', { defaultMessage: 'İptal Edildi' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefresh} />
          <Button
            onClick={() => {
              setSelectedPlan(null)
              setFormOpen(true)
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newPlan', { defaultMessage: 'Yeni Plan' })}
          </Button>
        </div>
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
                    {plan.installmentCount} {plan.installmentFrequency === 'WEEKLY' ? t('frequencyWeekly', { defaultMessage: 'Haftalık' }) :
                     plan.installmentFrequency === 'MONTHLY' ? t('frequencyMonthly', { defaultMessage: 'Aylık' }) :
                     plan.installmentFrequency === 'QUARTERLY' ? t('frequencyQuarterly', { defaultMessage: 'Çeyreklik' }) :
                     plan.installmentFrequency}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(plan.status)}>
                      {plan.status === 'ACTIVE' ? t('statusActive', { defaultMessage: 'Aktif' }) :
                       plan.status === 'COMPLETED' ? t('statusCompleted', { defaultMessage: 'Tamamlandı' }) :
                       plan.status === 'DEFAULTED' ? t('statusDefaulted', { defaultMessage: 'Vadesi Geçti' }) :
                       plan.status === 'CANCELLED' ? t('statusCancelled', { defaultMessage: 'İptal Edildi' }) :
                       plan.status}
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
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}

