'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { toast } from '@/lib/toast'

const competitorSchema = z.object({
  name: z.string().min(1, 'Firma adı gereklidir'),
  description: z.string().optional(),
  website: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  averagePrice: z.number().min(0).optional(),
  marketShare: z.number().min(0).max(100).optional(),
  pricingStrategy: z.string().optional(),
})

type CompetitorFormData = z.infer<typeof competitorSchema>

interface CompetitorFormProps {
  competitor?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedCompetitor: any) => void
}

export default function CompetitorForm({
  competitor,
  open,
  onClose,
  onSuccess,
}: CompetitorFormProps) {
  const [loading, setLoading] = useState(false)
  const [strengths, setStrengths] = useState<string[]>([])
  const [weaknesses, setWeaknesses] = useState<string[]>([])
  const [strengthInput, setStrengthInput] = useState('')
  const [weaknessInput, setWeaknessInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompetitorFormData>({
    resolver: zodResolver(competitorSchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      averagePrice: 0,
      marketShare: 0,
      pricingStrategy: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (competitor) {
        reset({
          name: competitor.name || '',
          description: competitor.description || '',
          website: competitor.website || '',
          averagePrice: competitor.averagePrice || 0,
          marketShare: competitor.marketShare || 0,
          pricingStrategy: competitor.pricingStrategy || '',
        })
        // Strengths/Weaknesses DB'de TEXT olarak saklanıyor, JSON parse et
        try {
          setStrengths(competitor.strengths ? (typeof competitor.strengths === 'string' ? JSON.parse(competitor.strengths) : competitor.strengths) : [])
          setWeaknesses(competitor.weaknesses ? (typeof competitor.weaknesses === 'string' ? JSON.parse(competitor.weaknesses) : competitor.weaknesses) : [])
        } catch {
          // JSON parse hatası - boş string veya geçersiz format
          setStrengths([])
          setWeaknesses([])
        }
      } else {
        reset({
          name: '',
          description: '',
          website: '',
          averagePrice: 0,
          marketShare: 0,
          pricingStrategy: '',
        })
        setStrengths([])
        setWeaknesses([])
      }
    }
  }, [competitor, open, reset])

  const addStrength = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (strengthInput.trim()) {
      setStrengths([...strengths, strengthInput.trim()])
      setStrengthInput('')
    }
  }

  const removeStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index))
  }

  const addWeakness = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (weaknessInput.trim()) {
      setWeaknesses([...weaknesses, weaknessInput.trim()])
      setWeaknessInput('')
    }
  }

  const removeWeakness = (index: number) => {
    setWeaknesses(weaknesses.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CompetitorFormData) => {
    setLoading(true)
    try {
      const url = competitor ? `/api/competitors/${competitor.id}` : '/api/competitors'
      const method = competitor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // ✅ ÇÖZÜM: Strengths/Weaknesses array olarak gönder (DB TEXT[] - API route'u JSON string'i parse edecek)
          strengths: strengths.length > 0 ? strengths : null,
          weaknesses: weaknesses.length > 0 ? weaknesses : null,
          // ✅ ÇÖZÜM: averagePrice ve marketShare undefined ise null gönder, 0 geçerli bir değer
          averagePrice: data.averagePrice !== undefined ? data.averagePrice : null,
          marketShare: data.marketShare !== undefined ? data.marketShare : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save competitor')
      }

      const savedCompetitor = await res.json()

      // Success toast göster
      toast.success(
        competitor ? 'Rakip güncellendi' : 'Rakip kaydedildi',
        competitor ? `${data.name} başarıyla güncellendi.` : `${data.name} başarıyla eklendi.`
      )

      if (onSuccess) {
        onSuccess(savedCompetitor)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{competitor ? 'Rakip Düzenle' : 'Yeni Rakip Ekle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Firma Adı *</Label>
            <Input id="name" {...register('name')} placeholder="XYZ Yazılım A.Ş." />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" {...register('description')} placeholder="Rakip hakkında genel bilgi..." rows={3} />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register('website')} placeholder="https://example.com" />
            {errors.website && <p className="text-sm text-red-600">{errors.website.message}</p>}
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label>Güçlü Yönler</Label>
            <div className="flex gap-2">
              <Input
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                placeholder="Güçlü yön ekle..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    addStrength(e)
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={(e) => addStrength(e)} 
                variant="outline"
              >
                Ekle
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {strengths.map((strength, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                  {strength}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeStrength(idx)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="space-y-2">
            <Label>Zayıf Yönler</Label>
            <div className="flex gap-2">
              <Input
                value={weaknessInput}
                onChange={(e) => setWeaknessInput(e.target.value)}
                placeholder="Zayıf yön ekle..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    addWeakness(e)
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={(e) => addWeakness(e)} 
                variant="outline"
              >
                Ekle
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {weaknesses.map((weakness, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                  {weakness}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeWeakness(idx)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Average Price */}
            <div className="space-y-2">
              <Label htmlFor="averagePrice">Ortalama Fiyat (₺)</Label>
              <Input
                id="averagePrice"
                type="number"
                step="0.01"
                {...register('averagePrice', { valueAsNumber: true })}
                placeholder="45000"
              />
              {errors.averagePrice && <p className="text-sm text-red-600">{errors.averagePrice.message}</p>}
            </div>

            {/* Market Share */}
            <div className="space-y-2">
              <Label htmlFor="marketShare">Pazar Payı (%)</Label>
              <Input
                id="marketShare"
                type="number"
                step="0.1"
                max="100"
                {...register('marketShare', { valueAsNumber: true })}
                placeholder="15.5"
              />
              {errors.marketShare && <p className="text-sm text-red-600">{errors.marketShare.message}</p>}
            </div>
          </div>

          {/* Pricing Strategy */}
          <div className="space-y-2">
            <Label htmlFor="pricingStrategy">Fiyatlandırma Stratejisi</Label>
            <Textarea
              id="pricingStrategy"
              {...register('pricingStrategy')}
              placeholder="Düşük fiyat stratejisi, taksit seçenekleri..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : competitor ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


