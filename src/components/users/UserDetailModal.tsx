'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { User as UserIcon, Mail, Shield, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DetailModal from '@/components/ui/DetailModal'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import { useData } from '@/hooks/useData'

interface UserDetailModalProps {
  userId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function UserDetailModal({
  userId,
  open,
  onClose,
  initialData,
}: UserDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()

  const { data: user, isLoading, error } = useData<any>(
    userId && open ? `/api/users/${userId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayUser = user || initialData

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Süper Admin',
    ADMIN: 'Admin',
    SALES: 'Satış',
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-600 text-white border-purple-700',
    ADMIN: 'bg-blue-600 text-white border-blue-700',
    SALES: 'bg-green-600 text-white border-green-700',
  }

  if (!open || !userId) return null

  if (isLoading && !initialData && !displayUser) {
    return (
      <DetailModal open={open} onClose={onClose} title="Kullanıcı Detayları" size="md">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayUser) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Kullanıcı yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayUser) {
    return (
      <DetailModal open={open} onClose={onClose} title="Kullanıcı Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Kullanıcı bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={displayUser?.name || 'Kullanıcı Detayları'}
      description="Kullanıcı Detayları"
      size="md"
    >
      <div className="space-y-6">
        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Ad Soyad</p>
                  <p className="font-medium">{displayUser?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">E-posta</p>
                  <p className="font-medium">{displayUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Rol</p>
                  <Badge className={`mt-1 ${roleColors[displayUser?.role] || 'bg-gray-600 text-white border-gray-700'}`}>
                    {roleLabels[displayUser?.role] || displayUser?.role}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                  <p className="font-medium">
                    {displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bilgiler</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-gray-600">Kullanıcı ID</p>
                <p className="font-mono text-sm mt-1">{displayUser?.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        {displayUser?.activities && displayUser.activities.length > 0 && (
          <ActivityTimeline activities={displayUser.activities} />
        )}
      </div>
    </DetailModal>
  )
}









