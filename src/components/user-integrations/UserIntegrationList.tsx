'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Calendar, Mail, AlertCircle, CheckCircle2, XCircle, Video, MessageSquare, MessageCircle, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/lib/toast'
import { Info } from 'lucide-react'
import UserIntegrationForm from './UserIntegrationForm'
import CompanyIntegrationCard from './CompanyIntegrationCard'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useSession } from '@/hooks/useSession'

interface UserIntegration {
  id: string
  userId: string
  companyId: string
  integrationType: string
  status: string
  lastError?: string | null
  createdAt: string
  updatedAt: string
  User?: {
    id: string
    name: string
    email: string
  }
}

export default function UserIntegrationList() {
  const locale = useLocale()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [integrationType, setIntegrationType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<UserIntegration | null>(null)
  const [companyIntegration, setCompanyIntegration] = useState<any>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  
  // SuperAdmin için şirket seçimi
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [superAdminFormData, setSuperAdminFormData] = useState<any>({})
  const [savingSuperAdmin, setSavingSuperAdmin] = useState(false)
  
  // SuperAdmin için şirketleri çek
  const { data: companies = [] } = useData<any[]>(
    isSuperAdmin ? '/api/superadmin/companies' : null,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
  
  // SuperAdmin için seçili şirketin entegrasyonlarını çek
  const { data: superAdminIntegration } = useData<any>(
    isSuperAdmin && selectedCompanyId ? `/api/company-integrations?companyId=${selectedCompanyId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )
  
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId && isSuperAdmin) {
      setSelectedCompanyId(companies[0].id)
    }
  }, [companies, selectedCompanyId, isSuperAdmin])
  
  useEffect(() => {
    if (superAdminIntegration) {
      setSuperAdminFormData(superAdminIntegration)
    } else if (selectedCompanyId) {
      setSuperAdminFormData({
        companyId: selectedCompanyId,
        gmailEnabled: false,
        outlookEnabled: false,
        smtpEnabled: false,
        smsEnabled: false,
        whatsappEnabled: false,
      })
    }
  }, [superAdminIntegration, selectedCompanyId])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  if (integrationType) params.append('integrationType', integrationType)
  
  const apiUrl = `/api/user-integrations?${params.toString()}`
  const { data: integrations = [], isLoading, error, mutate: mutateIntegrations } = useData<UserIntegration[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  // CompanyIntegration verilerini çek
  const { data: companyIntegrationData } = useData<any>(
    session?.user?.companyId ? `/api/company-integrations?companyId=${session.user.companyId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    if (companyIntegrationData) {
      setCompanyIntegration(companyIntegrationData)
    }
  }, [companyIntegrationData])

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleEdit = (integration: UserIntegration) => {
    setSelectedIntegration(integration)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`${type} entegrasyonunu silmek istediğinize emin misiniz?`)) {
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
      
      // Optimistic update
      const updatedIntegrations = integrations.filter((item) => item.id !== id)
      
      await mutateIntegrations(updatedIntegrations, { revalidate: false })
      
      await Promise.all([
        mutate('/api/user-integrations', updatedIntegrations, { revalidate: false }),
        mutate('/api/user-integrations?', updatedIntegrations, { revalidate: false }),
        mutate(apiUrl, updatedIntegrations, { revalidate: false }),
      ])
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Hata', error?.message || 'Silme işlemi başarısız oldu')
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedIntegration(null)
  }

  const handleOAuthConnect = async (integrationType: string) => {
    try {
      let authEndpoint = ''
      
      switch (integrationType) {
        case 'GOOGLE_CALENDAR':
          authEndpoint = '/api/integrations/oauth/google-calendar/authorize'
          break
        case 'GOOGLE_EMAIL':
          authEndpoint = '/api/integrations/oauth/gmail/authorize'
          break
        case 'MICROSOFT_CALENDAR':
        case 'MICROSOFT_EMAIL':
          authEndpoint = '/api/integrations/oauth/outlook/authorize'
          break
        default:
          throw new Error('Desteklenmeyen entegrasyon tipi')
      }

      // OAuth sayfasına yönlendir (authorize endpoint redirect yapar)
      window.location.href = authEndpoint
    } catch (error: any) {
      console.error('OAuth connect error:', error)
      toast.error('Bağlantı Hatası', error?.message || 'OAuth bağlantısı başlatılamadı')
    }
  }

  const handleCompanyIntegrationSave = async (data: any) => {
    if (!session?.user?.companyId) return

    const res = await fetch('/api/company-integrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || 'Entegrasyon kaydedilemedi')
    }

    const saved = await res.json()
    return saved
  }

  const handleTestVideoMeeting = async (type: 'zoom' | 'google-meet' | 'teams') => {
    try {
      const endpoint = `/api/integrations/test/${type}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        let errorMessage = data.error || data.message || 'Bilinmeyen hata'
        let helpMessage = ''
        
        if (type === 'zoom') {
          helpMessage = 'Zoom bilgilerini https://marketplace.zoom.us/develop/create adresinden alabilirsiniz. Account ID, Client ID ve Client Secret bilgilerini girin ve "Kaydet" butonuna tıklayın.'
        } else if (type === 'google-meet') {
          helpMessage = 'Google Cloud Console\'dan (https://console.cloud.google.com/) Client ID ve Secret alın. "Kaydet" butonuna tıklayın, ardından "OAuth Bağla" ile Google hesabınızı bağlayın.'
        } else if (type === 'teams') {
          helpMessage = 'Azure Portal\'dan (https://portal.azure.com/) Client ID ve Secret alın. "Kaydet" butonuna tıklayın, ardından "OAuth Bağla" ile Microsoft hesabınızı bağlayın.'
        }
        
        toast.error('Test Başarısız', `${errorMessage}\n\n${helpMessage}`)
        return
      }

      toast.success('Test Başarılı', data.message || 'Entegrasyon başarıyla çalışıyor!')
    } catch (error: any) {
      console.error('Test error:', error)
      toast.error('Test Başarısız', error?.message || 'Bilinmeyen hata oluştu')
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'GOOGLE_CALENDAR':
      case 'MICROSOFT_CALENDAR':
        return <Calendar className="h-4 w-4" />
      case 'GOOGLE_EMAIL':
      case 'MICROSOFT_EMAIL':
        return <Mail className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
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
  if (error) return <div className="p-4 text-red-600">Hata: {error.message}</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kullanıcı Entegrasyonları</h1>
            <p className="text-gray-600 mt-1">Google Calendar, Gmail, Outlook, SMS, WhatsApp entegrasyonlarını yönetin</p>
          </div>
        </div>

        {/* OAuth Entegrasyonları */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">OAuth Entegrasyonları</h2>
          <p className="text-sm text-gray-600 mb-4">
            OAuth entegrasyonları için Client ID ve Client Secret bilgilerini girin, ardından bağlantıyı test edin.
          </p>
          
          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <CardDescription>Google Calendar entegrasyonu için OAuth bağlantısı</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleCalendarClientId">Google Client ID</Label>
                  <Input
                    id="googleCalendarClientId"
                    value={companyIntegration?.googleCalendarClientId || ''}
                    onChange={(e) => {
                      const updated = { ...companyIntegration, googleCalendarClientId: e.target.value }
                      setCompanyIntegration(updated)
                    }}
                    placeholder="xxxxxxxxxxxxx.apps.googleusercontent.com"
                  />
                  <p className="text-xs text-gray-500">Google Cloud Console'dan alınan Client ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleCalendarClientSecret">Google Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="googleCalendarClientSecret"
                      type={showPasswords.googleCalendarClientSecret ? 'text' : 'password'}
                      value={companyIntegration?.googleCalendarClientSecret || ''}
                      onChange={(e) => {
                        const updated = { ...companyIntegration, googleCalendarClientSecret: e.target.value }
                        setCompanyIntegration(updated)
                      }}
                      placeholder="Gxxxxxxxxxxxxx"
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
                  <p className="text-xs text-gray-500">Google Cloud Console'dan alınan Client Secret</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default"
                  onClick={async () => {
                    if (!companyIntegration?.googleCalendarClientId) {
                      toast.error('Eksik Bilgi', 'Lütfen önce Google Client ID girin.\n\nGoogle Cloud Console\'dan (https://console.cloud.google.com/) Client ID ve Secret alabilirsiniz.')
                      return
                    }
                    try {
                      await handleCompanyIntegrationSave({
                        googleCalendarClientId: companyIntegration.googleCalendarClientId,
                        googleCalendarClientSecret: companyIntegration.googleCalendarClientSecret,
                      })
                      toast.success('Başarılı', 'Google Calendar bilgileri kaydedildi! Şimdi "Google Calendar Bağla" butonuna tıklayarak OAuth bağlantısı yapabilirsiniz.')
                    } catch (error: any) {
                      toast.error('Hata', error?.message || 'Kaydetme başarısız oldu')
                    }
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Bilgileri Kaydet
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthConnect('GOOGLE_CALENDAR')}
                  disabled={!companyIntegration?.googleCalendarClientId}
                >
            <Calendar className="mr-2 h-4 w-4" />
            Google Calendar Bağla
          </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    if (!companyIntegration?.googleCalendarClientId) {
                      toast.error('Eksik Bilgi', 'Lütfen önce Google Client ID girin ve "Bilgileri Kaydet" butonuna tıklayın.\n\nGoogle Cloud Console\'dan (https://console.cloud.google.com/) Client ID ve Secret alabilirsiniz.')
                      return
                    }
                    try {
                      const res = await fetch('/api/integrations/test/calendar', { method: 'POST' })
                      const data = await res.json()
                      if (res.ok) {
                        toast.success('Test Başarılı', data.message || 'Google Calendar entegrasyonu çalışıyor!')
                      } else {
                        const errorMsg = data.error || 'Lütfen Google Calendar bağlantınızı kontrol edin.'
                        if (errorMsg.includes('Client ID')) {
                          toast.error('Test Başarısız', `${errorMsg}\n\nLütfen yukarıdaki Google Client ID ve Client Secret alanlarını doldurup "Bilgileri Kaydet" butonuna tıklayın.\n\nGoogle Cloud Console: https://console.cloud.google.com/`)
                        } else {
                          toast.error('Test Başarısız', `${errorMsg}\n\nOAuth bağlantısı yapılmamış olabilir. "Google Calendar Bağla" butonuna tıklayarak bağlantıyı tamamlayın.`)
                        }
                      }
                    } catch (error: any) {
                      toast.error('Test Başarısız', `${error?.message || 'Lütfen Google Calendar bağlantınızı kontrol edin.'}\n\nOAuth bağlantısı yapılmamış olabilir. "Google Calendar Bağla" butonuna tıklayarak bağlantıyı tamamlayın.`)
                    }
                  }}
                  title="Google Calendar OAuth bağlantınızın çalışıp çalışmadığını test edin"
                >
                  <Send className="mr-2 h-3 w-3" />
                  API'yi Test Et
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Microsoft Teams/Outlook */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Microsoft Teams & Outlook</CardTitle>
              <CardDescription>Microsoft entegrasyonları için OAuth bağlantısı</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="microsoftClientId">Microsoft Client ID</Label>
                  <Input
                    id="microsoftClientId"
                    value={companyIntegration?.microsoftClientId || ''}
                    onChange={(e) => {
                      const updated = { ...companyIntegration, microsoftClientId: e.target.value }
                      setCompanyIntegration(updated)
                    }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-gray-500">Azure Portal'dan alınan Application (client) ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="microsoftClientSecret">Microsoft Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="microsoftClientSecret"
                      type={showPasswords.microsoftClientSecret ? 'text' : 'password'}
                      value={companyIntegration?.microsoftClientSecret || ''}
                      onChange={(e) => {
                        const updated = { ...companyIntegration, microsoftClientSecret: e.target.value }
                        setCompanyIntegration(updated)
                      }}
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
                  <p className="text-xs text-gray-500">Azure Portal'dan alınan Client Secret</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="default"
                  onClick={async () => {
                    if (!companyIntegration?.microsoftClientId) {
                      toast.error('Eksik Bilgi', 'Lütfen önce Microsoft Client ID girin.\n\nAzure Portal\'dan (https://portal.azure.com/) Client ID ve Secret alabilirsiniz.')
                      return
                    }
                    try {
                      await handleCompanyIntegrationSave({
                        microsoftClientId: companyIntegration.microsoftClientId,
                        microsoftClientSecret: companyIntegration.microsoftClientSecret,
                      })
                      toast.success('Başarılı', 'Microsoft bilgileri kaydedildi! Şimdi "Microsoft Bağla" butonuna tıklayarak OAuth bağlantısı yapabilirsiniz.')
                    } catch (error: any) {
                      toast.error('Hata', error?.message || 'Kaydetme başarısız oldu')
                    }
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Bilgileri Kaydet
          </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthConnect('MICROSOFT_CALENDAR')}
                  disabled={!companyIntegration?.microsoftClientId}
                >
            <Calendar className="mr-2 h-4 w-4" />
            Outlook Calendar Bağla
          </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthConnect('MICROSOFT_EMAIL')}
                  disabled={!companyIntegration?.microsoftClientId}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Outlook Email Bağla
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthConnect('GOOGLE_EMAIL')}
                  disabled={!companyIntegration?.googleCalendarClientId}
                >
            <Mail className="mr-2 h-4 w-4" />
                  Gmail Bağla
          </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Key Entegrasyonları */}
        <div className="border-t pt-4 space-y-4">
          <h2 className="text-lg font-semibold">API Key Entegrasyonları</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bu entegrasyonlar şirket bazlıdır. SuperAdmin tarafından yapılandırılmalıdır.
            Ancak buradan da görüntüleyebilir ve durumlarını kontrol edebilirsiniz.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompanyIntegrationCard
              title="SMS (Twilio)"
              description="Twilio Account SID, Auth Token ve Telefon Numarası girin"
              fields={[
                { key: 'twilioAccountSid', label: 'Account SID', type: 'text' },
                { key: 'twilioAuthToken', label: 'Auth Token', type: 'password' },
                { key: 'twilioPhoneNumber', label: 'Telefon Numarası', type: 'text', placeholder: '+905551234567' },
              ]}
              enabledKey="smsEnabled"
              statusKey="smsStatus"
              onSave={handleCompanyIntegrationSave}
              testEndpoint="/api/integrations/test/sms"
              testLabel="Test SMS Gönder"
            />
            <CompanyIntegrationCard
              title="WhatsApp (Twilio)"
              description="Twilio WhatsApp API bilgilerini girin"
              fields={[
                { key: 'twilioAccountSid', label: 'Account SID', type: 'text' },
                { key: 'twilioAuthToken', label: 'Auth Token', type: 'password' },
                { key: 'twilioWhatsappNumber', label: 'WhatsApp Numarası', type: 'text', placeholder: 'whatsapp:+905551234567' },
              ]}
              enabledKey="whatsappEnabled"
              statusKey="whatsappStatus"
              onSave={handleCompanyIntegrationSave}
              testEndpoint="/api/integrations/test/whatsapp"
              testLabel="Test WhatsApp Gönder"
            />
            <CompanyIntegrationCard
              title="Email (Resend)"
              description="Resend API Key girin (önerilen - ücretsiz tier: 3,000 email/ay)"
              fields={[
                { key: 'resendApiKey', label: 'Resend API Key', type: 'password', placeholder: 're_xxxxxxxxxxxxx' },
              ]}
              enabledKey="resendEnabled"
              statusKey="emailStatus"
              onSave={handleCompanyIntegrationSave}
              testEndpoint="/api/integrations/test/email"
              testLabel="Test Email Gönder"
            />
          </div>
        </div>

        {/* Video Toplantı Entegrasyonları */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">Video Toplantı Entegrasyonları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Zoom */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Zoom
                </CardTitle>
                <CardDescription>Zoom toplantıları için otomatik link oluşturma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Kurulum Bilgisi</AlertTitle>
                  <AlertDescription>
                    Zoom bilgilerini <a href="https://marketplace.zoom.us/develop/create" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Zoom Marketplace</a> adresinden alabilirsiniz. Account ID, Client ID ve Client Secret bilgilerini girin ve "Kaydet" butonuna tıklayın. Ardından "Test Et" ile entegrasyonu test edin.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="zoomAccountId">Zoom Account ID</Label>
                  <Input
                    id="zoomAccountId"
                    value={companyIntegration?.zoomAccountId || ''}
                    onChange={(e) => {
                      const updated = { ...companyIntegration, zoomAccountId: e.target.value }
                      setCompanyIntegration(updated)
                    }}
                    placeholder="xxxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoomClientId">Zoom Client ID</Label>
                  <Input
                    id="zoomClientId"
                    value={companyIntegration?.zoomClientId || ''}
                    onChange={(e) => {
                      const updated = { ...companyIntegration, zoomClientId: e.target.value }
                      setCompanyIntegration(updated)
                    }}
                    placeholder="xxxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoomClientSecret">Zoom Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="zoomClientSecret"
                      type={showPasswords.zoomClientSecret ? 'text' : 'password'}
                      value={companyIntegration?.zoomClientSecret || ''}
                      onChange={(e) => {
                        const updated = { ...companyIntegration, zoomClientSecret: e.target.value }
                        setCompanyIntegration(updated)
                      }}
                      placeholder="xxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => togglePasswordVisibility('zoomClientSecret')}
                    >
                      {showPasswords.zoomClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await handleCompanyIntegrationSave({
                          zoomAccountId: companyIntegration?.zoomAccountId,
                          zoomClientId: companyIntegration?.zoomClientId,
                          zoomClientSecret: companyIntegration?.zoomClientSecret,
                          zoomEnabled: true,
                        })
                        toast.success('Başarılı', 'Zoom bilgileri kaydedildi! Artık "Test Et" butonuna tıklayarak entegrasyonu test edebilirsiniz.')
                      } catch (error: any) {
                        toast.error('Hata', error?.message || 'Kaydetme başarısız oldu')
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleTestVideoMeeting('zoom')}
                    disabled={!companyIntegration?.zoomAccountId || !companyIntegration?.zoomClientId || !companyIntegration?.zoomClientSecret}
                    title="Zoom entegrasyonunuzun çalışıp çalışmadığını test edin"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Test Et
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Google Meet */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Google Meet
                </CardTitle>
                <CardDescription>Google Meet toplantıları için otomatik link oluşturma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Kurulum Bilgisi</AlertTitle>
                  <AlertDescription>
                    Google Cloud Console'dan (<a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.cloud.google.com</a>) Client ID ve Secret alın. "Kaydet" butonuna tıklayın, ardından "OAuth Bağla" ile Google hesabınızı bağlayın. Son olarak "Test Et" ile entegrasyonu test edin.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="googleMeetClientId">Google Client ID</Label>
                  <Input
                    id="googleMeetClientId"
                    value={companyIntegration?.googleCalendarClientId || ''}
                    onChange={(e) => {
                      const updated = { ...companyIntegration, googleCalendarClientId: e.target.value }
                      setCompanyIntegration(updated)
                    }}
                    placeholder="xxxxxxxxxxxxx.apps.googleusercontent.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleMeetClientSecret">Google Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="googleMeetClientSecret"
                      type={showPasswords.googleCalendarClientSecret ? 'text' : 'password'}
                      value={companyIntegration?.googleCalendarClientSecret || ''}
                      onChange={(e) => {
                        const updated = { ...companyIntegration, googleCalendarClientSecret: e.target.value }
                        setCompanyIntegration(updated)
                      }}
                      placeholder="Gxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => togglePasswordVisibility('googleCalendarClientSecret')}
                    >
                      {showPasswords.googleCalendarClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await handleCompanyIntegrationSave({
                          googleCalendarClientId: companyIntegration?.googleCalendarClientId,
                          googleCalendarClientSecret: companyIntegration?.googleCalendarClientSecret,
                        })
                        toast.success('Başarılı', 'Google Meet bilgileri kaydedildi! Şimdi "OAuth Bağla" butonuna tıklayarak Google hesabınızı bağlayın.')
                      } catch (error: any) {
                        toast.error('Hata', error?.message || 'Kaydetme başarısız oldu')
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOAuthConnect('GOOGLE_CALENDAR')}
                    disabled={!companyIntegration?.googleCalendarClientId}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    OAuth Bağla
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleTestVideoMeeting('google-meet')}
                  title="Google Meet entegrasyonunuzun çalışıp çalışmadığını test edin"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Test Et
                </Button>
              </CardContent>
            </Card>
            
            {/* Microsoft Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Microsoft Teams
                </CardTitle>
                <CardDescription>Microsoft Teams toplantıları için otomatik link oluşturma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Kurulum Bilgisi</AlertTitle>
                  <AlertDescription>
                    Azure Portal'dan (<a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">portal.azure.com</a>) Client ID ve Secret alın. "Kaydet" butonuna tıklayın, ardından "OAuth Bağla" ile Microsoft hesabınızı bağlayın. Son olarak "Test Et" ile entegrasyonu test edin.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="teamsClientId">Microsoft Client ID</Label>
                  <Input
                    id="teamsClientId"
                    value={companyIntegration?.microsoftClientId || ''}
                    onChange={(e) => {
                      const updated = { ...companyIntegration, microsoftClientId: e.target.value }
                      setCompanyIntegration(updated)
                    }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamsClientSecret">Microsoft Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="teamsClientSecret"
                      type={showPasswords.microsoftClientSecret ? 'text' : 'password'}
                      value={companyIntegration?.microsoftClientSecret || ''}
                      onChange={(e) => {
                        const updated = { ...companyIntegration, microsoftClientSecret: e.target.value }
                        setCompanyIntegration(updated)
                      }}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => togglePasswordVisibility('microsoftClientSecret')}
                    >
                      {showPasswords.microsoftClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await handleCompanyIntegrationSave({
                          microsoftClientId: companyIntegration?.microsoftClientId,
                          microsoftClientSecret: companyIntegration?.microsoftClientSecret,
                        })
                        toast.success('Başarılı', 'Microsoft Teams bilgileri kaydedildi! Şimdi "OAuth Bağla" butonuna tıklayarak Microsoft hesabınızı bağlayın.')
                      } catch (error: any) {
                        toast.error('Hata', error?.message || 'Kaydetme başarısız oldu')
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOAuthConnect('MICROSOFT_CALENDAR')}
                    disabled={!companyIntegration?.microsoftClientId}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    OAuth Bağla
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleTestVideoMeeting('teams')}
                  title="Microsoft Teams entegrasyonunuzun çalışıp çalışmadığını test edin"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Test Et
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Pasif</SelectItem>
            <SelectItem value="ERROR">Hata</SelectItem>
          </SelectContent>
        </Select>
        <Select value={integrationType || 'all'} onValueChange={(value) => setIntegrationType(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Entegrasyon Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="GOOGLE_CALENDAR">Google Takvim</SelectItem>
            <SelectItem value="GOOGLE_EMAIL">Google E-posta</SelectItem>
            <SelectItem value="MICROSOFT_CALENDAR">Microsoft Takvim</SelectItem>
            <SelectItem value="MICROSOFT_EMAIL">Microsoft E-posta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entegrasyon</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Hata</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Henüz entegrasyon eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIntegrationIcon(integration.integrationType)}
                      <span className="font-medium">{getIntegrationName(integration.integrationType)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {integration.User ? (
                      <div>
                        <div className="font-medium">{integration.User.name}</div>
                        <div className="text-sm text-gray-500">{integration.User.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(integration.status)}</TableCell>
                  <TableCell>
                    {integration.lastError ? (
                      <span className="text-red-600 text-sm">{integration.lastError}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(integration.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/user-integrations/${integration.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(integration)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(integration.id, getIntegrationName(integration.integrationType))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <UserIntegrationForm
        integration={selectedIntegration || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedIntegration: UserIntegration) => {
          let updatedIntegrations: UserIntegration[]
          
          if (selectedIntegration) {
            // UPDATE
            updatedIntegrations = integrations.map((item) =>
              item.id === savedIntegration.id ? savedIntegration : item
            )
          } else {
            // CREATE
            updatedIntegrations = [savedIntegration, ...integrations]
          }
          
          await mutateIntegrations(updatedIntegrations, { revalidate: false })
          
          await Promise.all([
            mutate('/api/user-integrations', updatedIntegrations, { revalidate: false }),
            mutate('/api/user-integrations?', updatedIntegrations, { revalidate: false }),
            mutate(apiUrl, updatedIntegrations, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}

