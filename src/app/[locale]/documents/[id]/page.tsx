'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Download, Eye, FileText, Trash2, Edit, FolderOpen, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileUrl: string
  fileSize?: number
  fileType?: string
  folder?: string
  relatedTo?: string
  relatedId?: string
  uploadedBy?: string
  uploader?: {
    name: string
  }
  tags?: string[]
  version: number
  status: string
  createdAt: string
  updatedAt: string
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  const mb = kb / 1024
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileText className="h-5 w-5" />
  
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />
  if (fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className="h-5 w-5 text-green-600" />
  if (fileType.includes('image')) return <FileText className="h-5 w-5 text-purple-600" />
  
  return <FileText className="h-5 w-5 text-gray-600" />
}

const relatedToLabels: Record<string, string> = {
  CUSTOMER: 'Müşteri',
  DEAL: 'Fırsat',
  QUOTE: 'Teklif',
  CONTRACT: 'Sözleşme',
  INVOICE: 'Fatura',
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const documentId = params.id as string

  const { data: document, isLoading } = useData<Document>(`/api/documents/${documentId}`)

  const handleDelete = async () => {
    if (!confirm(`${document?.title} dökümanını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete document')
      }

      router.push(`/${locale}/documents`)
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }

  const handleDownload = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank')
    }
  }

  const handlePreview = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!document) {
    return <div>Döküman bulunamadı</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/documents`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              {getFileIcon(document.fileType)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{document.title}</h1>
              <p className="text-gray-600">{document.fileName}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Dosya Boyutu</span>
          </div>
          <p className="text-xl font-bold">{formatFileSize(document.fileSize)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Dosya Tipi</span>
          </div>
          <p className="text-sm font-medium">{document.fileType || 'Bilinmiyor'}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Versiyon</span>
          </div>
          <p className="text-xl font-bold">v{document.version}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Durum</span>
          </div>
          <Badge className={document.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
            {document.status}
          </Badge>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Döküman Bilgileri
          </h3>
          <div className="space-y-3">
            {document.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                <p className="text-gray-900">{document.description}</p>
              </div>
            )}
            {document.folder && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Klasör</p>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-yellow-600" />
                  <p className="text-gray-900">{document.folder}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
              <p className="text-gray-900">{new Date(document.createdAt).toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Son Güncelleme</p>
              <p className="text-gray-900">{new Date(document.updatedAt).toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            İlişkili Bilgiler
          </h3>
          <div className="space-y-3">
            {document.uploader && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Yükleyen</p>
                <p className="text-gray-900">{document.uploader.name}</p>
              </div>
            )}
            {document.relatedTo && (
              <div>
                <p className="text-sm text-gray-600 mb-1">İlişkili Modül</p>
                <Badge className="bg-purple-100 text-purple-800 border-0">
                  {relatedToLabels[document.relatedTo] || document.relatedTo}
                </Badge>
              </div>
            )}
            {document.relatedId && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Kayıt ID</p>
                <p className="text-xs text-gray-500 font-mono">{document.relatedId}</p>
              </div>
            )}
            {document.tags && document.tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Etiketler</p>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* File Preview (for images) */}
      {document.fileType?.includes('image') && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Önizleme</h3>
          <div className="flex justify-center">
            <img 
              src={document.fileUrl} 
              alt={document.title}
              className="max-w-full max-h-96 rounded-lg border"
            />
          </div>
        </Card>
      )}
    </div>
  )
}

