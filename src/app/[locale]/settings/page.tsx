'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
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

export default function SettingsPage() {
  const { data: session } = useSession()
  const t = useTranslations('common')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  // Kullanıcı ayarları
  const [name, setName] = useState(session?.user?.name || '')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [language, setLanguage] = useState(locale || 'tr')

  // Bildirim ayarları
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const handleSave = async () => {
    setLoading(true)
    try {
      // API call burada yapılacak
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Ayarlar kaydedildi')
    } catch (error) {
      alert('Ayarlar kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Ayarlar
        </h1>
        <p className="mt-2 text-gray-600">Hesap ve sistem ayarlarınızı yönetin</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
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
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profil Bilgileri</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız ve soyadınız"
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
                />
                <p className="text-sm text-gray-500">
                  E-posta adresi değiştirilemez
                </p>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input
                  value={session?.user?.role || '-'}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Şirket</Label>
                <Input
                  value={session?.user?.companyName || '-'}
                  disabled
                />
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bildirim Ayarları</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-gray-600">
                    Önemli işlemler için e-posta bildirimleri alın
                  </p>
                </div>
                <Button
                  variant={emailNotifications ? 'default' : 'outline'}
                  onClick={() => setEmailNotifications(!emailNotifications)}
                >
                  {emailNotifications ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Anlık Bildirimler</Label>
                  <p className="text-sm text-gray-600">
                    Tarayıcı bildirimleri alın
                  </p>
                </div>
                <Button
                  variant={pushNotifications ? 'default' : 'outline'}
                  onClick={() => setPushNotifications(!pushNotifications)}
                >
                  {pushNotifications ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tercihler</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dil</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Güvenlik</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Şifre Değiştir</Label>
                <Input type="password" placeholder="Yeni şifre" />
              </div>
              <div className="space-y-2">
                <Label>Şifre Tekrar</Label>
                <Input type="password" placeholder="Yeni şifre tekrar" />
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
