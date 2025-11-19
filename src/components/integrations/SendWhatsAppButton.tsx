'use client'

import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'

interface SendWhatsAppButtonProps {
  phoneNumber?: string
  entityType?: string
  entityId?: string
  customerName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function SendWhatsAppButton({
  phoneNumber: initialPhoneNumber,
  entityType,
  entityId,
  customerName,
  variant = 'outline',
  size = 'default',
}: SendWhatsAppButtonProps) {
  const [open, setOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast.error('Telefon numarası ve mesaj gereklidir')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/integrations/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          message,
          entityType,
          entityId,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'WhatsApp mesajı gönderilemedi')
      }

      const data = await res.json()
      toast.success('WhatsApp mesajı gönderildi')
      setOpen(false)
      setMessage('')
    } catch (error: any) {
      console.error('Send WhatsApp error:', error)
      toast.error('WhatsApp mesajı gönderilemedi', error?.message)
    } finally {
      setSending(false)
    }
  }

  const defaultMessage = customerName
    ? `Merhaba ${customerName},\n\n`
    : 'Merhaba,\n\n'

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          setPhoneNumber(initialPhoneNumber || '')
          setMessage(defaultMessage)
          setOpen(true)
        }}
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        {size !== 'icon' && 'WhatsApp'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>WhatsApp Mesajı Gönder</DialogTitle>
            <DialogDescription>
              {customerName
                ? `${customerName} müşterisine WhatsApp mesajı gönderin`
                : 'WhatsApp mesajı gönderin'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon Numarası</Label>
              <Input
                id="phone"
                placeholder="905551234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={sending}
              />
              <p className="text-xs text-gray-500">
                Ülke kodu ile birlikte girin (örn: 905551234567)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mesaj</Label>
              <Textarea
                id="message"
                placeholder="Mesajınızı yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                disabled={sending}
              />
              <p className="text-xs text-gray-500">
                {message.length} karakter
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              İptal
            </Button>
            <Button onClick={handleSend} disabled={sending || !phoneNumber.trim() || !message.trim()}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
