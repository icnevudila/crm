'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const userIntegrationSchema = z.object({
  integrationType: z.enum(['GOOGLE_CALENDAR', 'GOOGLE_EMAIL', 'MICROSOFT_CALENDAR', 'MICROSOFT_EMAIL'], {
    required_error: 'Entegrasyon tipi seçilmelidir',
  }),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).default('INACTIVE'),
  lastError: z.string().optional().nullable(),
})

type UserIntegrationFormData = z.infer<typeof userIntegrationSchema>

interface UserIntegration {
  id: string
  userId: string
  companyId: string
  integrationType: string
  accessToken?: string | null
  refreshToken?: string | null
  tokenExpiresAt?: string | null
  status: string
  lastError?: string | null
}

interface UserIntegrationFormProps {
  integration?: UserIntegration
  open: boolean
  onClose: () => void
  onSuccess?: (savedIntegration: UserIntegration) => void
}

export default function UserIntegrationForm({
  integration,
  open,
  onClose,
  onSuccess,
}: UserIntegrationFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserIntegrationFormData>({
    resolver: zodResolver(userIntegrationSchema),
    defaultValues: {
      integrationType: 'GOOGLE_CALENDAR',
      status: 'INACTIVE',
      accessToken: '',
      refreshToken: '',
      tokenExpiresAt: null,
      lastError: null,
    },
  })

  const integrationType = watch('integrationType')

  // Form'u integration prop'una göre doldur
  useEffect(() => {
    if (open) {
      if (integration) {
        // Düzenleme modu
        reset({
          integrationType: integration.integrationType as any,
          status: integration.status as any,
          accessToken: integration.accessToken || '',
          refreshToken: integration.refreshToken || '',
          tokenExpiresAt: integration.tokenExpiresAt || null,
          lastError: integration.lastError || null,
        })
      } else {
        // Yeni kayıt modu
        reset({
          integrationType: 'GOOGLE_CALENDAR',
          status: 'INACTIVE',
          accessToken: '',
          refreshToken: '',
          tokenExpiresAt: null,
          lastError: null,
        })
      }
    }
  }, [integration, open, reset])

  const onSubmit = async (data: UserIntegrationFormData) => {
    setLoading(true)
    try {
      const url = integration
        ? `/api/user-integrations/${integration.id}`
        : '/api/user-integrations'
      const method = integration ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tokenExpiresAt: data.tokenExpiresAt || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save integration')
      }

      const savedIntegration = await res.json()
      
      if (onSuccess) {
        onSuccess(savedIntegration)
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {integration ? 'Entegrasyon Düzenle' : 'Yeni Entegrasyon Ekle'}
          </DialogTitle>
          <DialogDescription>
            Kullanıcı entegrasyonu ekleyin veya düzenleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Integration Type */}
          <div className="space-y-2">
            <Label htmlFor="integrationType">Entegrasyon Tipi *</Label>
            <Select
              value={integrationType}
              onValueChange={(value) => setValue('integrationType', value as any)}
              disabled={!!integration} // Mevcut entegrasyonlarda değiştirilemez
            >
              <SelectTrigger>
                <SelectValue placeholder="Entegrasyon tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOGLE_CALENDAR">Google Takvim</SelectItem>
                <SelectItem value="GOOGLE_EMAIL">Google E-posta</SelectItem>
                <SelectItem value="MICROSOFT_CALENDAR">Microsoft Takvim</SelectItem>
                <SelectItem value="MICROSOFT_EMAIL">Microsoft E-posta</SelectItem>
              </SelectContent>
            </Select>
            {errors.integrationType && (
              <p className="text-sm text-red-600">{errors.integrationType.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Durum *</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Pasif</SelectItem>
                <SelectItem value="ERROR">Hata</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              {...register('accessToken')}
              placeholder="Access token girin"
            />
            {errors.accessToken && (
              <p className="text-sm text-red-600">{errors.accessToken.message}</p>
            )}
          </div>

          {/* Refresh Token */}
          <div className="space-y-2">
            <Label htmlFor="refreshToken">Refresh Token</Label>
            <Input
              id="refreshToken"
              type="password"
              {...register('refreshToken')}
              placeholder="Refresh token girin"
            />
            {errors.refreshToken && (
              <p className="text-sm text-red-600">{errors.refreshToken.message}</p>
            )}
          </div>

          {/* Token Expires At */}
          <div className="space-y-2">
            <Label htmlFor="tokenExpiresAt">Token Geçerlilik Tarihi</Label>
            <Input
              id="tokenExpiresAt"
              type="datetime-local"
              {...register('tokenExpiresAt')}
            />
            {errors.tokenExpiresAt && (
              <p className="text-sm text-red-600">{errors.tokenExpiresAt.message}</p>
            )}
          </div>

          {/* Last Error */}
          <div className="space-y-2">
            <Label htmlFor="lastError">Son Hata Mesajı</Label>
            <Input
              id="lastError"
              {...register('lastError')}
              placeholder="Hata mesajı (varsa)"
            />
            {errors.lastError && (
              <p className="text-sm text-red-600">{errors.lastError.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : integration ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}





