/**
 * Toast Confirmation Helper
 * Kullanıcıya otomasyon gönderimi için onay modal'ı gösterir
 * Modal içinde email/SMS/WhatsApp gönderim formu açar
 */

'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Mail, MessageSquare, MessageCircle, Send, X } from 'lucide-react'
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
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'

export interface AutomationConfirmationOptions {
  entityType: 'DEAL' | 'QUOTE' | 'INVOICE' | 'MEETING'
  entityId: string
  entityTitle: string
  customerEmail?: string
  customerPhone?: string
  customerName?: string
  defaultSubject?: string
  defaultMessage?: string
  defaultHtml?: string
  onSent?: () => void
  onCancel?: () => void
  onAlwaysSend?: () => void
  onNeverSend?: () => void
}

/**
 * Otomasyon onay modal'ı
 * Direkt kullanım için export edilmiş component
 */
export function AutomationConfirmationModal({
  type,
  options,
  open,
  onClose,
}: {
  type: 'email' | 'sms' | 'whatsapp'
  options: AutomationConfirmationOptions
  open: boolean
  onClose: () => void
}) {
  const [subject, setSubject] = useState(options.defaultSubject || `${options.entityTitle} - Bilgilendirme`)
  const [message, setMessage] = useState(options.defaultMessage || '')
  const [html, setHtml] = useState(options.defaultHtml || '')

  const handleClose = () => {
    onClose()
  }

  const handleAlwaysSend = async () => {
    // Backend'e "ALWAYS" tercihini kaydet
    try {
      await fetch('/api/automations/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automationType: `${type}On${options.entityType}Created`,
          preference: 'ALWAYS',
        }),
      })
    } catch (error) {
      console.error('Error saving preference:', error)
    }

    options.onAlwaysSend?.()
    handleClose()
  }

  const handleNeverSend = async () => {
    // Backend'e "NEVER" tercihini kaydet
    try {
      await fetch('/api/automations/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automationType: `${type}On${options.entityType}Created`,
          preference: 'NEVER',
        }),
      })
    } catch (error) {
      console.error('Error saving preference:', error)
    }

    options.onNeverSend?.()
    handleClose()
  }

  const entityTypeLabel = {
    DEAL: 'Fırsat',
    QUOTE: 'Teklif',
    INVOICE: 'Fatura',
    MEETING: 'Toplantı',
  }[options.entityType]

  const typeLabel = {
    email: 'E-posta',
    sms: 'SMS',
    whatsapp: 'WhatsApp',
  }[type]

  const recipient = type === 'email' ? options.customerEmail : options.customerPhone

  if (!recipient) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose()
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'email' && <Mail className="h-5 w-5" />}
            {type === 'sms' && <MessageSquare className="h-5 w-5" />}
            {type === 'whatsapp' && <MessageCircle className="h-5 w-5" />}
            {entityTypeLabel} {typeLabel} Gönder
          </DialogTitle>
          <DialogDescription>
            {options.customerName && (
              <span className="font-semibold">{options.customerName}</span>
            )} müşterisine <span className="font-semibold">{options.entityTitle}</span> {entityTypeLabel.toLowerCase()}ı hakkında {typeLabel.toLowerCase()} göndermek istiyor musunuz?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Alıcı Bilgisi */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Alıcı:</strong> {recipient}
            </p>
          </div>

          {/* Email için: Konu ve HTML */}
          {type === 'email' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Konu *</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E-posta konusu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-html">İçerik (HTML) *</Label>
                <Textarea
                  id="email-html"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="E-posta içeriği"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}

          {/* SMS/WhatsApp için: Mesaj */}
          {(type === 'sms' || type === 'whatsapp') && (
            <div className="space-y-2">
              <Label htmlFor="message">Mesaj *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`${typeLabel} mesajı`}
                rows={6}
              />
              <p className="text-xs text-gray-500">
                {type === 'sms' && 'SMS mesajları maksimum 160 karakter olmalıdır.'}
                {type === 'whatsapp' && 'WhatsApp mesajları daha uzun olabilir.'}
              </p>
            </div>
          )}

          {/* Gönder Butonları */}
          <div className="flex flex-col gap-2 pt-4">
            {/* Ana Gönder Butonu */}
            {type === 'email' && recipient && (
              <SendEmailButton
                to={recipient}
                subject={subject}
                html={html || `<p>${message || options.entityTitle}</p>`}
                category="GENERAL"
                showTemplateSelector={false}
                onSuccess={() => {
                  options.onSent?.()
                  handleClose()
                  toast.success('Başarılı', `${typeLabel} başarıyla gönderildi`)
                }}
              />
            )}
            {(type === 'sms' || type === 'whatsapp') && recipient && (
              <>
                {type === 'sms' && (
                  <SendSmsButton
                    to={recipient.startsWith('+') ? recipient : `+${recipient.replace(/\D/g, '')}`}
                    message={message || options.entityTitle}
                    onSuccess={() => {
                      options.onSent?.()
                      handleClose()
                      toast.success('Başarılı', `${typeLabel} başarıyla gönderildi`)
                    }}
                  />
                )}
                {type === 'whatsapp' && (
                  <SendWhatsAppButton
                    to={recipient.startsWith('+') ? recipient : `+${recipient.replace(/\D/g, '')}`}
                    message={message || options.entityTitle}
                    onSuccess={() => {
                      options.onSent?.()
                      handleClose()
                      toast.success('Başarılı', `${typeLabel} başarıyla gönderildi`)
                    }}
                  />
                )}
              </>
            )}

            {/* Tercih Butonları */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAlwaysSend}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Her Zaman Gönder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNeverSend}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Hiç Gönderme
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                İptal
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
