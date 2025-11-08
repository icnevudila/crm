'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Mail,
  Shield,
  Building2,
  Calendar,
  Save,
  Camera,
  Loader2,
  Monitor,
  Globe,
  Smartphone,
  HardDrive,
  Cpu,
  Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Zod schema - form validasyonu
const profileSchema = z.object({
  name: z.string().min(1, 'Ad soyad gereklidir').max(255, 'Ad soyad çok uzun'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string().min(6, 'Şifre tekrar gereklidir'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface SystemInfo {
  ip: string
  userAgent: string
  platform: string
  language: string
  screenResolution: string
  timezone: string
  cpuCores?: number
  deviceMemory?: number
  connectionType?: string
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const locale = useLocale()
  
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form hooks
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Sistem bilgilerini çek (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info: SystemInfo = {
        ip: 'Yükleniyor...',
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'Bilinmiyor',
        language: navigator.language || 'tr-TR',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Bilinmiyor',
        cpuCores: (navigator as any).hardwareConcurrency || 'Bilinmiyor',
        deviceMemory: (navigator as any).deviceMemory || 'Bilinmiyor',
        connectionType: (navigator as any).connection?.effectiveType || 'Bilinmiyor',
      }

      // IP adresini almak için external API kullan
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          setSystemInfo({ ...info, ip: data.ip || 'Bilinmiyor' })
        })
        .catch(() => {
          setSystemInfo({ ...info, ip: 'Alınamadı' })
        })
    }
  }, [])

  // Form'u session verisiyle güncelle
  useEffect(() => {
    if (session?.user) {
      resetProfile({
        name: session.user.name || '',
        email: session.user.email || '',
      })
    }
  }, [session, resetProfile])

  // Profil güncelleme
  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!session?.user?.id) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Profil güncellenemedi')
      }

      const updatedUser = await res.json()

      // Session'ı güncelle
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: updatedUser.name,
        },
      })

      // Cache'i güncelle
      await mutate('/api/users')
      await mutate(`/api/users/${session.user.id}`)

      setSuccess('Profil başarıyla güncellendi!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError(error?.message || 'Profil güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  // Şifre değiştirme
  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!session?.user?.id) return

    setChangingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/users/${session.user.id}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Şifre değiştirilemedi')
      }

      resetPassword()
      setSuccess('Şifre başarıyla değiştirildi!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error changing password:', error)
      setError(error?.message || 'Şifre değiştirilemedi')
    } finally {
      setChangingPassword(false)
    }
  }

  // Avatar yükleme (şimdilik placeholder)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setError(null)

    try {
      // Gelecekte Supabase Storage'a yüklenecek
      // Şimdilik sadece validasyon yapıyoruz
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Dosya boyutu 2MB\'dan büyük olamaz')
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları yüklenebilir')
      }

      // TODO: Supabase Storage'a yükleme implementasyonu
      setSuccess('Profil resmi yüklendi! (Gelecekte aktif olacak)')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setError(error?.message || 'Profil resmi yüklenemedi')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Tarayıcı bilgisini parse et
  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return 'Bilinmiyor'
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Bilinmiyor'
  }

  // İşletim sistemi bilgisini parse et
  const getOSInfo = () => {
    if (typeof window === 'undefined') return 'Bilinmiyor'
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Bilinmiyor'
  }

  if (!session?.user) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-8 w-8 text-indigo-600" />
            Profilim
          </h1>
          <p className="mt-2 text-gray-600">
            Hesap bilgilerinizi görüntüleyin ve düzenleyin
          </p>
        </div>
      </div>

      {/* Başarı/Hata Mesajları */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil Bilgileri
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="system">
            <Monitor className="h-4 w-4 mr-2" />
            Sistem Bilgileri
          </TabsTrigger>
        </TabsList>

        {/* Profil Bilgileri Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                Hesap bilgilerinizi görüntüleyin ve düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
                {/* Profil Resmi */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={(session?.user as any)?.image || ''} alt={session?.user?.name || ''} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-primary-600 to-purple-600 text-white">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload">Profil Resmi</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={uploadingAvatar}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {uploadingAvatar ? 'Yükleniyor...' : 'Resim Değiştir'}
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                      {uploadingAvatar && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Maksimum 2MB, JPG, PNG veya GIF formatında
                    </p>
                  </div>
                </div>

                {/* Ad Soyad */}
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    {...registerProfile('name')}
                    placeholder="Adınız ve soyadınız"
                    disabled={saving}
                  />
                  {profileErrors.name && (
                    <p className="text-sm text-red-600">{profileErrors.name.message}</p>
                  )}
                </div>

                {/* E-posta */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile('email')}
                    placeholder="email@example.com"
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    E-posta adresi değiştirilemez. Değiştirmek için sistem yöneticinizle iletişime geçin.
                  </p>
                </div>

                {/* Rol */}
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={
                        session.user.role === 'SUPER_ADMIN'
                          ? 'Süper Admin'
                          : session.user.role === 'ADMIN'
                          ? 'Admin'
                          : 'Satış'
                      }
                      disabled
                    />
                    <Badge
                      variant={
                        session.user.role === 'SUPER_ADMIN'
                          ? 'default'
                          : session.user.role === 'ADMIN'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {session.user.role}
                    </Badge>
                  </div>
                </div>

                {/* Şirket */}
                <div className="space-y-2">
                  <Label>Şirket</Label>
                  <Input
                    value={session.user.companyName || 'Bilinmiyor'}
                    disabled
                  />
                </div>

                {/* Kaydet Butonu */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-purple-600 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Kaydet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Güvenlik Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesap güvenliğiniz için düzenli olarak şifrenizi değiştirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mevcut Şifre *</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                    placeholder="Mevcut şifrenizi girin"
                    disabled={changingPassword}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword')}
                    placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                    disabled={changingPassword}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre Tekrar *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword('confirmPassword')}
                    placeholder="Yeni şifrenizi tekrar girin"
                    disabled={changingPassword}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetPassword()}
                    disabled={changingPassword}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-purple-600 text-white"
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Değiştiriliyor...
                      </>
                    ) : (
                      'Şifreyi Değiştir'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistem Bilgileri Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistem ve Cihaz Bilgileri</CardTitle>
              <CardDescription>
                Mevcut oturumunuzun sistem bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!systemInfo ? (
                <SkeletonList />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* IP Adresi */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Wifi className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">IP Adresi</p>
                      <p className="text-lg font-semibold text-gray-900">{systemInfo.ip}</p>
                    </div>
                  </div>

                  {/* Tarayıcı */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Tarayıcı</p>
                      <p className="text-lg font-semibold text-gray-900">{getBrowserInfo()}</p>
                    </div>
                  </div>

                  {/* İşletim Sistemi */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Monitor className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">İşletim Sistemi</p>
                      <p className="text-lg font-semibold text-gray-900">{getOSInfo()}</p>
                      <p className="text-xs text-gray-500 mt-1">{systemInfo.platform}</p>
                    </div>
                  </div>

                  {/* Ekran Çözünürlüğü */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Ekran Çözünürlüğü</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {systemInfo.screenResolution}
                      </p>
                    </div>
                  </div>

                  {/* Dil */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Globe className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Dil</p>
                      <p className="text-lg font-semibold text-gray-900">{systemInfo.language}</p>
                    </div>
                  </div>

                  {/* Saat Dilimi */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-pink-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Saat Dilimi</p>
                      <p className="text-lg font-semibold text-gray-900">{systemInfo.timezone}</p>
                    </div>
                  </div>

                  {/* CPU Çekirdekleri */}
                  {systemInfo.cpuCores && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Cpu className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">CPU Çekirdekleri</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {systemInfo.cpuCores}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cihaz Belleği */}
                  {systemInfo.deviceMemory && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <HardDrive className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Cihaz Belleği</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {systemInfo.deviceMemory} GB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bağlantı Tipi */}
                  {systemInfo.connectionType && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Wifi className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Bağlantı Tipi</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {systemInfo.connectionType}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Agent Detayları */}
              {systemInfo && (
                <div className="mt-6 pt-6 border-t">
                  <Label className="mb-2">User Agent</Label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {systemInfo.userAgent}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

