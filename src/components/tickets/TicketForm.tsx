'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

const ticketSchema = z.object({
  subject: z.string().min(1, 'Konu gereklidir'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  customerId: z.string().optional(),
  description: z.string().optional(),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface TicketFormProps {
  ticket?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedTicket: any) => void | Promise<void>
}

async function fetchCustomers() {
  const res = await fetch('/api/customers?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch customers')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.customers || [])
}

export default function TicketForm({ ticket, open, onClose, onSuccess }: TicketFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
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
    defaultValues: ticket || {
      subject: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerId: '',
      description: '',
    },
  })

  const status = watch('status')
  const priority = watch('priority')
  const customerId = watch('customerId')

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
          description: ticket.description || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          subject: '',
          status: 'OPEN',
          priority: 'MEDIUM',
          customerId: '',
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
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ticket ? 'Destek Talebi Düzenle' : 'Yeni Destek Talebi'}
          </DialogTitle>
          <DialogDescription>
            {ticket ? 'Destek talebi bilgilerini güncelleyin' : 'Yeni destek talebi oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Konu *</label>
              <Input
                {...register('subject')}
                placeholder="Destek talebi konusu"
                disabled={loading}
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Müşteri</label>
              <Select
                value={customerId || ''}
                onValueChange={(value) => setValue('customerId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
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
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                  <SelectItem value="CLOSED">Kapatıldı</SelectItem>
                  <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Öncelik</label>
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
                  <SelectItem value="LOW">Düşük</SelectItem>
                  <SelectItem value="MEDIUM">Orta</SelectItem>
                  <SelectItem value="HIGH">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Destek talebi açıklaması ve detaylar"
                rows={5}
                disabled={loading}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : ticket ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
