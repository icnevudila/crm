'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Settings, User, Bell, Globe, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Kullanıcı ayarları - Hook'lar conditional return'den ÖNCE çağrılmalı
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState(locale || 'tr')

  // Bildirim ayarları
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  // Session yüklenene kadar bekle
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  // Session yoksa veya kullanıcı authenticate olmamışsa
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Oturum açmanız gerekiyor</p>
          <Button onClick={() => router.push(`/${locale}/login`)}>
            Giriş Yap
          </Button>
        </div>
      </div>
    )
  }

  // Session yüklendikten sonra state'i güncelle
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error('Hata', 'Oturum bilgisi bulunamadı')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Ayarlar kaydedilemedi')
      }

      toast.success('Başarılı', 'Ayarlar başarıyla kaydedildi')
      
      // Session'ı yenile
      router.refresh()
    } catch (error: any) {
      console.error('Settings save error:', error)
      toast.error('Hata', error?.message || 'Ayarlar kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
          Ayarlar
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Hesap ve sistem ayarlarınızı yönetin</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Tercihler
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Güvenlik
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Profil Bilgileri</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız ve soyadınız"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  disabled
                  className="w-full"
                />
                <p className="text-xs sm:text-sm text-gray-500">
                  E-posta adresi değiştirilemez
                </p>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input
                  value={session?.user?.role || '-'}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Şirket</Label>
                <Input
                  value={session?.user?.companyName || '-'}
                  disabled
                  className="w-full"
                />
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Bildirim Ayarları</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Önemli işlemler için e-posta bildirimleri alın
                  </p>
                </div>
                <Button
                  variant={emailNotifications ? 'default' : 'outline'}
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className="w-full sm:w-auto"
                >
                  {emailNotifications ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <Label>Anlık Bildirimler</Label>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Tarayıcı bildirimleri alın
                  </p>
                </div>
                <Button
                  variant={pushNotifications ? 'default' : 'outline'}
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className="w-full sm:w-auto"
                >
                  {pushNotifications ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Tercihler</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dil</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full sm:w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Güvenlik</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Şifre Değiştir</Label>
                <Input type="password" placeholder="Yeni şifre" className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Şifre Tekrar</Label>
                <Input type="password" placeholder="Yeni şifre tekrar" className="w-full" />
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
