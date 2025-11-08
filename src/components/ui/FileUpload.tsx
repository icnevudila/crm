'use client'

import { useState, useRef } from 'react'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface FileUploadProps {
  entityType: string
  entityId: string
  onUploadSuccess?: (file: any) => void
  maxSize?: number // MB
  acceptedTypes?: string[]
}

export default function FileUpload({
  entityType,
  entityId,
  onUploadSuccess,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya boyutu kontrolü
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Dosya boyutu ${maxSize}MB'dan büyük olamaz`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Dosya yüklenemedi')
      }

      const { file: uploadedFile } = await res.json()
      setUploadedFiles((prev) => [uploadedFile, ...prev])

      if (onUploadSuccess) {
        onUploadSuccess(uploadedFile)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error?.message || 'Dosya yüklenemedi')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (filePath: string) => {
    if (!confirm('Dosyayı silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      // TODO: Supabase Storage'dan silme endpoint'i ekle
      setUploadedFiles((prev) => prev.filter((f) => f.path !== filePath))
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('Dosya silinemedi')
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <File className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold">Dosyalar</h3>
      </div>

      {/* Upload butonu */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outline"
            asChild
            disabled={uploading}
            className="w-full"
            aria-label="Dosya yükle"
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Dosya Yükle (Max {maxSize}MB)
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Yüklenen dosyalar */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div className="flex items-center gap-2 flex-1">
                <File className="h-4 w-4 text-gray-400" />
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline truncate flex-1"
                >
                  {file.name}
                </a>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file.path)}
                aria-label={`${file.name} dosyasını sil`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}





