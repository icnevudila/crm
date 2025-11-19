'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, Mail, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/hooks/useData'
import SkeletonList from '@/components/skeletons/SkeletonList'
import UserIntegrationForm from '@/components/user-integrations/UserIntegrationForm'
import { mutate } from 'swr'

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
  createdAt: string
  updatedAt: string
  User?: {
    id: string
    name: string
    email: string
  }
  activities?: any[]
}

export default function UserIntegrationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const locale = useLocale()

  const [formOpen, setFormOpen] = useState(false)

  const { data: integration, isLoading, error, mutate: mutateIntegration } = useData<UserIntegration>(
    `/api/user-integrations/${id}`,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  const handleDelete = async () => {
    if (!confirm('Bu entegrasyonu silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const res = await fetch(`/api/user-integrations/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete integration')
      }

      router.push(`/${locale}/user-integrations`)
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'GOOGLE_CALENDAR':
      case 'MICROSOFT_CALENDAR':
        return <Calendar className="h-5 w-5" />
      case 'GOOGLE_EMAIL':
      case 'MICROSOFT_EMAIL':
        return <Mail className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getIntegrationName = (type: string) => {
    switch (type) {
      case 'GOOGLE_CALENDAR':
        return 'Google Takvim'
      case 'GOOGLE_EMAIL':
        return 'Google E-posta'
      case 'MICROSOFT_CALENDAR':
        return 'Microsoft Takvim'
      case 'MICROSOFT_EMAIL':
        return 'Microsoft E-posta'
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Aktif</Badge>
      case 'ERROR':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Hata</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary">Pasif</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) return <SkeletonList />
  if (error) return <div className="p-6 text-red-600">Hata: {error.message}</div>
  if (!integration) return <div className="p-6">Entegrasyon bulunamadı</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/${locale}/user-integrations`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div className="flex items-center gap-2">
            {getIntegrationIcon(integration.integrationType)}
            <h1 className="text-2xl font-bold">{getIntegrationName(integration.integrationType)}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel Bilgiler</CardTitle>
            <CardDescription>Entegrasyon temel bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Entegrasyon Tipi</label>
              <p className="mt-1">{getIntegrationName(integration.integrationType)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Durum</label>
              <div className="mt-1">{getStatusBadge(integration.status)}</div>
            </div>
            {integration.User && (
              <div>
                <label className="text-sm font-medium text-gray-500">Kullanıcı</label>
                <p className="mt-1">{integration.User.name}</p>
                <p className="text-sm text-gray-500">{integration.User.email}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
              <p className="mt-1">{new Date(integration.createdAt).toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Son Güncelleme</label>
              <p className="mt-1">{new Date(integration.updatedAt).toLocaleString('tr-TR')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Bilgileri</CardTitle>
            <CardDescription>OAuth token detayları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Access Token</label>
              <p className="mt-1 font-mono text-xs break-all">
                {integration.accessToken ? '••••••••••••••••' : <span className="text-gray-400">Yok</span>}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Refresh Token</label>
              <p className="mt-1 font-mono text-xs break-all">
                {integration.refreshToken ? '••••••••••••••••' : <span className="text-gray-400">Yok</span>}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Token Geçerlilik Tarihi</label>
              <p className="mt-1">
                {integration.tokenExpiresAt 
                  ? new Date(integration.tokenExpiresAt).toLocaleString('tr-TR')
                  : <span className="text-gray-400">Belirtilmemiş</span>}
              </p>
            </div>
            {integration.lastError && (
              <div>
                <label className="text-sm font-medium text-red-600">Son Hata</label>
                <p className="mt-1 text-red-600">{integration.lastError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      {integration.activities && integration.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Etkinlik Geçmişi</CardTitle>
            <CardDescription>Entegrasyon ile ilgili tüm işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {integration.activities.map((activity: any, index: number) => (
                <div key={index} className="border-b pb-2">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <UserIntegrationForm
        integration={integration}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedIntegration: UserIntegration) => {
          await mutateIntegration(savedIntegration, { revalidate: false })
          await mutate(`/api/user-integrations/${id}`, savedIntegration, { revalidate: false })
          setFormOpen(false)
        }}
      />
    </div>
  )
}





