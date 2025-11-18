'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Download, FileText, FolderOpen, Calendar, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import DetailModal from '@/components/ui/DetailModal'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DocumentAccessForm from './DocumentAccessForm'

const DocumentForm = dynamic(() => import('./DocumentForm'), {
  ssr: false,
  loading: () => null,
})

interface DocumentDetailModalProps {
  documentId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function DocumentDetailModal({
  documentId,
  open,
  onClose,
  initialData,
}: DocumentDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: document, isLoading, error, mutate: mutateDocument } = useData<any>(
    documentId && open ? `/api/documents/${documentId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayDocument = document || initialData

  const handleDelete = async () => {
    if (!displayDocument || !confirm(`${displayDocument.title} dökümanını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Döküman silindi')
      
      await mutate('/api/documents')
      await mutate(`/api/documents/${documentId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!open || !documentId) return null

  if (isLoading && !initialData && !displayDocument) {
    return (
      <DetailModal open={open} onClose={onClose} title="Döküman Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayDocument) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Döküman yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayDocument) {
    return (
      <DetailModal open={open} onClose={onClose} title="Döküman Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Döküman bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayDocument?.title || 'Döküman Detayları'}
        description={`${displayDocument?.fileName || ''} • ${displayDocument?.createdAt ? new Date(displayDocument.createdAt).toLocaleDateString('tr-TR') : ''}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <a href={displayDocument?.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                İndir
              </Button>
            </a>
            <Button variant="outline" onClick={() => setAccessOpen(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Erişim Yönetimi
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>

          {/* Document Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dosya Bilgileri</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dosya Adı</p>
                  <p className="font-medium">{displayDocument?.fileName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dosya Boyutu</p>
                  <p className="font-medium">{formatFileSize(displayDocument?.fileSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dosya Tipi</p>
                  <p className="font-medium">{displayDocument?.fileType || '-'}</p>
                </div>
                {displayDocument?.folder && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline">{displayDocument.folder}</Badge>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detaylar</h2>
              <div className="space-y-3">
                {displayDocument?.uploadedBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Yükleyen</p>
                      <p className="font-medium">{displayDocument.uploadedBy.name}</p>
                      {displayDocument.uploadedBy.email && (
                        <p className="text-xs text-gray-500">{displayDocument.uploadedBy.email}</p>
                      )}
                    </div>
                  </div>
                )}
                {displayDocument?.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Oluşturulma</p>
                      <p className="font-medium">{new Date(displayDocument.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                )}
                {displayDocument?.relatedTo && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">İlişkili Modül</p>
                    <Badge className="bg-purple-100 text-purple-800 border-0">{displayDocument.relatedTo}</Badge>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Description */}
          {displayDocument?.description && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Açıklama</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{displayDocument.description}</p>
            </Card>
          )}

          {/* Access List */}
          {displayDocument?.access && displayDocument.access.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Erişim Listesi</h2>
              <div className="space-y-2">
                {displayDocument.access.map((access: any) => (
                  <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      {access.User ? (
                        <p className="font-medium">{access.User.name} ({access.User.email})</p>
                      ) : access.Customer ? (
                        <p className="font-medium">{access.Customer.name} (Müşteri)</p>
                      ) : (
                        <p className="text-gray-500">Bilinmeyen</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Erişim Seviyesi: {access.accessLevel}
                        {access.expiresAt && (
                          <span className="ml-2">
                            • Son Geçerlilik: {new Date(access.expiresAt).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">{access.accessLevel}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DetailModal>

      {/* Form Modal */}
      <DocumentForm
        document={displayDocument || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateDocument()
          await mutate(`/api/documents/${documentId}`)
        }}
      />

      {/* Access Management Modal */}
      {displayDocument && (
        <DocumentAccessForm
          documentId={documentId || ''}
          open={accessOpen}
          onClose={() => setAccessOpen(false)}
          onSuccess={async () => {
            await mutateDocument()
            await mutate(`/api/documents/${documentId}`)
          }}
        />
      )}
    </>
  )
}

