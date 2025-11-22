'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, Loader2, X, Command, HelpCircle, Minimize2, CheckCircle, ExternalLink, AlertCircle, History, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { COMMAND_EXAMPLES } from '@/lib/ai/commands'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function FloatingAIChat() {
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => {
    // localStorage'dan mesajları yükle
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-chat-messages')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [pendingCommand, setPendingCommand] = useState<{ input: string; parsed: any } | null>(null)
  const [commandPreview, setCommandPreview] = useState<any>(null)
  const [commandResult, setCommandResult] = useState<any>(null)
  const [commandHistory, setCommandHistory] = useState<Array<{ command: string; timestamp: string; success: boolean }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-command-history')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isTurkish = locale === 'tr'

  // Mesajlar değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('ai-chat-messages', JSON.stringify(messages))
    }
  }, [messages])

  // Komut geçmişini kaydet
  const saveCommandToHistory = (command: string, success: boolean) => {
    const newHistory = [
      { command, timestamp: new Date().toISOString(), success },
      ...commandHistory.slice(0, 49), // Son 50 komutu tut
    ]
    setCommandHistory(newHistory)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-command-history', JSON.stringify(newHistory))
    }
  }

  // Chat kapatıldığında mesajları temizleme (opsiyonel - kullanıcı isterse temizleyebilir)
  const handleClearChat = () => {
    setMessages([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai-chat-messages')
    }
  }

  // Mesajlar değiştiğinde en alta scroll
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Custom event listener - Form'lardan AI chat açma
  useEffect(() => {
    const handleOpenAIChat = (event: CustomEvent) => {
      setIsOpen(true)
      setIsMinimized(false)
      if (event.detail?.initialMessage) {
        // Input'u set et ve otomatik gönder
        const messageText = event.detail.initialMessage
        setInput(messageText)
        
        // Küçük bir gecikme ile mesajı gönder
        setTimeout(() => {
          // Mesajı direkt gönder (handleSend logic'ini kullan)
          if (messageText.trim()) {
            const userMessage: Message = { role: 'user', content: messageText }
            setMessages((prev) => [...prev, userMessage])
            setInput('')
            setLoading(true)

            // Komut mu kontrol et
            const commandKeywords = isTurkish
              ? ['oluştur', 'ekle', 'yeni', 'özetle', 'sil', 'güncelle', 'göster', 'listele']
              : ['create', 'add', 'new', 'summarize', 'delete', 'update', 'show', 'list']
            const isCmd = commandKeywords.some((keyword) => messageText.toLowerCase().includes(keyword))

            if (isCmd) {
              // Komut - preview al
              fetch('/api/ai/command/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  command: messageText,
                  locale,
                }),
              })
                .then((res) => res.json())
                .then((previewData) => {
                  if (previewData.success) {
                    setCommandPreview(previewData.preview)
                    setPendingCommand({ input: messageText, parsed: previewData.command })
                    setApprovalDialogOpen(true)
                    setLoading(false)
                  } else {
                    throw new Error(previewData.message || 'Preview oluşturulamadı')
                  }
                })
                .catch((error: any) => {
                  console.error('AI Chat Error:', error)
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: `❌ ${error?.message || (isTurkish ? 'Bir hata oluştu' : 'An error occurred')}`,
                    },
                  ])
                  toast.error('Hata', { description: error?.message || 'AI yanıtı alınamadı' })
                  setLoading(false)
                })
            } else {
              // Normal chat
              fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: messageText,
                  messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
                  locale,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
                  setLoading(false)
                })
                .catch((error: any) => {
                  console.error('AI Chat Error:', error)
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: `❌ ${error?.message || (isTurkish ? 'Bir hata oluştu' : 'An error occurred')}`,
                    },
                  ])
                  toast.error('Hata', { description: error?.message || 'AI yanıtı alınamadı' })
                  setLoading(false)
                })
            }
          }
        }, 500)
      }
    }

    window.addEventListener('open-ai-chat', handleOpenAIChat as EventListener)
    return () => {
      window.removeEventListener('open-ai-chat', handleOpenAIChat as EventListener)
    }
  }, [locale, isTurkish]) // Sadece locale ve isTurkish dependency - messages ve loading closure içinde kullanılacak

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
      // Komut ise önce preview göster, onay bekle
      if (isCommand(userInput)) {
        // 1. Preview al
        const previewRes = await fetch('/api/ai/command/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: userInput,
            locale,
          }),
        })

        if (!previewRes.ok) {
          const error = await previewRes.json().catch(() => ({}))
          throw new Error(error.message || error.error || 'Preview oluşturulamadı')
        }

        const previewData = await previewRes.json()
        
        if (!previewData.success) {
          throw new Error(previewData.message || 'Preview oluşturulamadı')
        }

        // 2. Preview'ı göster ve onay bekle
        setCommandPreview(previewData.preview)
        setPendingCommand({ input: userInput, parsed: previewData.command })
        setApprovalDialogOpen(true)
        setLoading(false)
        return
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

  // Onay sonrası komutu çalıştır
  const handleApproveCommand = async () => {
    if (!pendingCommand || !commandPreview) return

    setApprovalDialogOpen(false)
    setLoading(true)

    try {
      // Execute endpoint'ini çağır
      const executeRes = await fetch('/api/ai/command/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: pendingCommand.parsed,
          locale,
        }),
      })

      if (!executeRes.ok) {
        const error = await executeRes.json().catch(() => ({}))
        throw new Error(error.message || error.error || 'Komut çalıştırılamadı')
      }

      const result = await executeRes.json()
      
      if (result.success) {
        // Komut geçmişine ekle
        saveCommandToHistory(pendingCommand.input, true)
        
        // Başarılı mesaj ekle
        const shortMessage = result.message.replace('✅ ', '')
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `✅ ${shortMessage}`,
          },
        ])
        
        // Sonuç modal'ını göster
        setCommandResult(result)
        setResultModalOpen(true)
        
        toast.success('Başarılı', { description: shortMessage })
        
        // Cache'i güncelle (sayfa yenilemeden)
        if (result.data) {
          // SWR cache'i invalidate et
          if (typeof window !== 'undefined' && (window as any).mutate) {
            const { mutate } = await import('swr')
            mutate(() => true) // Tüm cache'i invalidate et
          }
        }
      } else {
        // Başarısız komutu geçmişe ekle
        saveCommandToHistory(pendingCommand.input, false)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `❌ ${result.message}`,
          },
        ])
        toast.error('Hata', { description: result.message })
      }
    } catch (error: any) {
      console.error('Command execute error:', error)
      
      // Hata durumunda komut geçmişine ekle
      if (pendingCommand) {
        saveCommandToHistory(pendingCommand.input, false)
      }
      
      // Daha açıklayıcı hata mesajı
      const errorMessage = error?.message || (isTurkish ? 'Komut çalıştırılamadı' : 'Command failed')
      const friendlyMessage = isTurkish
        ? `İşlem sırasında bir hata oluştu: ${errorMessage}. Lütfen komutu kontrol edip tekrar deneyin.`
        : `An error occurred during the operation: ${errorMessage}. Please check the command and try again.`
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${friendlyMessage}`,
        },
      ])
      toast.error(isTurkish ? 'Hata' : 'Error', { 
        description: friendlyMessage,
        duration: 6000, // Hata mesajları daha uzun gösterilsin
      })
    } finally {
      setLoading(false)
      setPendingCommand(null)
      setCommandPreview(null)
    }
  }

  const handleRejectCommand = () => {
    setApprovalDialogOpen(false)
    setPendingCommand(null)
    setCommandPreview(null)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: isTurkish ? '❌ İşlem iptal edildi' : '❌ Operation cancelled',
      },
    ])
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button kaldırıldı - Header'da gösteriliyor */}

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed top-20 right-4 z-50 w-[400px] bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col',
              isMinimized ? 'h-12' : 'h-[600px]'
            )}
          >
            {/* Header - Düz indigo, gradient yok */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-indigo-600 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-white" />
                <h3 className="font-semibold text-white text-sm">784 AI</h3>
                <Badge className="bg-indigo-500 text-white text-xs font-medium">AI</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setHistoryModalOpen(true)}
                  className="h-7 w-7 text-white hover:bg-white/20"
                  title={isTurkish ? 'Komut geçmişi' : 'Command history'}
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 text-white hover:bg-white/20"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false)
                    setIsMinimized(false)
                    // Mesajlar korunur, sadece panel kapanır
                  }}
                  className="h-7 w-7 text-white hover:bg-white/20"
                  title={isTurkish ? 'Kapat (mesajlar korunur)' : 'Close (messages saved)'}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-indigo-200" />
                      <p className="font-semibold mb-2">
                        {isTurkish ? 'Merhaba! Size nasıl yardımcı olabilirim?' : 'Hello! How can I help you?'}
                      </p>
                      <p className="text-sm mb-4">
                        {isTurkish
                          ? 'Komut vererek işlem yapabilir veya soru sorabilirsiniz. Mesajlarınız otomatik olarak kaydedilir.'
                          : 'You can give commands or ask questions. Your messages are automatically saved.'}
                      </p>
                      {showHelp && (
                        <div className="mt-4 text-left space-y-2">
                          <p className="font-semibold text-gray-700 mb-2">
                            {isTurkish ? 'Örnek Komutlar:' : 'Example Commands:'}
                          </p>
                          {COMMAND_EXAMPLES[locale].slice(0, 5).map((example, idx) => (
                            <div key={idx} className="bg-white p-2 rounded text-xs border border-gray-200">
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
                          'max-w-[80%] rounded-lg px-3 py-2',
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2 p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearChat}
                      className="h-10 w-10 text-gray-500 hover:text-red-600"
                      title={isTurkish ? 'Sohbeti temizle' : 'Clear chat'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Input
                    data-ai-chat-input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isTurkish ? 'Mesajınızı yazın...' : 'Type your message...'}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onay Dialog'u */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {isTurkish ? 'İşlem Onayı' : 'Action Confirmation'}
            </DialogTitle>
            <DialogDescription>
              {isTurkish 
                ? 'Bu işlemi yapmak istediğinize emin misiniz?'
                : 'Are you sure you want to perform this action?'}
            </DialogDescription>
          </DialogHeader>
          
          {commandPreview && (
            <div className="space-y-3 py-4">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <p className="text-sm font-semibold text-indigo-900 mb-2">
                  {isTurkish ? 'Yapılacak İşlem:' : 'Action:'}
                </p>
                <p className="text-sm text-indigo-700">{commandPreview.action}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {isTurkish ? 'Açıklama:' : 'Description:'}
                </p>
                <p className="text-sm text-gray-700">{commandPreview.description}</p>
              </div>

              {Object.keys(commandPreview.details || {}).length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {isTurkish ? 'Detaylar:' : 'Details:'}
                  </p>
                  <div className="space-y-1">
                    {Object.entries(commandPreview.details).map(([key, value]) => (
                      <div key={key} className="text-xs text-slate-700">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRejectCommand}
            >
              {isTurkish ? 'İptal' : 'Cancel'}
            </Button>
            <Button
              onClick={handleApproveCommand}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isTurkish ? 'Onayla' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sonuç Modal'ı */}
      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {isTurkish ? 'İşlem Tamamlandı' : 'Operation Completed'}
            </DialogTitle>
            <DialogDescription>
              {commandResult?.message || (isTurkish ? 'İşlem başarıyla tamamlandı' : 'Operation completed successfully')}
            </DialogDescription>
          </DialogHeader>
          
          {commandResult?.data && (
            <div className="space-y-3 py-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  {isTurkish ? 'Oluşturulan Kayıt:' : 'Created Record:'}
                </p>
                <div className="space-y-1">
                  {commandResult.data.id && (
                    <p className="text-xs text-green-700">
                      <span className="font-medium">ID:</span> {commandResult.data.id}
                    </p>
                  )}
                  {commandResult.data.name && (
                    <p className="text-xs text-green-700">
                      <span className="font-medium">{isTurkish ? 'İsim:' : 'Name:'}</span> {commandResult.data.name}
                    </p>
                  )}
                  {commandResult.data.title && (
                    <p className="text-xs text-green-700">
                      <span className="font-medium">{isTurkish ? 'Başlık:' : 'Title:'}</span> {commandResult.data.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResultModalOpen(false)}
            >
              {isTurkish ? 'Kapat' : 'Close'}
            </Button>
            {commandResult?.link && (
              <Link href={commandResult.link} prefetch={true}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isTurkish ? 'Detayları Gör' : 'View Details'}
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Komut Geçmişi Modal'ı */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-md max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              {isTurkish ? 'Komut Geçmişi' : 'Command History'}
            </DialogTitle>
            <DialogDescription>
              {isTurkish 
                ? 'Verdiğiniz son komutları görüntüleyebilirsiniz'
                : 'View your recent commands'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[400px] space-y-2">
            {commandHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">
                  {isTurkish ? 'Henüz komut geçmişi yok' : 'No command history yet'}
                </p>
              </div>
            ) : (
              commandHistory.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border',
                    item.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.command}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {item.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {commandHistory.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCommandHistory([])
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('ai-command-history')
                  }
                  toast.success(isTurkish ? 'Geçmiş temizlendi' : 'History cleared')
                }}
              >
                {isTurkish ? 'Geçmişi Temizle' : 'Clear History'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

