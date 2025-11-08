'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, User as UserIcon, Mail, Shield, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  activities?: any[]
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Kullanıcı bulunamadı</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/users`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Süper Admin',
    ADMIN: 'Admin',
    SALES: 'Satış',
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    SALES: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/users`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserIcon className="h-8 w-8" />
              {user.name}
            </h1>
            <p className="mt-1 text-gray-600">Kullanıcı Detayları</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Kullanıcı Bilgileri</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Ad Soyad</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">E-posta</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <Badge className={`mt-1 ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Kullanıcı ID</p>
              <p className="font-mono text-sm mt-1">{user.id}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      {user.activities && user.activities.length > 0 && (
        <ActivityTimeline activities={user.activities} />
      )}
    </div>
  )
}







