'use client'

import { useState, useEffect } from 'react'
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

  // Load users when form opens
  useEffect(() => {
    if (open) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load users:', err))
    }
  }, [open])

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
            <Input
              id="relatedId"
              {...register('relatedId')}
              placeholder="UUID formatında kayıt ID"
            />
            {errors.relatedId && (
              <p className="text-sm text-red-600">{errors.relatedId.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Onaylanacak kaydın ID&apos;sini girin
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
