'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Settings, User, Bell, Globe, Shield, Video, Mail } from 'lucide-react'
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

  // API Entegrasyonları (sadece Admin için)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
  const [integrations, setIntegrations] = useState({
    zoomEnabled: false,
    zoomAccountId: '',
    zoomClientId: '',
    zoomClientSecret: '',
    googleEnabled: false,
    googleAccessToken: '',
    microsoftEnabled: false,
    microsoftAccessToken: '',
  })
  const [integrationsLoading, setIntegrationsLoading] = useState(false)

  // E-posta Entegrasyonları (sadece Admin için)
  const [emailIntegration, setEmailIntegration] = useState({
    gmailEnabled: false,
    outlookEnabled: false,
    smtpEnabled: false,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: '',
    emailStatus: '',
    emailLastError: '',
  })
  const [emailIntegrationLoading, setEmailIntegrationLoading] = useState(false)

  // Session yüklendikten sonra state'i güncelle
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  // Integrations verilerini yükle
  useEffect(() => {
    if (isAdmin && session?.user?.companyId) {
      fetch(`/api/company-integrations`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setIntegrations({
              zoomEnabled: data.zoomEnabled || false,
              zoomAccountId: data.zoomAccountId || '',
              zoomClientId: data.zoomClientId || '',
              zoomClientSecret: data.zoomClientSecret || '',
              googleEnabled: data.googleEnabled || false,
              googleAccessToken: data.googleAccessToken || '',
              microsoftEnabled: data.microsoftEnabled || false,
              microsoftAccessToken: data.microsoftAccessToken || '',
            })
            
            // E-posta entegrasyonları
            setEmailIntegration({
              gmailEnabled: data.gmailEnabled || false,
              outlookEnabled: data.outlookEnabled || false,
              smtpEnabled: data.smtpEnabled || false,
              smtpHost: data.smtpHost || 'smtp.gmail.com',
              smtpPort: data.smtpPort || 587,
              smtpUser: data.smtpUser || '',
              smtpPassword: data.smtpPassword || '',
              smtpFromEmail: data.smtpFromEmail || '',
              smtpFromName: data.smtpFromName || '',
              emailStatus: data.emailStatus || '',
              emailLastError: data.emailLastError || '',
            })
          }
        })
        .catch(err => console.error('Integrations fetch error:', err))
    }
  }, [isAdmin, session?.user?.companyId])

  const handleSaveIntegrations = async () => {
    if (!session?.user?.companyId) {
      toast.error('Hata', 'Oturum bilgisi bulunamadı')
      return
    }

    setIntegrationsLoading(true)
    try {
      const res = await fetch('/api/company-integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integrations),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Entegrasyonlar kaydedilemedi')
      }

      toast.success('Başarılı', 'API entegrasyonları başarıyla kaydedildi')
    } catch (error: any) {
      console.error('Integrations save error:', error)
      toast.error('Hata', error?.message || 'Entegrasyonlar kaydedilemedi')
    } finally {
      setIntegrationsLoading(false)
    }
  }

  const handleSaveEmailIntegration = async () => {
    if (!session?.user?.companyId) {
      toast.error('Hata', 'Oturum bilgisi bulunamadı')
      return
    }

    setEmailIntegrationLoading(true)
    try {
      const res = await fetch('/api/company-integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailIntegration),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'E-posta entegrasyonları kaydedilemedi')
      }

      toast.success('Başarılı', 'E-posta entegrasyonları başarıyla kaydedildi')
      
      // Sayfayı yenile (emailStatus güncellemesi için)
      router.refresh()
    } catch (error: any) {
      console.error('Email integration save error:', error)
      toast.error('Hata', error?.message || 'E-posta entegrasyonları kaydedilemedi')
    } finally {
      setEmailIntegrationLoading(false)
    }
  }

  const handleConnectGmail = () => {
    window.location.href = '/api/integrations/oauth/gmail/authorize'
  }

  const handleConnectOutlook = () => {
    window.location.href = '/api/integrations/oauth/outlook/authorize'
  }

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
          {isAdmin && (
            <>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-posta Entegrasyonları
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                API Entegrasyonları
              </TabsTrigger>
            </>
          )}
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

        {/* E-posta Entegrasyonları Tab - Sadece Admin için */}
        {isAdmin && (
          <TabsContent value="email">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">E-posta Entegrasyonları</h2>
              <p className="text-sm text-gray-600 mb-4">
                Şirketiniz için e-posta gönderim servislerini yapılandırın. Deal, Quote, Invoice oluşturulduğunda otomatik e-posta gönderilir.
              </p>

              {/* Durum Göstergesi */}
              {emailIntegration.emailStatus && (
                <div className={`mb-4 p-3 rounded-md ${
                  emailIntegration.emailStatus === 'ACTIVE' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : emailIntegration.emailStatus === 'ERROR'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                }`}>
                  <p className="text-sm font-medium">
                    Durum: {emailIntegration.emailStatus === 'ACTIVE' ? '✅ Aktif' : emailIntegration.emailStatus === 'ERROR' ? '❌ Hata' : '⚪ Pasif'}
                  </p>
                  {emailIntegration.emailLastError && (
                    <p className="text-xs mt-1 text-red-600">{emailIntegration.emailLastError}</p>
                  )}
                </div>
              )}

              <div className="space-y-6">
                {/* Gmail OAuth Integration */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Gmail OAuth</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Gmail hesabınızı OAuth ile bağlayın (önerilen - en güvenli)
                      </p>
                    </div>
                    {emailIntegration.gmailEnabled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Bağlı</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Gmail bağlantısını kaldırmak istediğinize emin misiniz?')) {
                              setEmailIntegration({ ...emailIntegration, gmailEnabled: false })
                            }
                          }}
                        >
                          Bağlantıyı Kaldır
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnectGmail}
                      >
                        Gmail ile Bağlan
                      </Button>
                    )}
                  </div>
                </div>

                {/* Outlook OAuth Integration */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Outlook OAuth</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Outlook/Microsoft 365 hesabınızı OAuth ile bağlayın
                      </p>
                    </div>
                    {emailIntegration.outlookEnabled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Bağlı</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Outlook bağlantısını kaldırmak istediğinize emin misiniz?')) {
                              setEmailIntegration({ ...emailIntegration, outlookEnabled: false })
                            }
                          }}
                        >
                          Bağlantıyı Kaldır
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnectOutlook}
                      >
                        Outlook ile Bağlan
                      </Button>
                    )}
                  </div>
                </div>

                {/* SMTP Integration */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">SMTP (Genel)</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Gmail, Outlook, SendGrid, Brevo veya diğer SMTP servisleri (App Password gerekli)
                      </p>
                    </div>
                    <Button
                      variant={emailIntegration.smtpEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailIntegration({ ...emailIntegration, smtpEnabled: !emailIntegration.smtpEnabled })}
                    >
                      {emailIntegration.smtpEnabled ? 'Açık' : 'Kapalı'}
                    </Button>
                  </div>
                  {emailIntegration.smtpEnabled && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={emailIntegration.smtpHost}
                          onChange={(e) => setEmailIntegration({ ...emailIntegration, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={emailIntegration.smtpPort}
                          onChange={(e) => setEmailIntegration({ ...emailIntegration, smtpPort: parseInt(e.target.value) || 587 })}
                          placeholder="587"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">587 (STARTTLS) veya 465 (SSL)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">SMTP Kullanıcı Adı (E-posta)</Label>
                        <Input
                          id="smtpUser"
                          type="email"
                          value={emailIntegration.smtpUser}
                          onChange={(e) => setEmailIntegration({ ...emailIntegration, smtpUser: e.target.value })}
                          placeholder="your-email@gmail.com"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Şifresi (App Password)</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          value={emailIntegration.smtpPassword}
                          onChange={(e) => setEmailIntegration({ ...emailIntegration, smtpPassword: e.target.value })}
                          placeholder="App Password (Gmail için)"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Gmail için: Hesap &gt; Güvenlik &gt; 2 Adımlı Doğrulama &gt; Uygulama şifreleri
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpFromEmail">Gönderen E-posta</Label>
                        <Input
                          id="smtpFromEmail"
                          type="email"
                          value={emailIntegration.smtpFromEmail}
                          onChange={(e) => setEmailIntegration({ ...emailIntegration, smtpFromEmail: e.target.value })}
                          placeholder="noreply@yourcompany.com"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpFromName">Gönderen İsmi</Label>
                        <Input
                          id="smtpFromName"
                          value={emailIntegration.smtpFromName}
                          onChange={(e) => setEmailIntegration({ ...emailIntegration, smtpFromName: e.target.value })}
                          placeholder="CRM Enterprise"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSaveEmailIntegration} 
                  disabled={emailIntegrationLoading} 
                  className="w-full sm:w-auto"
                >
                  {emailIntegrationLoading ? 'Kaydediliyor...' : 'E-posta Entegrasyonlarını Kaydet'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* API Integrations Tab - Sadece Admin için */}
        {isAdmin && (
          <TabsContent value="integrations">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">API Entegrasyonları</h2>
              <p className="text-sm text-gray-600 mb-4">
                Şirketiniz için video meeting servislerinin API credentials'larını ayarlayın.
              </p>

              <div className="space-y-6">
                {/* Zoom Integration */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Zoom Entegrasyonu</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Zoom meeting'leri otomatik oluşturmak için credentials gerekli
                      </p>
                    </div>
                    <Button
                      variant={integrations.zoomEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIntegrations({ ...integrations, zoomEnabled: !integrations.zoomEnabled })}
                    >
                      {integrations.zoomEnabled ? 'Açık' : 'Kapalı'}
                    </Button>
                  </div>
                  {integrations.zoomEnabled && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="zoomAccountId">Zoom Account ID</Label>
                        <Input
                          id="zoomAccountId"
                          value={integrations.zoomAccountId}
                          onChange={(e) => setIntegrations({ ...integrations, zoomAccountId: e.target.value })}
                          placeholder="Zoom Account ID"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zoomClientId">Zoom Client ID</Label>
                        <Input
                          id="zoomClientId"
                          value={integrations.zoomClientId}
                          onChange={(e) => setIntegrations({ ...integrations, zoomClientId: e.target.value })}
                          placeholder="Zoom OAuth Client ID"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zoomClientSecret">Zoom Client Secret</Label>
                        <Input
                          id="zoomClientSecret"
                          type="password"
                          value={integrations.zoomClientSecret}
                          onChange={(e) => setIntegrations({ ...integrations, zoomClientSecret: e.target.value })}
                          placeholder="Zoom OAuth Client Secret"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Meet Integration */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Google Meet Entegrasyonu</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Google Meet meeting'leri otomatik oluşturmak için access token gerekli
                      </p>
                    </div>
                    <Button
                      variant={integrations.googleEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIntegrations({ ...integrations, googleEnabled: !integrations.googleEnabled })}
                    >
                      {integrations.googleEnabled ? 'Açık' : 'Kapalı'}
                    </Button>
                  </div>
                  {integrations.googleEnabled && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="googleAccessToken">Google Access Token</Label>
                        <Input
                          id="googleAccessToken"
                          type="password"
                          value={integrations.googleAccessToken}
                          onChange={(e) => setIntegrations({ ...integrations, googleAccessToken: e.target.value })}
                          placeholder="Google OAuth Access Token"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Not: Production'da OAuth flow kullanılmalı
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Microsoft Teams Integration */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Microsoft Teams Entegrasyonu</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Microsoft Teams meeting'leri otomatik oluşturmak için access token gerekli
                      </p>
                    </div>
                    <Button
                      variant={integrations.microsoftEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIntegrations({ ...integrations, microsoftEnabled: !integrations.microsoftEnabled })}
                    >
                      {integrations.microsoftEnabled ? 'Açık' : 'Kapalı'}
                    </Button>
                  </div>
                  {integrations.microsoftEnabled && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="microsoftAccessToken">Microsoft Access Token</Label>
                        <Input
                          id="microsoftAccessToken"
                          type="password"
                          value={integrations.microsoftAccessToken}
                          onChange={(e) => setIntegrations({ ...integrations, microsoftAccessToken: e.target.value })}
                          placeholder="Microsoft Graph Access Token"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Not: Production'da OAuth flow kullanılmalı
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSaveIntegrations} 
                  disabled={integrationsLoading} 
                  className="w-full sm:w-auto"
                >
                  {integrationsLoading ? 'Kaydediliyor...' : 'API Entegrasyonlarını Kaydet'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
