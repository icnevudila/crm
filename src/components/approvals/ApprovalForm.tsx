'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const approvalSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  description: z.string().optional(),
  relatedTo: z.string().min(1, 'Modül seçmelisiniz'),
  relatedId: z.string().min(1, 'Kayıt ID gereklidir'),
  approverIds: z.array(z.string()).min(1, 'En az bir onaylayıcı seçmelisiniz'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
})

type ApprovalFormData = z.infer<typeof approvalSchema>

interface ApprovalFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ApprovalForm({
  open,
  onClose,
  onSuccess,
}: ApprovalFormProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [recordOptions, setRecordOptions] = useState<Array<{ id: string; label: string }>>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      title: '',
      description: '',
      relatedTo: '',
      relatedId: '',
      approverIds: [],
      priority: 'NORMAL',
    },
  })

  const loadRecords = useCallback(async (module: string, searchTerm = '') => {
    try {
      setRecordsLoading(true)
      setRecordError(null)
      const params = new URLSearchParams({ type: module })
      if (searchTerm) {
        params.set('search', searchTerm)
      }
      const res = await fetch(`/api/approvals/records?${params.toString()}`)
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || 'Kayıtlar yüklenemedi')
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setRecordOptions(data)
      } else {
        setRecordOptions([])
      }
    } catch (error: any) {
      console.error('Record fetch error:', error)
      setRecordOptions([])
      setRecordError(error?.message || 'Kayıtlar yüklenemedi')
    } finally {
      setRecordsLoading(false)
    }
  }, [])

  // Load users when form opens
  useEffect(() => {
    if (open) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load users:', err))
      // Modül seçimine bağlı kayıtları sıfırla
      const currentRelatedTo = watch('relatedTo')
      if (currentRelatedTo) {
        void loadRecords(currentRelatedTo)
      }
    }
  }, [open, watch, loadRecords])

  // Update form when approvers change
  useEffect(() => {
    setValue('approverIds', selectedApprovers)
  }, [selectedApprovers, setValue])

  const toggleApprover = (userId: string) => {
    setSelectedApprovers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const onSubmit = async (data: ApprovalFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create approval request')
      }

      if (onSuccess) {
        onSuccess()
      }

      reset()
      setSelectedApprovers([])
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Onay talebi oluşturulamadı', error?.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedApprovers([])
    onClose()
  }

  const relatedTo = watch('relatedTo')
  useEffect(() => {
    if (!relatedTo) {
      setRecordOptions([])
      setValue('relatedId', '')
      return
    }
    setValue('relatedId', '')
    void loadRecords(relatedTo)
  }, [relatedTo, loadRecords, setValue])

  const relatedIdValue = watch('relatedId')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Onay Talebi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Örn: Büyük Teklif Onayı"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Onay talebinin detaylarını yazın..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Module */}
          <div className="space-y-2">
            <Label htmlFor="relatedTo">İlgili Modül *</Label>
            <Select
              value={watch('relatedTo')}
              onValueChange={(value) => setValue('relatedTo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Modül seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Quote">Teklif</SelectItem>
                <SelectItem value="Deal">Fırsat</SelectItem>
                <SelectItem value="Invoice">Fatura</SelectItem>
                <SelectItem value="Contract">Sözleşme</SelectItem>
                <SelectItem value="Document">Döküman</SelectItem>
              </SelectContent>
            </Select>
            {errors.relatedTo && (
              <p className="text-sm text-red-600">{errors.relatedTo.message}</p>
            )}
          </div>

          {/* Record ID */}
          <div className="space-y-2">
            <Label htmlFor="relatedId">Kayıt ID *</Label>
            {relatedTo ? (
              <>
                <Select
                  value={relatedIdValue || ''}
                  onValueChange={(value) => setValue('relatedId', value)}
                  disabled={recordsLoading || recordOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        recordsLoading
                          ? 'Kayıtlar yükleniyor...'
                          : recordOptions.length > 0
                            ? 'Kayıt seçin'
                            : 'Kayıt bulunamadı'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {recordOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                    {!recordsLoading && recordOptions.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        Kayıt bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  id="relatedId"
                  {...register('relatedId')}
                  placeholder="Ya da ID girin (UUID formatında)"
                  className="mt-2"
                />
                {recordError && (
                  <p className="text-xs text-red-500">{recordError}</p>
                )}
              </>
            ) : (
              <>
                <Input
                  id="relatedId"
                  {...register('relatedId')}
                  placeholder="Önce ilgili modülü seçin"
                  disabled
                />
              </>
            )}
            {errors.relatedId && (
              <p className="text-sm text-red-600">{errors.relatedId.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Kayıt listesinde bulamazsanız ID&apos;yi manuel olarak girebilirsiniz.
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Öncelik</Label>
            <Select
              value={watch('priority')}
              onValueChange={(value) => setValue('priority', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Düşük</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">Yüksek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approvers */}
          <div className="space-y-2">
            <Label>Onaylayıcılar *</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">Kullanıcılar yükleniyor...</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedApprovers.includes(user.id)}
                      onCheckedChange={() => toggleApprover(user.id)}
                    />
                    <label
                      htmlFor={user.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {user.name}
                    </label>
                  </div>
                ))
              )}
            </div>
            {errors.approverIds && (
              <p className="text-sm text-red-600">{errors.approverIds.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {selectedApprovers.length} kişi seçildi
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Gönderiliyor...' : 'Onay Talebi Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
