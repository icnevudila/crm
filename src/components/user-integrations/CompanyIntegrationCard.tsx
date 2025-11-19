'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Save, CheckCircle2, XCircle, Send } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface Field {
  key: string
  label: string
  type: 'text' | 'password'
  placeholder?: string
}

interface CompanyIntegrationCardProps {
  title: string
  description: string
  fields: Field[]
  enabledKey: string
  statusKey: string
  onSave: (data: any) => Promise<void>
  testEndpoint?: string // Test endpoint URL (örn: '/api/integrations/test/sms')
  testLabel?: string // Test butonu label'ı (örn: 'Test SMS Gönder')
}

export default function CompanyIntegrationCard({
  title,
  description,
  fields,
  enabledKey,
  statusKey,
  onSave,
  testEndpoint,
  testLabel = 'Test Gönder',
}: CompanyIntegrationCardProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [enabled, setEnabled] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // CompanyIntegration verilerini çek
  const { data: integration, mutate: mutateIntegration } = useData<any>(
    session?.user?.companyId ? `/api/company-integrations?companyId=${session.user.companyId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  // Form'u integration verileriyle doldur
  useEffect(() => {
    if (integration) {
      const newFormData: Record<string, string> = {}
      fields.forEach((field) => {
        newFormData[field.key] = (integration as any)[field.key] || ''
      })
      setFormData(newFormData)
      
      // Enabled kontrolü
      setEnabled((integration as any)[enabledKey] || false)
    }
  }, [integration, fields, enabledKey])

  const handleSave = async () => {
    if (!session?.user?.companyId) return

    setSaving(true)
    try {
      const updateData: any = {
        companyId: session.user.companyId,
      }

      // Enabled ve status güncellemesi
      updateData[enabledKey] = enabled
      
      // Resend için özel kontrol
      if (enabledKey === 'resendEnabled') {
        updateData.resendApiKey = enabled ? formData.resendApiKey : null
        updateData.emailStatus = enabled && formData.resendApiKey ? 'ACTIVE' : 'INACTIVE'
        updateData.emailProvider = enabled && formData.resendApiKey ? 'RESEND' : null
      } else {
        updateData[statusKey] = enabled ? 'ACTIVE' : 'INACTIVE'
      }

      fields.forEach((field) => {
        if (formData[field.key]) {
          updateData[field.key] = formData[field.key]
        } else if (!enabled) {
          // Disable edildiğinde alanları temizle
          updateData[field.key] = null
        }
      })

      await onSave(updateData)
      
      // Cache'i güncelle
      await mutateIntegration({ ...integration, ...updateData }, { revalidate: false })
      await mutate(`/api/company-integrations?companyId=${session.user.companyId}`, { ...integration, ...updateData }, { revalidate: false })
    } catch (error: any) {
      console.error('Save error:', error)
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (fieldKey: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }))
  }

  const handleTest = async () => {
    if (!testEndpoint) return

    // Önce kaydedilmiş mi kontrol et
    if (!integration?.[statusKey] || integration?.[statusKey] !== 'ACTIVE') {
      alert('Lütfen önce entegrasyonu kaydedin ve aktifleştirin.')
      return
    }

    // Gerekli alanların dolu olduğunu kontrol et
    const hasRequiredFields = fields.every(field => {
      const value = formData[field.key] || integration?.[field.key]
      return value && value.trim() !== ''
    })

    if (!hasRequiredFields) {
      alert('Lütfen önce tüm gerekli alanları doldurup kaydedin.')
      return
    }

    setTesting(true)
    try {
      const res = await fetch(testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Test başarısız oldu')
      }

      // Başarılı mesajı göster
      alert(`✅ Test Başarılı!\n\n${data.message || 'API bilgileriniz doğru ve çalışıyor!'}`)
      
      // Status'u güncelle (başarılı test = ACTIVE)
      if (integration) {
        const updatedIntegration = { ...integration, [statusKey]: 'ACTIVE' }
        await mutateIntegration(updatedIntegration, { revalidate: false })
        await mutate(`/api/company-integrations?companyId=${session.user.companyId}`, updatedIntegration, { revalidate: false })
      }
    } catch (error: any) {
      console.error('Test error:', error)
      const errorMessage = error?.message || 'Test başarısız oldu'
      
      // Hata mesajını göster
      alert(`❌ Test Başarısız!\n\n${errorMessage}\n\nLütfen API bilgilerinizi kontrol edin.`)
      
      // Status'u ERROR olarak güncelle
      if (integration) {
        const updatedIntegration = { ...integration, [statusKey]: 'ERROR' }
        await mutateIntegration(updatedIntegration, { revalidate: false })
        await mutate(`/api/company-integrations?companyId=${session.user.companyId}`, updatedIntegration, { revalidate: false })
      }
    } finally {
      setTesting(false)
    }
  }

  const getStatusBadge = () => {
    const status = integration?.[statusKey]
    if (status === 'ACTIVE') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Aktif</Badge>
    }
    if (status === 'ERROR') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Hata</Badge>
    }
    return <Badge variant="secondary">Pasif</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled && (
          <>
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'password' ? (
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={showPasswords[field.key] ? 'text' : 'password'}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => togglePasswordVisibility(field.key)}
                    >
                      {showPasswords[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Input
                    id={field.key}
                    type="text"
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              {testEndpoint && enabled && (
                <Button 
                  onClick={handleTest} 
                  disabled={testing || saving} 
                  variant="outline"
                  className="flex-1"
                  title="API bilgilerinizin doğru ve çalışır olduğunu test edin"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {testing ? 'Test Ediliyor...' : testLabel}
                </Button>
              )}
            </div>
          </>
        )}
        {!enabled && (
          <p className="text-sm text-gray-500 text-center py-4">
            Entegrasyonu aktifleştirmek için yukarıdaki switch'i açın
          </p>
        )}
      </CardContent>
    </Card>
  )
}

