'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AIGenerateButtonProps {
  onGenerate: (prompt: string) => Promise<string>
  onSuccess: (result: string) => void
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function AIGenerateButton({
  onGenerate,
  onSuccess,
  label = 'AI ile Oluştur',
  variant = 'outline',
  size = 'default',
  className,
}: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await onGenerate('')
      onSuccess(result)
      toast.success('Başarılı', { description: 'AI metni oluşturuldu' })
    } catch (error: any) {
      console.error('AI Generate Error:', error)
      toast.error('Hata', { description: error?.message || 'AI metni oluşturulamadı' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleGenerate}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Oluşturuluyor...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span className="ml-2">{label}</span>
        </>
      )}
    </Button>
  )
}

