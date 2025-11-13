'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

const documentFormSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(255, 'Başlık çok uzun'),
  description: z.string().optional(),
  relatedTo: z.string().optional(),
  relatedId: z.string().optional(),
  folder: z.string().optional(),
})

type DocumentFormData = z.infer<typeof documentFormSchema>

interface DocumentFormProps {
  document?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedDocument: any) => void
}

export default function DocumentForm({
  document,
  open,
  onClose,
  onSuccess,
}: DocumentFormProps) {
  const [loading, setLoading] = useState(false)
  const [relatedOptions, setRelatedOptions] = useState<Array<{ id: string; name: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: '',
      description: '',
      relatedTo: '',
      relatedId: '',
      folder: 'General',
    },
  })

  const relatedTo = watch('relatedTo')

  // Form'u doldur (edit modunda)
  useEffect(() => {
    if (open) {
      if (document) {
        reset({
          title: document.title || '',
          description: document.description || '',
          relatedTo: document.relatedTo || '',
          relatedId: document.relatedId || '',
          folder: document.folder || 'General',
        })
      } else {
        reset({
          title: '',
          description: '',
          relatedTo: '',
          relatedId: '',
          folder: 'General',
        })
      }
    }
  }, [document, open, reset])

  // İlişkili modülün datalarını çek
  useEffect(() => {
    if (!relatedTo || relatedTo === 'NONE') {
      setRelatedOptions([])
      return
    }

    const fetchRelatedData = async () => {
      try {
        let endpoint = ''
        switch (relatedTo) {
          case 'Customer':
            endpoint = '/api/customers'
            break
          case 'Deal':
            endpoint = '/api/deals'
            break
          case 'Quote':
            endpoint = '/api/quotes'
            break
          case 'Contract':
            endpoint = '/api/contracts'
            break
          case 'Invoice':
            endpoint = '/api/invoices'
            break
          default:
            return
        }

        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          const items = Array.isArray(data) ? data : (data.data || data.items || [])
          setRelatedOptions(items.slice(0, 50))
        }
      } catch (error) {
        console.error('Failed to fetch related data:', error)
      }
    }

    fetchRelatedData()
  }, [relatedTo])

  const onSubmit = async (data: DocumentFormData) => {
    setLoading(true)
    try {
      const url = document
        ? `/api/documents/${document.id}`
        : '/api/documents'
      const method = document ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save document')
      }

      const savedDocument = await res.json()

      toast.success(document ? 'Döküman güncellendi' : 'Döküman oluşturuldu')

      if (onSuccess) {
        onSuccess(savedDocument)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydetme başarısız', error?.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {document ? 'Dökümanı Düzenle' : 'Yeni Döküman'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input id="title" {...register('title')} placeholder="Döküman başlığı" />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Döküman hakkında kısa açıklama..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Related To */}
            <div className="space-y-2">
              <Label htmlFor="relatedTo">İlişkili Modül</Label>
              <Select
                value={relatedTo || 'NONE'}
                onValueChange={(value) => setValue('relatedTo', value === 'NONE' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Yok</SelectItem>
                  <SelectItem value="Customer">Müşteri</SelectItem>
                  <SelectItem value="Deal">Fırsat</SelectItem>
                  <SelectItem value="Quote">Teklif</SelectItem>
                  <SelectItem value="Contract">Sözleşme</SelectItem>
                  <SelectItem value="Invoice">Fatura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Folder */}
            <div className="space-y-2">
              <Label htmlFor="folder">Klasör</Label>
              <Select
                value={watch('folder') || 'General'}
                onValueChange={(value) => setValue('folder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">Genel</SelectItem>
                  <SelectItem value="Contracts">Sözleşmeler</SelectItem>
                  <SelectItem value="Invoices">Faturalar</SelectItem>
                  <SelectItem value="Proposals">Teklifler</SelectItem>
                  <SelectItem value="Reports">Raporlar</SelectItem>
                  <SelectItem value="Legal">Yasal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Related Record - Dropdown */}
          {relatedTo && relatedTo !== 'NONE' && (
            <div className="space-y-2">
              <Label htmlFor="relatedId">İlişkili Kayıt Seç</Label>
              {relatedOptions.length > 0 ? (
                <Select
                  value={watch('relatedId') || 'NONE'}
                  onValueChange={(value) => setValue('relatedId', value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kayıt seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Seçilmedi</SelectItem>
                    {relatedOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name || option.title || `#${option.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 italic">Yükleniyor...</div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Kaydediliyor...' : document ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

