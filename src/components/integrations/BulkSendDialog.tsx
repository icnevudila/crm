'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Send, FileText, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { renderTemplate } from '@/lib/template-renderer'
import { Progress } from '@/components/ui/progress'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  [key: string]: any
}

interface EmailTemplate {
  id: string
  name: string
  subject: string | null
  body: string
  category: string
}

interface BulkSendDialogProps {
  open: boolean
  onClose: () => void
  customers: Customer[]
  selectedCustomerIds?: string[]
  onSuccess?: () => void
}

export default function BulkSendDialog({
  open,
  onClose,
  customers,
  selectedCustomerIds = [],
  onSuccess,
}: BulkSendDialogProps) {
  const [sendType, setSendType] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('CUSTOM')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedCustomerIdsState, setSelectedCustomerIdsState] = useState<string[]>(selectedCustomerIds)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const [previewRecipients, setPreviewRecipients] = useState<Customer[]>([])

  // Template'leri çek
  const { data: templates = [] } = useData<EmailTemplate[]>(
    sendType === 'email' ? '/api/email-templates?isActive=true' : null,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )

  // Seçili müşterileri güncelle
  useEffect(() => {
    if (selectedCustomerIds.length > 0) {
      setSelectedCustomerIdsState(selectedCustomerIds)
    }
  }, [selectedCustomerIds])

  // Template seçildiğinde mesajı doldur
  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== 'CUSTOM' && templates.length > 0) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        setSubject(template.subject || '')
        setMessage(template.body)
      }
    }
  }, [selectedTemplateId, templates])

  // Önizleme için ilk 3 müşteriyi seç
  useEffect(() => {
    const selectedCustomers = customers.filter((c) => selectedCustomerIdsState.includes(c.id))
    setPreviewRecipients(selectedCustomers.slice(0, 3))
  }, [selectedCustomerIdsState, customers])

  // Gönderim tipine göre geçerli müşterileri filtrele
  const validCustomers = customers.filter((customer) => {
    if (selectedCustomerIdsState.length > 0 && !selectedCustomerIdsState.includes(customer.id)) {
      return false
    }
    if (sendType === 'email') {
      return customer.email && customer.email.trim() !== ''
    } else {
      return customer.phone && customer.phone.trim() !== ''
    }
  })

  const handleSend = async () => {
    if (validCustomers.length === 0) {
      toast.error('Hata', 'Gönderilecek geçerli müşteri bulunamadı')
      return
    }
    if (!message.trim()) {
      toast.error('Hata', 'Mesaj içeriği boş')
      return
    }
    if (sendType === 'email' && !subject.trim()) {
      toast.error('Hata', 'E-posta konusu boş')
      return
    }

    setSending(true)
    setProgress({ sent: 0, failed: 0, total: validCustomers.length })

    try {
      const res = await fetch('/api/integrations/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validCustomers.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            ...c, // Tüm customer özelliklerini ekle (template değişkenleri için)
          })),
          type: sendType,
          subject: sendType === 'email' ? subject : undefined,
          message,
          templateId: selectedTemplateId && selectedTemplateId !== 'CUSTOM' ? selectedTemplateId : undefined,
          sendImmediately: true,
          delayBetweenMessages: 1, // 1 saniye gecikme
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Toplu gönderim başarısız oldu')
      }

      const result = await res.json()
      setProgress({
        sent: result.results.sent,
        failed: result.results.failed,
        total: result.results.total,
      })

      toast.success(
        'Başarılı',
        `${result.results.sent} mesaj başarıyla gönderildi${result.results.failed > 0 ? `, ${result.results.failed} başarısız` : ''}`
      )

      onSuccess?.()
      
      // 2 saniye sonra kapat
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error: any) {
      console.error('Bulk send error:', error)
      toast.error('Hata', error?.message || 'Toplu gönderim başarısız oldu')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setSendType('email')
    setSelectedTemplateId('CUSTOM')
    setSubject('')
    setMessage('')
    setProgress({ sent: 0, failed: 0, total: 0 })
    onClose()
  }

  // Önizleme render
  const renderPreview = (customer: Customer) => {
    const variables: Record<string, any> = {
      customerName: customer.name || '',
      companyName: customer.companyName || customer.Company?.name || '',
      ...customer,
    }

    const renderedMessage = renderTemplate(message || '{{customerName}}', variables)
    const renderedSubject = subject ? renderTemplate(subject, variables) : undefined

    return (
      <div key={customer.id} className="p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{customer.name}</span>
          <Badge variant="outline" className="text-xs">
            {sendType === 'email' ? customer.email : customer.phone}
          </Badge>
        </div>
        {sendType === 'email' && renderedSubject && (
          <p className="text-xs text-gray-600 mb-1">
            <strong>Konu:</strong> {renderedSubject}
          </p>
        )}
        <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">
          {renderedMessage}
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Toplu Mesaj Gönder
          </DialogTitle>
          <DialogDescription>
            {validCustomers.length} müşteriye toplu mesaj gönderin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Gönderim Tipi */}
          <div className="space-y-2">
            <Label>Gönderim Tipi</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                <input
                  type="radio"
                  name="sendType"
                  value="email"
                  checked={sendType === 'email'}
                  onChange={(e) => setSendType(e.target.value as any)}
                  className="h-4 w-4"
                />
                <Mail className="h-4 w-4 ml-2" />
                <span>E-posta</span>
                <Badge variant="outline" className="ml-auto">
                  {validCustomers.filter((c) => c.email).length}
                </Badge>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                <input
                  type="radio"
                  name="sendType"
                  value="sms"
                  checked={sendType === 'sms'}
                  onChange={(e) => setSendType(e.target.value as any)}
                  className="h-4 w-4"
                />
                <MessageSquare className="h-4 w-4 ml-2" />
                <span>SMS</span>
                <Badge variant="outline" className="ml-auto">
                  {validCustomers.filter((c) => c.phone).length}
                </Badge>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                <input
                  type="radio"
                  name="sendType"
                  value="whatsapp"
                  checked={sendType === 'whatsapp'}
                  onChange={(e) => setSendType(e.target.value as any)}
                  className="h-4 w-4"
                />
                <MessageSquare className="h-4 w-4 ml-2" />
                <span>WhatsApp</span>
                <Badge variant="outline" className="ml-auto">
                  {validCustomers.filter((c) => c.phone).length}
                </Badge>
              </label>
            </div>
          </div>

          {/* Template Seçimi (Sadece Email için) */}
          {sendType === 'email' && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Şablon Seç (Opsiyonel)</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Şablon seçin veya özel mesaj yazın" />
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
            </div>
          )}

          {/* Konu (Email için) */}
          {sendType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Konu *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E-posta konusu"
                disabled={sending}
              />
            </div>
          )}

          {/* Mesaj İçeriği */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Mesaj İçeriği * 
              <span className="text-xs text-gray-500 ml-2">
                ({'{{customerName}}'}, {'{{companyName}}'} gibi değişkenler kullanabilirsiniz)
              </span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesaj içeriğini yazın..."
              rows={8}
              disabled={sending}
            />
          </div>

          {/* Önizleme */}
          {message && previewRecipients.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Önizleme (İlk 3 Müşteri)
              </Label>
              <div className="space-y-2">
                {previewRecipients.map(renderPreview)}
              </div>
            </div>
          )}

          {/* İlerleme */}
          {sending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Gönderiliyor...</span>
                <span>
                  {progress.sent + progress.failed} / {progress.total}
                </span>
              </div>
              <Progress 
                value={progress.total > 0 ? ((progress.sent + progress.failed) / progress.total) * 100 : 0} 
                max={100} 
              />
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {progress.sent} başarılı
                </span>
                {progress.failed > 0 && (
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    {progress.failed} başarısız
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Uyarı */}
          {validCustomers.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span>
                {sendType === 'email'
                  ? 'Seçili müşterilerde e-posta adresi bulunamadı'
                  : 'Seçili müşterilerde telefon numarası bulunamadı'}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            İptal
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || validCustomers.length === 0 || !message.trim() || (sendType === 'email' && !subject.trim())}
          >
            {sending ? (
              <>
                <Send className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Gönder ({validCustomers.length} müşteri)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

