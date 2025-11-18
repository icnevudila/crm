'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, Edit2, Trash2, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toast } from '@/lib/toast'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ChatMessage {
  id: string
  message: string
  userId: string
  createdAt: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  replyToId?: string
  User?: {
    id: string
    name: string
    email: string
    image?: string
  }
  ReplyTo?: {
    id: string
    message: string
    User?: {
      id: string
      name: string
    }
  }
}

interface TeamChatProps {
  entityType: 'Customer' | 'Deal' | 'Quote' | 'Invoice' | 'General'
  entityId?: string
  title?: string
}

export default function TeamChat({ entityType, entityId, title }: TeamChatProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [channelId, setChannelId] = useState<string | null>(null)

  // Kanalı oluştur veya getir
  const { data: channels, mutate: mutateChannels } = useData<any[]>(
    `/api/chat/channels?entityType=${entityType}${entityId ? `&entityId=${entityId}` : ''}`,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    const createOrGetChannel = async () => {
      if (channels && channels.length > 0) {
        setChannelId(channels[0].id)
        return
      }

      // Kanal yoksa oluştur
      try {
        const res = await fetch('/api/chat/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType, entityId }),
        })

        if (res.ok) {
          const newChannel = await res.json()
          setChannelId(newChannel.id)
          mutateChannels()
        }
      } catch (error) {
        console.error('Channel create error:', error)
      }
    }

    createOrGetChannel()
  }, [channels, entityType, entityId, mutateChannels])

  // Mesajları getir
  const { data: messages = [], mutate: mutateMessages } = useData<ChatMessage[]>(
    channelId ? `/api/chat/messages?channelId=${channelId}` : null,
    {
      dedupingInterval: 1000, // 1 saniye cache - real-time için kısa
      revalidateOnFocus: true,
      refreshInterval: 3000, // 3 saniyede bir yenile
    }
  )

  // Mesaj gönderildiğinde scroll yap
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || !channelId || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          message: message.trim(),
          replyToId: replyToId || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Mesaj gönderilemedi')
      }

      setMessage('')
      setReplyToId(null)
      await mutateMessages()
      await mutateChannels()
    } catch (error: any) {
      console.error('Send message error:', error)
      toast.error('Mesaj gönderilemedi', error?.message)
    } finally {
      setSending(false)
    }
  }

  const handleEdit = async (messageId: string, newMessage: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Mesaj güncellenemedi')
      }

      setEditingId(null)
      await mutateMessages()
    } catch (error: any) {
      console.error('Edit message error:', error)
      toast.error('Mesaj güncellenemedi', error?.message)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Mesaj silinemedi')
      }

      await mutateMessages()
      await mutateChannels()
    } catch (error: any) {
      console.error('Delete message error:', error)
      toast.error('Mesaj silinemedi', error?.message)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  return (
    <Card className="border-2 border-indigo-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{title || 'Takım Sohbeti'}</span>
          {messages.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              {messages.length} mesaj
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mesajlar */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henüz mesaj yok</p>
              <p className="text-sm mt-1">İlk mesajı siz gönderin!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.User?.image} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                    {getInitials(msg.User?.name, msg.User?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {/* Yanıt mesajı gösterimi */}
                  {msg.ReplyTo && (
                    <div className="mb-1 pl-3 border-l-2 border-gray-200 text-xs text-gray-500">
                      <span className="font-medium">{msg.ReplyTo.User?.name}:</span>{' '}
                      {msg.ReplyTo.message.slice(0, 50)}
                      {msg.ReplyTo.message.length > 50 && '...'}
                    </div>
                  )}
                  
                  {/* Mesaj içeriği */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.User?.name || 'Bilinmeyen'}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                      {editingId === msg.id ? (
                        <Input
                          defaultValue={msg.message}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleEdit(msg.id, e.currentTarget.value)
                            }
                            if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                          }}
                          autoFocus
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      )}
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                        >
                          📎 {msg.fileName || 'Dosya'}
                        </a>
                      )}
                    </div>
                    
                    {/* Mesaj aksiyonları */}
                    {editingId !== msg.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setReplyToId(msg.id)}
                          title="Yanıtla"
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingId(msg.id)}
                          title="Düzenle"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(msg.id)}
                          title="Sil"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Yanıt gösterimi */}
        {replyToId && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-600">Yanıtlanıyor:</span>
            <span className="font-medium">
              {messages.find((m) => m.id === replyToId)?.message.slice(0, 50)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={() => setReplyToId(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Mesaj gönderme */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Mesaj yazın... (Enter ile gönder)"
            disabled={sending || !channelId}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending || !channelId}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}




