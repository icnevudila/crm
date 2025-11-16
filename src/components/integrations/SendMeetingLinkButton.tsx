'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Video, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import SendEmailButton from './SendEmailButton'
import SendWhatsAppButton from './SendWhatsAppButton'
import { toast } from '@/lib/toast'

interface SendMeetingLinkButtonProps {
  meetingUrl: string
  meetingTitle: string
  meetingDate: string
  meetingDuration?: number
  meetingPassword?: string
  meetingType?: 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS' | 'OTHER' | 'IN_PERSON'
  customerEmail?: string
  customerPhone?: string
  customerName?: string
}

export default function SendMeetingLinkButton({
  meetingUrl,
  meetingTitle,
  meetingDate,
  meetingDuration,
  meetingPassword,
  meetingType,
  customerEmail,
  customerPhone,
  customerName,
}: SendMeetingLinkButtonProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email')
  const [customMessage, setCustomMessage] = useState('')

  if (!meetingUrl || meetingUrl.trim() === '') {
    return null
  }

  // Toplantı tipine göre isim
  const meetingTypeName = meetingType === 'ZOOM' ? 'Zoom' 
    : meetingType === 'GOOGLE_MEET' ? 'Google Meet'
    : meetingType === 'TEAMS' ? 'Microsoft Teams'
    : 'Toplantı'

  // Varsayılan mesaj
  const defaultMessage = `Merhaba${customerName ? ` ${customerName}` : ''},

${meetingTitle} toplantısı için ${meetingTypeName} linki:

${meetingUrl}${meetingPassword ? `\n\nŞifre: ${meetingPassword}` : ''}

Tarih: ${new Date(meetingDate).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}
${meetingDuration ? `Süre: ${meetingDuration} dakika` : ''}

Toplantıda görüşmek üzere!`

  const message = customMessage.trim() || defaultMessage

  // Email için HTML formatı
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
        ${meetingTypeName} Toplantı Daveti
      </h2>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <p><strong>Toplantı:</strong> ${meetingTitle}</p>
        <p><strong>Tarih:</strong> ${new Date(meetingDate).toLocaleString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</p>
        ${meetingDuration ? `<p><strong>Süre:</strong> ${meetingDuration} dakika</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${meetingUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Toplantıya Katıl
          </a>
        </p>
        ${meetingPassword ? `<p style="margin-top: 10px;"><strong>Şifre:</strong> ${meetingPassword}</p>` : ''}
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          ${message.split('\n').slice(1).join('<br>')}
        </p>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
      </p>
    </div>
  `

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Video className="mr-2 h-4 w-4" />
          Toplantı Linki Gönder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Toplantı Linki Gönder</DialogTitle>
          <DialogDescription>
            Toplantı linkini e-posta veya WhatsApp üzerinden gönderin
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Gönderme Yöntemi Seçimi */}
          <div className="space-y-2">
            <Label>Gönderme Yöntemi</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50">
                <input
                  type="radio"
                  name="sendMethod"
                  value="email"
                  checked={sendMethod === 'email'}
                  onChange={(e) => setSendMethod(e.target.value as 'email' | 'whatsapp')}
                  className="h-4 w-4"
                />
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-posta
                  {!customerEmail && <span className="text-xs text-red-500">(E-posta adresi yok)</span>}
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50">
                <input
                  type="radio"
                  name="sendMethod"
                  value="whatsapp"
                  checked={sendMethod === 'whatsapp'}
                  onChange={(e) => setSendMethod(e.target.value as 'email' | 'whatsapp')}
                  className="h-4 w-4"
                />
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                  {!customerPhone && <span className="text-xs text-red-500">(Telefon numarası yok)</span>}
                </span>
              </label>
            </div>
          </div>

          {/* Özel Mesaj */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Özel Mesaj (Opsiyonel)</Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Varsayılan mesaj kullanılacak..."
              rows={6}
            />
            <p className="text-xs text-gray-500">
              Boş bırakırsanız varsayılan mesaj gönderilir
            </p>
          </div>

          {/* Önizleme */}
          <div className="space-y-2">
            <Label>Mesaj Önizlemesi</Label>
            <div className="p-3 bg-gray-50 rounded-md border text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
              {message}
            </div>
          </div>

          {/* Gönder Butonları */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            {sendMethod === 'email' && customerEmail ? (
              <SendEmailButton
                to={customerEmail}
                subject={`${meetingTypeName} Toplantı Daveti: ${meetingTitle}`}
                html={emailHtml}
                category="GENERAL"
                showTemplateSelector={false} // Meeting link gönderiminde template seçici gerekli değil
                onSuccess={() => {
                  setOpen(false)
                  toast.success('Başarılı', 'Toplantı linki e-posta ile gönderildi')
                }}
              />
            ) : sendMethod === 'whatsapp' && customerPhone ? (
              <SendWhatsAppButton
                to={customerPhone.startsWith('+') 
                  ? customerPhone 
                  : `+${customerPhone.replace(/\D/g, '')}`}
                message={message}
                onSuccess={() => {
                  setOpen(false)
                  toast.success('Başarılı', 'Toplantı linki WhatsApp ile gönderildi')
                }}
              />
            ) : (
              <Button disabled>
                {sendMethod === 'email' ? 'E-posta adresi gerekli' : 'Telefon numarası gerekli'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

