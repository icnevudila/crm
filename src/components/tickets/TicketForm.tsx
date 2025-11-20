'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ticket, Customer, User } from '@/types/crm'

interface TicketFormProps {
  ticket?: Ticket
  open: boolean
  onClose: () => void
  onSuccess?: (savedTicket: Ticket) => void | Promise<void>
}

async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/customers?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch customers')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.customers || [])
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export default function TicketForm({ ticket, open, onClose, onSuccess }: TicketFormProps) {
  const t = useTranslations('tickets.form')
  const tCommon = useTranslations('common.form')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  // Schema'yı component içinde oluştur - locale desteği için
  const ticketSchema = z.object({
    subject: z.string().min(1, t('subjectRequired')).max(200, t('subjectMaxLength')),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']).default('OPEN'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    customerId: z.string().min(1, 'Müşteri seçimi zorunludur'),
    assignedTo: z.string().optional(),
    description: z.string().max(2000, t('descriptionMaxLength')).optional(),
  })

  type TicketFormData = z.infer<typeof ticketSchema>

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    enabled: open,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: open,
  })

  // Güvenlik kontrolü - customers her zaman array olmalı
  const customers = Array.isArray(customersData) ? customersData : []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerId: '',
      assignedTo: '',
      description: '',
    },
  })

  const status = watch('status')
  const priority = watch('priority')
  const customerId = watch('customerId')
  const assignedTo = watch('assignedTo')

  // Ticket prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (ticket) {
        // Düzenleme modu - ticket bilgilerini yükle
        reset({
          subject: ticket.subject || '',
          status: ticket.status || 'OPEN',
          priority: ticket.priority || 'MEDIUM',
          customerId: ticket.customerId || '',
          assignedTo: ticket.assignedTo || '',
          description: ticket.description || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          subject: '',
          status: 'OPEN',
          priority: 'MEDIUM',
          customerId: '',
          assignedTo: '',
          description: '',
        })
      }
    }
  }, [ticket, open, reset])

  const mutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const url = ticket ? `/api/tickets/${ticket.id}` : '/api/tickets'
      const method = ticket ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save ticket')
      }

      return res.json()
    },
    onSuccess: (savedTicket) => {
      // Toast mesajı göster
      if (ticket) {
        toast.success(t('ticketUpdated'), { description: t('ticketUpdatedMessage', { subject: savedTicket.subject }) })
      } else {
        // Yeni ticket oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('ticket', savedTicket.id, savedTicket.subject)
      }

      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedTicket)
      }
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: TicketFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(t('saveFailed'), { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ticket ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {ticket ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('subjectLabel')} *</label>
              <Input
                {...register('subject')}
                placeholder={t('subjectPlaceholder')}
                disabled={loading}
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('customerLabel')} *</label>
              <Select
                value={customerId || ''}
                onValueChange={(value) => setValue('customerId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('customerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-600">{errors.customerId.message}</p>
              )}
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('assignedToLabel')}</label>
              <Select
                value={assignedTo || 'none'}
                onValueChange={(value) => setValue('assignedTo', value === 'none' ? '' : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('assignedToPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('assignedToNone')}</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('statusLabel')}</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as TicketFormData['status'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">{t('statusOpen')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('statusInProgress')}</SelectItem>
                  <SelectItem value="RESOLVED">{t('statusResolved')}</SelectItem>
                  <SelectItem value="CLOSED">{t('statusClosed')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('priorityLabel')}</label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setValue('priority', value as TicketFormData['priority'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">{t('priorityLow')}</SelectItem>
                  <SelectItem value="MEDIUM">{t('priorityMedium')}</SelectItem>
                  <SelectItem value="HIGH">{t('priorityHigh')}</SelectItem>
                  <SelectItem value="URGENT">{t('priorityUrgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('descriptionLabel')}</label>
              <Textarea
                {...register('description')}
                placeholder={t('descriptionPlaceholder')}
                rows={5}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? t('saving') : ticket ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
