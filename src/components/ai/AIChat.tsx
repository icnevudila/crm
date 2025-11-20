'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Send, Loader2, X, Command, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { COMMAND_EXAMPLES } from '@/lib/ai/commands'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  open: boolean
  onClose: () => void
  initialPrompt?: string
}

export default function AIChat({ open, onClose, initialPrompt }: AIChatProps) {
  const locale = useLocale()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialPrompt || '')
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const isTurkish = locale === 'tr'

  // Komut mu yoksa normal mesaj mı kontrol et
  const isCommand = (text: string): boolean => {
    const commandKeywords = isTurkish
      ? ['oluştur', 'ekle', 'yeni', 'özetle', 'sil', 'güncelle', 'göster', 'listele']
      : ['create', 'add', 'new', 'summarize', 'delete', 'update', 'show', 'list']
    return commandKeywords.some((keyword) => text.toLowerCase().includes(keyword))
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    const userInput = input
    setInput('')
    setLoading(true)

    try {
      // Komut ise komut endpoint'ini kullan
      if (isCommand(userInput)) {
        const res = await fetch('/api/ai/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: userInput,
            locale,
          }),
        })

        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          throw new Error(error.message || error.error || 'Komut çalıştırılamadı')
        }

        const result = await res.json()
        
        if (result.success) {
          // Kısa ve öz mesaj göster
          const shortMessage = result.message.replace('✅ ', '')
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: `✅ ${shortMessage}`,
            },
          ])
          toast.success('Başarılı', { description: shortMessage })
          
          // Sayfayı yenile (yeni oluşturulan verileri görmek için)
          if (result.data) {
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }
        } else {
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: `❌ ${result.message}`,
            },
          ])
          toast.error('Hata', { description: result.message })
        }
      } else {
        // Normal chat mesajı
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userInput,
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            locale,
          }),
        })

        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          throw new Error(error.error || 'AI yanıtı alınamadı')
        }

        const { response } = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: response }])
      }
    } catch (error: any) {
      console.error('AI Chat Error:', error)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `❌ ${error?.message || (isTurkish ? 'Bir hata oluştu' : 'An error occurred')}`,
        },
      ])
      toast.error('Hata', { description: error?.message || 'AI yanıtı alınamadı' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Asistan
          </DialogTitle>
          <DialogDescription>
            CRM işlerinizde size yardımcı olmak için buradayım
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-indigo-200" />
                <p className="font-semibold mb-2">
                  {isTurkish ? 'Merhaba! Size nasıl yardımcı olabilirim?' : 'Hello! How can I help you?'}
                </p>
                <p className="text-sm mb-4">
                  {isTurkish
                    ? 'Komut vererek işlem yapabilir veya soru sorabilirsiniz'
                    : 'You can give commands or ask questions'}
                </p>
                {showHelp && (
                  <div className="mt-4 text-left space-y-2">
                    <p className="font-semibold text-gray-700 mb-2">
                      {isTurkish ? 'Örnek Komutlar:' : 'Example Commands:'}
                    </p>
                    {COMMAND_EXAMPLES[locale].slice(0, 5).map((example, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                        <Badge variant="outline" className="mr-2">
                          <Command className="h-3 w-3 mr-1" />
                          {example.command}
                        </Badge>
                        <span className="text-gray-600">{example.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!showHelp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(true)}
                    className="mt-2"
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    {isTurkish ? 'Komut örneklerini göster' : 'Show command examples'}
                  </Button>
                )}
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

