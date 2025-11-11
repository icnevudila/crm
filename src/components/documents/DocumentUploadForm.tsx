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
import { Upload, X } from 'lucide-react'
import { useData } from '@/hooks/useData'

const documentSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  description: z.string().optional(),
  relatedTo: z.string().optional(),
  relatedId: z.string().optional(),
  folder: z.string().optional(),
})

type DocumentFormData = z.infer<typeof documentSchema>

interface DocumentUploadFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: (document: any) => void
}

export default function DocumentUploadForm({
  open,
  onClose,
  onSuccess,
}: DocumentUploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [relatedOptions, setRelatedOptions] = useState<Array<{ id: string; name: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      description: '',
      relatedTo: '',
      relatedId: '',
      folder: 'General',
    },
  })

  const relatedTo = watch('relatedTo')

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
          console.log('Fetched data:', data) // DEBUG
          
          // API response formatını kontrol et
          const items = Array.isArray(data) ? data : (data.data || data.items || [])
          console.log('Items:', items) // DEBUG
          
          setRelatedOptions(items.slice(0, 50)) // İlk 50 kayıt
        } else {
          console.error('API error:', res.status, res.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch related data:', error)
      }
    }

    fetchRelatedData()
  }, [relatedTo])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-fill title from filename
      if (!watch('title')) {
        setValue('title', selectedFile.name)
      }
    }
  }

  const uploadToSupabaseStorage = async (file: File): Promise<string> => {
    // TODO: Gerçek Supabase Storage upload
    // Şimdilik fake URL döndürüyoruz
    
    // Simulated upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Mock URL - Gerçekte Supabase Storage URL olacak
    return `https://example.com/uploads/${file.name}`
  }

  const onSubmit = async (data: DocumentFormData) => {
    if (!file) {
      toast.warning('Dosya seçmediniz')
      return
    }

    setLoading(true)
    try {
      // 1. Upload file to Supabase Storage
      const fileUrl = await uploadToSupabaseStorage(file)

      // 2. Create document record
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Upload failed')
      }

      const savedDocument = await res.json()

      if (onSuccess) {
        onSuccess(savedDocument)
      }

      reset()
      setFile(null)
      setUploadProgress(0)
      onClose()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Yükleme başarısız oldu', error?.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setFile(null)
    setUploadProgress(0)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dosya Yükle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">Dosya Seç *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? (
                    <span className="font-medium text-indigo-600">{file.name}</span>
                  ) : (
                    'Dosya seçmek için tıklayın veya sürükleyin'
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Word, Excel, PNG, JPG (Max 10MB)
                </p>
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Kaldır
                </Button>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Yükleniyor...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

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
              <p className="text-xs text-gray-500">
                Dökümanı belirli bir {relatedTo === 'Customer' ? 'müşteriye' : relatedTo === 'Deal' ? 'fırsata' : 'kayda'} bağlayın
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !file}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

