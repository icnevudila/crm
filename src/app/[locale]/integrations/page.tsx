'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plug, Video, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast, confirm } from '@/lib/toast'

export default function IntegrationsPage() {
  const { data: session, status } = useSession()
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  
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

  // Admin değilse erişim reddedildi
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Bu sayfaya erişim yetkiniz yok</p>
          <p className="text-sm text-gray-400">Sadece Admin ve SuperAdmin kullanıcıları entegrasyonları yönetebilir</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Plug className="h-6 w-6 sm:h-8 sm:w-8" />
          Entegrasyonlar
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          Üçüncü parti servislerle entegrasyonları yönetin ve yapılandırın
        </p>
      </div>

      {/* Integrations Tabs */}
      <Tabs defaultValue="email" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-posta Entegrasyonları
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            API Entegrasyonları
          </TabsTrigger>
        </TabsList>

        {/* E-posta Entegrasyonları Tab */}
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
                <div className="flex items-center gap-2">
                  {emailIntegration.emailStatus === 'ACTIVE' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : emailIntegration.emailStatus === 'ERROR' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                  )}
                  <p className="text-sm font-medium">
                    Durum: {emailIntegration.emailStatus === 'ACTIVE' ? '✅ Aktif' : emailIntegration.emailStatus === 'ERROR' ? '❌ Hata' : '⚪ Pasif'}
                  </p>
                </div>
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
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Bağlı
                      </span>
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
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Bağlı
                      </span>
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

        {/* API Integrations Tab */}
        <TabsContent value="api">
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
      </Tabs>
    </div>
  )
}

