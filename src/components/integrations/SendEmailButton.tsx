/**
 * Send Email Button Component
 * Ortak e-posta gönderme butonu - tüm sayfalarda kullanılabilir
 * Template desteği ile - EmailTemplate'lerden şablon seçilebilir
 */

'use client'

import { useState, useEffect } from 'react'
import { Mail, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { renderTemplate } from '@/lib/template-renderer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface EmailTemplate {
  id: string
  name: string
  subject: string | null
  body: string
  category: string
  variables?: string[]
}

interface SendEmailButtonProps {
  to: string | string[]
  subject: string
  html: string
  text?: string
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onSuccess?: () => void
  // Template desteği için yeni props
  category?: 'QUOTE' | 'INVOICE' | 'DEAL' | 'CUSTOMER' | 'GENERAL' // Template kategorisi
  entityData?: any // Entity verisi (template değişkenleri için)
  showTemplateSelector?: boolean // Template seçici gösterilsin mi?
}

export default function SendEmailButton({
  to,
  subject: initialSubject,
  html: initialHtml,
  text,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
  onSuccess,
  category,
  entityData,
  showTemplateSelector = true, // Varsayılan olarak göster
}: SendEmailButtonProps) {
  const [sendingEmail, setSendingEmail] = useState(false)
  const [hasEmailIntegration, setHasEmailIntegration] = useState<boolean | null>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  // Template desteği state'leri
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('CUSTOM')
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [renderedSubject, setRenderedSubject] = useState(initialSubject)
  const [renderedHtml, setRenderedHtml] = useState(initialHtml)
  const [renderedText, setRenderedText] = useState(text || '')

  // Template'leri çek (category varsa)
  const { data: templates = [] } = useData<EmailTemplate[]>(
    category && showTemplateSelector
      ? `/api/email-templates?category=${category}&isActive=true`
      : null,
    {
      dedupingInterval: 60000, // 1 dakika cache
      revalidateOnFocus: false,
    }
  )

  // Template değişkenlerini entity'den otomatik çıkar
  const getTemplateVariables = (): Record<string, string | number> => {
    const variables: Record<string, string | number> = {
      companyName: 'Şirket',
      userName: 'Kullanıcı',
    }

    if (!entityData) return variables

    // Entity tipine göre değişkenleri doldur
    if (category === 'QUOTE' && entityData) {
      variables.quoteTitle = entityData.title || ''
      variables.quoteTotal = entityData.totalAmount || entityData.total || 0
      variables.quoteNumber = entityData.quoteNumber || ''
      variables.customerName = entityData.customer?.name || entityData.Customer?.name || ''
      variables.customerEmail = entityData.customer?.email || entityData.Customer?.email || ''
      variables.dealTitle = entityData.deal?.title || entityData.Deal?.title || ''
    } else if (category === 'INVOICE' && entityData) {
      variables.invoiceTitle = entityData.title || ''
      variables.invoiceTotal = entityData.total || 0
      variables.invoiceNumber = entityData.invoiceNumber || ''
      variables.customerName = entityData.customer?.name || entityData.Customer?.name || ''
      variables.customerEmail = entityData.customer?.email || entityData.Customer?.email || ''
      variables.quoteTitle = entityData.quote?.title || entityData.Quote?.title || ''
    } else if (category === 'DEAL' && entityData) {
      variables.dealTitle = entityData.title || ''
      variables.dealValue = entityData.value || 0
      variables.customerName = entityData.customer?.name || entityData.Customer?.name || ''
      variables.customerEmail = entityData.customer?.email || entityData.Customer?.email || ''
    } else if (category === 'CUSTOMER' && entityData) {
      variables.customerName = entityData.name || ''
      variables.customerEmail = entityData.email || ''
      variables.customerPhone = entityData.phone || ''
    }

    return variables
  }

  // Template seçildiğinde render et
  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== 'CUSTOM' && templates.length > 0) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        const variables = getTemplateVariables()
        const subject = renderTemplate(template.subject || '', variables)
        const body = renderTemplate(template.body, variables)
        
        setRenderedSubject(subject)
        setRenderedHtml(body)
        setRenderedText('') // HTML template'lerde text genelde boş
      }
    } else {
      // Template seçilmemişse, initial değerleri kullan
      setRenderedSubject(initialSubject)
      setRenderedHtml(initialHtml)
      setRenderedText(text || '')
    }
  }, [selectedTemplateId, templates, initialSubject, initialHtml, text, entityData, category])

  // E-posta entegrasyonu kontrolü
  useEffect(() => {
    const checkIntegration = async () => {
      try {
        const res = await fetch('/api/integrations/email/check')
        if (!res.ok) {
          setHasEmailIntegration(false)
          return
        }
        const data = await res.json()
        setHasEmailIntegration(data.hasEmailIntegration && data.isActive)
      } catch (error) {
        console.error('Email integration check error:', error)
        setHasEmailIntegration(false)
      } finally {
        setCheckingIntegration(false)
      }
    }

    checkIntegration()
  }, [])

  const handleSendEmail = async () => {
    // Alıcı kontrolü
    const toArray = Array.isArray(to) ? to : [to]
    const validEmails = toArray.filter((email) => email && email.trim() !== '')

    if (validEmails.length === 0) {
      toast.error('Hata', { description: 'Alıcı e-posta adresi bulunamadı' })
      return
    }

    // E-posta entegrasyonu kontrolü
    if (hasEmailIntegration === false) {
      toast.error(
        'E-posta Entegrasyonu Yok',
        'E-posta göndermek için önce Kullanıcı Entegrasyonları sayfasından e-posta entegrasyonunu yapılandırın.\n\nKurulum:\n1. Resend API Key alın: https://resend.com/api-keys\n2. Kullanıcı Entegrasyonları > Email (Resend) bölümüne gidin\n3. API Key\'i girin ve "Kaydet" butonuna tıklayın\n4. Entegrasyonu aktifleştirin'
      )
      return
    }

    if (hasEmailIntegration === null || checkingIntegration) {
      toast.error('Kontrol Ediliyor', { description: 'E-posta entegrasyonu kontrol ediliyor, lütfen bekleyin...' })
      return
    }

    setSendingEmail(true)
    try {
      const res = await fetch('/api/integrations/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: validEmails,
          subject: renderedSubject,
          html: renderedHtml,
          text: renderedText,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'E-posta gönderilemedi')
      }

      const result = await res.json()
      toast.success('Başarılı', { description: `E-posta başarıyla gönderildi${validEmails.length > 1 ? ` (${validEmails.length} alıcı)` : ''}` })
      onSuccess?.()
      setLastError(null)
      setRetryCount(0)
      setTemplateDialogOpen(false) // Dialog'u kapat
    } catch (error: any) {
      console.error('Email send error:', error)
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu'
      setLastError(errorMessage)
      
      // Hata mesajına göre daha açıklayıcı toast - retry butonu ile
      if (error.message?.includes('entegrasyon') || error.message?.includes('integration')) {
        toast.error(
          'E-posta Entegrasyonu Hatası',
          'E-posta gönderilemedi. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden entegrasyonunuzu kontrol edin.',
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleSendEmail()
              },
            },
          } : undefined
        )
      } else {
        toast.error(
          'E-posta Gönderilemedi',
          errorMessage,
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleSendEmail()
              },
            },
          } : undefined
        )
      }
    } finally {
      setSendingEmail(false)
    }
  }

  // Entegrasyon kontrolü yapılırken buton gösterilmez veya disabled olur
  if (checkingIntegration) {
    return null // veya loading spinner gösterilebilir
  }

  // E-posta adresi yoksa buton gösterilmez
  const toArray = Array.isArray(to) ? to : [to]
  const hasValidEmail = toArray.some((email) => email && email.trim() !== '')

  if (!hasValidEmail) {
    return null
  }

  const hasTemplates = templates.length > 0 && category && showTemplateSelector

  return (
    <>
      <div className="flex items-center gap-2">
        {hasTemplates && (
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
            disabled={disabled || sendingEmail}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Şablon Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOM">Özel Mesaj</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant={variant}
          size={size}
          onClick={() => {
            if (hasTemplates && selectedTemplateId && selectedTemplateId !== 'CUSTOM') {
              // Template seçilmişse dialog aç (önizleme ve düzenleme için)
              setTemplateDialogOpen(true)
            } else if (hasTemplates && (!selectedTemplateId || selectedTemplateId === 'CUSTOM')) {
              // Template var ama seçilmemişse veya CUSTOM seçilmişse direkt gönder (özel mesaj)
              handleSendEmail()
            } else {
              // Template yoksa direkt gönder
              handleSendEmail()
            }
          }}
          disabled={disabled || sendingEmail || hasEmailIntegration === false}
          className={className}
          title={
            hasEmailIntegration === false
              ? 'E-posta entegrasyonu yapılandırılmamış'
              : sendingEmail
              ? 'E-posta gönderiliyor...'
              : 'E-posta gönder'
          }
        >
          {hasEmailIntegration === false ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Entegrasyon Yok
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              {sendingEmail ? 'Gönderiliyor...' : 'Mail Gönder'}
            </>
          )}
        </Button>
      </div>

      {/* Template Önizleme ve Gönderim Dialog'u */}
      {hasTemplates && (
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                E-posta Şablonu Önizleme
              </DialogTitle>
              <DialogDescription>
                Şablonu kontrol edin ve gönderin. Değişiklik yapmak isterseniz alanları düzenleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Konu */}
              <div className="space-y-2">
                <Label htmlFor="email-subject">Konu *</Label>
                <Input
                  id="email-subject"
                  value={renderedSubject}
                  onChange={(e) => setRenderedSubject(e.target.value)}
                  placeholder="E-posta konusu"
                  disabled={sendingEmail}
                />
              </div>

              {/* İçerik (HTML) */}
              <div className="space-y-2">
                <Label htmlFor="email-html">İçerik (HTML) *</Label>
                <Textarea
                  id="email-html"
                  value={renderedHtml}
                  onChange={(e) => setRenderedHtml(e.target.value)}
                  placeholder="E-posta içeriği"
                  rows={12}
                  disabled={sendingEmail}
                  className="font-mono text-sm"
                />
              </div>

              {/* Düz Metin (Opsiyonel) */}
              <div className="space-y-2">
                <Label htmlFor="email-text">Düz Metin (Opsiyonel)</Label>
                <Textarea
                  id="email-text"
                  value={renderedText}
                  onChange={(e) => setRenderedText(e.target.value)}
                  placeholder="HTML desteklemeyen e-posta istemcileri için düz metin versiyonu"
                  rows={6}
                  disabled={sendingEmail}
                />
              </div>

              {/* Alıcı Bilgisi */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Alıcı:</strong> {Array.isArray(to) ? to.join(', ') : to}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setTemplateDialogOpen(false)}
                disabled={sendingEmail}
              >
                İptal
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !renderedSubject.trim() || !renderedHtml.trim()}
              >
                {sendingEmail ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
