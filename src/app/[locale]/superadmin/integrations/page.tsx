/**
 * SuperAdmin Entegrasyon Yönetim Sayfası
 * Kurum bazlı entegrasyonları yönetmek için
 */

'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useSession } from '@/hooks/useSession'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'
import {
  Mail,
  MessageSquare,
  MessageCircle,
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import SkeletonList from '@/components/skeletons/SkeletonList'

interface Company {
  id: string
  name: string
}

interface CompanyIntegration {
  id?: string
  companyId: string
  // Email
  gmailEnabled?: boolean
  outlookEnabled?: boolean
  smtpEnabled?: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFromEmail?: string
  smtpFromName?: string
  resendApiKey?: string
  emailStatus?: string
  // SMS
  smsEnabled?: boolean
  smsProvider?: string
  smsStatus?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
  // WhatsApp
  whatsappEnabled?: boolean
  whatsappProvider?: string
  whatsappStatus?: string
  twilioWhatsappNumber?: string
  // Google Calendar
  googleCalendarClientId?: string
  googleCalendarClientSecret?: string
  googleCalendarRedirectUri?: string
  // Video Meeting Integrations
  zoomEnabled?: boolean
  zoomAccountId?: string
  zoomClientId?: string
  zoomClientSecret?: string
  googleEnabled?: boolean
  googleAccessToken?: string
  googleRefreshToken?: string
  microsoftEnabled?: boolean
  microsoftAccessToken?: string
  microsoftRefreshToken?: string
  microsoftClientId?: string
  microsoftClientSecret?: string
  microsoftRedirectUri?: string
}

export default function SuperAdminIntegrationsPage() {
  const locale = useLocale()
  const router = useRouter()
  const { session } = useSession()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // SuperAdmin kontrolü
  useEffect(() => {
    if (session && session.user?.role !== 'SUPER_ADMIN') {
      router.push(`/${locale}/dashboard`)
      toast.error('Bu sayfaya erişim yetkiniz yok.')
    }
  }, [session, router, locale])

  // Session yükleniyor
  if (!session) {
    return <SkeletonList />
  }

  // SuperAdmin değilse erişim reddedildi mesajı göster
  if (session.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz yok.</p>
          <p className="text-sm text-gray-500">Sadece SuperAdmin kullanıcıları bu sayfaya erişebilir.</p>
        </div>
      </div>
    )
  }

  // Tüm şirketleri getir (SuperAdmin için)
  const { data: companies = [], isLoading: companiesLoading } = useData<Company[]>(
    '/api/superadmin/companies',
    {
      dedupingInterval: 60000,
    }
  )

  // Seçili şirketin entegrasyonlarını getir
  const { data: integration, isLoading: integrationLoading, mutate: mutateIntegration } = useData<CompanyIntegration>(
    selectedCompanyId ? `/api/company-integrations?companyId=${selectedCompanyId}` : null,
    {
      dedupingInterval: 5000,
    }
  )

  // Form state
  const [formData, setFormData] = useState<CompanyIntegration>({
    companyId: selectedCompanyId,
    gmailEnabled: false,
    outlookEnabled: false,
    smtpEnabled: false,
    smsEnabled: false,
    whatsappEnabled: false,
  })

  // Integration değiştiğinde form'u güncelle
  useEffect(() => {
    if (integration) {
      setFormData({
        ...integration,
        companyId: selectedCompanyId,
      })
    } else if (selectedCompanyId) {
      setFormData({
        companyId: selectedCompanyId,
        gmailEnabled: false,
        outlookEnabled: false,
        smtpEnabled: false,
        smsEnabled: false,
        whatsappEnabled: false,
      })
    }
  }, [integration, selectedCompanyId])

  // İlk şirketi seç
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id)
    }
  }, [companies, selectedCompanyId])

  const handleSave = async () => {
    if (!selectedCompanyId) {
      toast.error('Hata', 'Lütfen bir şirket seçin')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/company-integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: selectedCompanyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Entegrasyonlar kaydedilemedi')
      }

      const saved = await res.json()
      await mutateIntegration(saved, { revalidate: false })
      toast.success('Başarılı', 'Entegrasyonlar başarıyla kaydedildi')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('Hata', error?.message || 'Entegrasyonlar kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Bu sayfaya erişim yetkiniz yok.</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entegrasyon Yönetimi</h1>
          <p className="text-gray-600 mt-2">Kurum bazlı entegrasyonları yönetin</p>
        </div>
      </div>

      {/* Şirket Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle>Şirket Seçin</CardTitle>
          <CardDescription>Entegrasyonlarını yönetmek istediğiniz şirketi seçin</CardDescription>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <SkeletonList />
          ) : (
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Şirket seçin...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {!selectedCompanyId || selectedCompanyId === 'none' ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Lütfen bir şirket seçin
          </CardContent>
        </Card>
      ) : integrationLoading ? (
        <SkeletonList />
      ) : (
        <Tabs defaultValue="email" className="space-y-4">
          <TabsList>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="mr-2 h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Google Calendar
            </TabsTrigger>
            <TabsTrigger value="video-meetings">
              <Video className="mr-2 h-4 w-4" />
              Video Toplantılar
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Entegrasyonları</CardTitle>
                <CardDescription>E-posta gönderme servislerini yapılandırın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resend */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Resend (Önerilen)</h3>
                      <p className="text-sm text-gray-600">Modern ve kolay kullanım, ücretsiz tier: 3,000 email/ay</p>
                      <a
                        href="https://resend.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Resend.com'a git <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Badge variant={formData.resendApiKey ? 'default' : 'secondary'}>
                      {formData.resendApiKey ? 'Yapılandırılmış' : 'Yapılandırılmamış'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resendApiKey">Resend API Key</Label>
                    <div className="relative">
                      <Input
                        id="resendApiKey"
                        type={showPasswords.resendApiKey ? 'text' : 'password'}
                        value={formData.resendApiKey || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, resendApiKey: e.target.value })
                        }
                        placeholder="re_xxxxxxxxxxxxx"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => togglePasswordVisibility('resendApiKey')}
                      >
                        {showPasswords.resendApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Resend.com hesabınızdan API key alın ve buraya yapıştırın
                    </p>
                  </div>
                </div>

                {/* Gmail OAuth */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Gmail OAuth</h3>
                      <p className="text-sm text-gray-600">Google OAuth ile Gmail üzerinden e-posta gönderme</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.gmailEnabled || false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, gmailEnabled: checked })
                        }
                      />
                      <Badge variant={formData.gmailEnabled ? 'default' : 'secondary'}>
                        {formData.gmailEnabled ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                  {formData.gmailEnabled && (
                    <div className="text-sm text-blue-600">
                      Gmail OAuth bağlantısı için{' '}
                      <a
                        href="/api/integrations/oauth/gmail/authorize"
                        className="underline"
                        target="_blank"
                      >
                        buraya tıklayın
                      </a>
                    </div>
                  )}
                </div>

                {/* Outlook OAuth */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Outlook OAuth</h3>
                      <p className="text-sm text-gray-600">Microsoft OAuth ile Outlook üzerinden e-posta gönderme</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.outlookEnabled || false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, outlookEnabled: checked })
                        }
                      />
                      <Badge variant={formData.outlookEnabled ? 'default' : 'secondary'}>
                        {formData.outlookEnabled ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                  {formData.outlookEnabled && (
                    <div className="text-sm text-blue-600">
                      Outlook OAuth bağlantısı için{' '}
                      <a
                        href="/api/integrations/oauth/outlook/authorize"
                        className="underline"
                        target="_blank"
                      >
                        buraya tıklayın
                      </a>
                    </div>
                  )}
                </div>

                {/* SMTP */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">SMTP</h3>
                      <p className="text-sm text-gray-600">Herhangi bir SMTP sunucusu ile e-posta gönderme</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.smtpEnabled || false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, smtpEnabled: checked })
                        }
                      />
                      <Badge variant={formData.smtpEnabled ? 'default' : 'secondary'}>
                        {formData.smtpEnabled ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                  {formData.smtpEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={formData.smtpHost || ''}
                          onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={formData.smtpPort || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })
                          }
                          placeholder="587"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">SMTP Kullanıcı</Label>
                        <Input
                          id="smtpUser"
                          value={formData.smtpUser || ''}
                          onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                          placeholder="your-email@gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Şifre</Label>
                        <div className="relative">
                          <Input
                            id="smtpPassword"
                            type={showPasswords.smtpPassword ? 'text' : 'password'}
                            value={formData.smtpPassword || ''}
                            onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                            placeholder="App Password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => togglePasswordVisibility('smtpPassword')}
                          >
                            {showPasswords.smtpPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpFromEmail">Gönderen E-posta</Label>
                        <Input
                          id="smtpFromEmail"
                          value={formData.smtpFromEmail || ''}
                          onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                          placeholder="noreply@yourcompany.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpFromName">Gönderen İsim</Label>
                        <Input
                          id="smtpFromName"
                          value={formData.smtpFromName || ''}
                          onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                          placeholder="CRM System"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SMS Entegrasyonu (Twilio)</CardTitle>
                <CardDescription>Twilio ile SMS gönderme servisini yapılandırın</CardDescription>
                <div className="mt-2">
                  <a
                    href="https://www.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Twilio.com'a git <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">SMS Entegrasyonu</h3>
                    <p className="text-sm text-gray-600">Twilio hesabınızdan credentials alın</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.smsEnabled || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, smsEnabled: checked, smsStatus: checked ? 'ACTIVE' : 'INACTIVE' })
                      }
                    />
                    <Badge variant={formData.smsEnabled ? 'default' : 'secondary'}>
                      {formData.smsEnabled ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>

                {formData.smsEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
                      <Input
                        id="twilioAccountSid"
                        value={formData.twilioAccountSid || ''}
                        onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
                        placeholder="ACxxxxxxxxxxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
                      <div className="relative">
                        <Input
                          id="twilioAuthToken"
                          type={showPasswords.twilioAuthToken ? 'text' : 'password'}
                          value={formData.twilioAuthToken || ''}
                          onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
                          placeholder="your-auth-token"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePasswordVisibility('twilioAuthToken')}
                        >
                          {showPasswords.twilioAuthToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilioPhoneNumber">Twilio Telefon Numarası</Label>
                      <Input
                        id="twilioPhoneNumber"
                        value={formData.twilioPhoneNumber || ''}
                        onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
                        placeholder="+1234567890"
                      />
                      <p className="text-xs text-gray-500">E.164 formatında (örn: +905551234567)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Entegrasyonu (Twilio)</CardTitle>
                <CardDescription>Twilio WhatsApp API ile WhatsApp mesajı gönderme servisini yapılandırın</CardDescription>
                <div className="mt-2">
                  <a
                    href="https://www.twilio.com/whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Twilio WhatsApp'a git <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">WhatsApp Entegrasyonu</h3>
                    <p className="text-sm text-gray-600">Twilio WhatsApp Business API'yi etkinleştirin</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.whatsappEnabled || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          whatsappEnabled: checked,
                          whatsappStatus: checked ? 'ACTIVE' : 'INACTIVE',
                        })
                      }
                    />
                    <Badge variant={formData.whatsappEnabled ? 'default' : 'secondary'}>
                      {formData.whatsappEnabled ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>

                {formData.whatsappEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="twilioAccountSidWhatsApp">Twilio Account SID</Label>
                      <Input
                        id="twilioAccountSidWhatsApp"
                        value={formData.twilioAccountSid || ''}
                        onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
                        placeholder="ACxxxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500">SMS ile aynı Account SID kullanılabilir</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilioAuthTokenWhatsApp">Twilio Auth Token</Label>
                      <div className="relative">
                        <Input
                          id="twilioAuthTokenWhatsApp"
                          type={showPasswords.twilioAuthTokenWhatsApp ? 'text' : 'password'}
                          value={formData.twilioAuthToken || ''}
                          onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
                          placeholder="your-auth-token"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePasswordVisibility('twilioAuthTokenWhatsApp')}
                        >
                          {showPasswords.twilioAuthTokenWhatsApp ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">SMS ile aynı Auth Token kullanılabilir</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilioWhatsappNumber">Twilio WhatsApp Numarası</Label>
                      <Input
                        id="twilioWhatsappNumber"
                        value={formData.twilioWhatsappNumber || ''}
                        onChange={(e) => setFormData({ ...formData, twilioWhatsappNumber: e.target.value })}
                        placeholder="whatsapp:+1234567890"
                      />
                      <p className="text-xs text-gray-500">whatsapp: prefix'i ile (örn: whatsapp:+905551234567)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Calendar Entegrasyonu</CardTitle>
                <CardDescription>Google Calendar API credentials yapılandırması</CardDescription>
                <div className="mt-2">
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console'a git <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Google Calendar API Kurulumu</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Google Calendar entegrasyonu için Google Cloud Console'dan OAuth 2.0 credentials alın.
                  </p>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Adımlar:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Google Cloud Console'da proje oluşturun</li>
                      <li>Google Calendar API'yi etkinleştirin</li>
                      <li>OAuth 2.0 Client ID oluşturun (Web application)</li>
                      <li>Authorized redirect URIs'e şunu ekleyin: <code className="bg-gray-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/integrations/oauth/google-calendar/callback</code></li>
                      <li>Client ID ve Client Secret'ı aşağıya girin</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="googleCalendarClientId">Google Calendar Client ID</Label>
                    <Input
                      id="googleCalendarClientId"
                      value={formData.googleCalendarClientId || ''}
                      onChange={(e) => setFormData({ ...formData, googleCalendarClientId: e.target.value })}
                      placeholder="xxxxx.apps.googleusercontent.com"
                    />
                    <p className="text-xs text-gray-500">Google Cloud Console'dan aldığınız Client ID</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleCalendarClientSecret">Google Calendar Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="googleCalendarClientSecret"
                        type={showPasswords.googleCalendarClientSecret ? 'text' : 'password'}
                        value={formData.googleCalendarClientSecret || ''}
                        onChange={(e) => setFormData({ ...formData, googleCalendarClientSecret: e.target.value })}
                        placeholder="GOCSPX-xxxxx"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => togglePasswordVisibility('googleCalendarClientSecret')}
                      >
                        {showPasswords.googleCalendarClientSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Google Cloud Console'dan aldığınız Client Secret</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleCalendarRedirectUri">Redirect URI</Label>
                    <Input
                      id="googleCalendarRedirectUri"
                      value={formData.googleCalendarRedirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/api/integrations/oauth/google-calendar/callback` : '')}
                      onChange={(e) => setFormData({ ...formData, googleCalendarRedirectUri: e.target.value })}
                      placeholder="/api/integrations/oauth/google-calendar/callback"
                    />
                    <p className="text-xs text-gray-500">Google Cloud Console'da Authorized redirect URIs'e ekleyin</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>✅ Hazır!</strong> Credentials'ları girdikten sonra kullanıcılar kendi Google hesaplarını bağlayabilir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Meetings Tab */}
          <TabsContent value="video-meetings" className="space-y-4">
            {/* Zoom */}
            <Card>
              <CardHeader>
                <CardTitle>Zoom Entegrasyonu</CardTitle>
                <CardDescription>Zoom API ile otomatik toplantı oluşturma</CardDescription>
                <div className="mt-2">
                  <a
                    href="https://marketplace.zoom.us/docs/api-reference/zoom-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Zoom API Dokümantasyonu <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Zoom Entegrasyonu</h3>
                    <p className="text-sm text-gray-600">Zoom Server-to-Server OAuth ile otomatik toplantı oluşturma</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.zoomEnabled || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, zoomEnabled: checked })
                      }
                    />
                    <Badge variant={formData.zoomEnabled ? 'default' : 'secondary'}>
                      {formData.zoomEnabled ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>

                {formData.zoomEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="zoomAccountId">Zoom Account ID</Label>
                      <Input
                        id="zoomAccountId"
                        value={formData.zoomAccountId || ''}
                        onChange={(e) => setFormData({ ...formData, zoomAccountId: e.target.value })}
                        placeholder="xxxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500">Zoom hesabınızın Account ID'si</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zoomClientId">Zoom Client ID</Label>
                      <Input
                        id="zoomClientId"
                        value={formData.zoomClientId || ''}
                        onChange={(e) => setFormData({ ...formData, zoomClientId: e.target.value })}
                        placeholder="xxxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500">Zoom OAuth App Client ID</p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="zoomClientSecret">Zoom Client Secret</Label>
                      <div className="relative">
                        <Input
                          id="zoomClientSecret"
                          type={showPasswords.zoomClientSecret ? 'text' : 'password'}
                          value={formData.zoomClientSecret || ''}
                          onChange={(e) => setFormData({ ...formData, zoomClientSecret: e.target.value })}
                          placeholder="xxxxxxxxxxxxx"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePasswordVisibility('zoomClientSecret')}
                        >
                          {showPasswords.zoomClientSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Zoom OAuth App Client Secret</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Meet */}
            <Card>
              <CardHeader>
                <CardTitle>Google Meet Entegrasyonu</CardTitle>
                <CardDescription>Google Calendar API ile otomatik Google Meet toplantısı oluşturma</CardDescription>
                <div className="mt-2">
                  <a
                    href="https://developers.google.com/calendar/api/v3/reference/events/insert"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Google Calendar API Dokümantasyonu <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Google Meet Entegrasyonu</h3>
                    <p className="text-sm text-gray-600">Google Calendar API ile otomatik Google Meet linki oluşturma</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.googleEnabled || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, googleEnabled: checked })
                      }
                    />
                    <Badge variant={formData.googleEnabled ? 'default' : 'secondary'}>
                      {formData.googleEnabled ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>

                {formData.googleEnabled && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Not:</strong> Google Meet entegrasyonu için kullanıcıların kendi Google hesaplarını bağlaması gerekmektedir. 
                      Bu entegrasyon, Google Calendar entegrasyonu ile birlikte çalışır.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Microsoft Teams */}
            <Card>
              <CardHeader>
                <CardTitle>Microsoft Teams Entegrasyonu</CardTitle>
                <CardDescription>Microsoft Graph API ile otomatik Teams toplantısı oluşturma ve Outlook OAuth</CardDescription>
                <div className="mt-2">
                  <a
                    href="https://learn.microsoft.com/en-us/graph/api/application-post-onlinemeetings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Microsoft Graph API Dokümantasyonu <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Microsoft Teams Entegrasyonu</h3>
                    <p className="text-sm text-gray-600">Microsoft Graph API ile otomatik Teams toplantısı oluşturma ve Outlook OAuth</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.microsoftEnabled || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, microsoftEnabled: checked })
                      }
                    />
                    <Badge variant={formData.microsoftEnabled ? 'default' : 'secondary'}>
                      {formData.microsoftEnabled ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>

                {formData.microsoftEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="microsoftClientId">Microsoft Client ID</Label>
                      <Input
                        id="microsoftClientId"
                        value={formData.microsoftClientId || ''}
                        onChange={(e) => setFormData({ ...formData, microsoftClientId: e.target.value })}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500">Azure Portal'dan aldığınız Application (client) ID</p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="microsoftClientSecret">Microsoft Client Secret</Label>
                      <div className="relative">
                        <Input
                          id="microsoftClientSecret"
                          type={showPasswords.microsoftClientSecret ? 'text' : 'password'}
                          value={formData.microsoftClientSecret || ''}
                          onChange={(e) => setFormData({ ...formData, microsoftClientSecret: e.target.value })}
                          placeholder="xxxxxxxxxxxxx"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePasswordVisibility('microsoftClientSecret')}
                        >
                          {showPasswords.microsoftClientSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Azure Portal'dan oluşturduğunuz Client Secret</p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="microsoftRedirectUri">Redirect URI</Label>
                      <Input
                        id="microsoftRedirectUri"
                        value={formData.microsoftRedirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/api/integrations/oauth/outlook/callback` : '')}
                        onChange={(e) => setFormData({ ...formData, microsoftRedirectUri: e.target.value })}
                        placeholder="/api/integrations/oauth/outlook/callback"
                      />
                      <p className="text-xs text-gray-500">Azure Portal'da Authorized redirect URIs'e ekleyin</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200 col-span-2">
                      <p className="text-sm text-blue-800">
                        <strong>Not:</strong> Microsoft Teams ve Outlook entegrasyonu için kullanıcıların kendi Microsoft hesaplarını bağlaması gerekmektedir.
                        Bu credentials'lar OAuth için gereklidir.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kaydet Butonu */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Tabs>
      )}
    </div>
  )
}

