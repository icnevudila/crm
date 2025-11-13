'use client'

/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Plus, Search, Download, Trash2, FileText, Image as ImageIcon, File, Eye, Edit, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Pagination from '@/components/ui/Pagination'
import { useData } from '@/hooks/useData'
import DocumentUploadForm from '@/components/documents/DocumentUploadForm'
import DocumentForm from '@/components/documents/DocumentForm'
import DocumentAccessForm from '@/components/documents/DocumentAccessForm'
import { mutate } from 'swr'
import { toast, confirm } from '@/lib/toast'
import dynamic from 'next/dynamic'

const DocumentDetailModal = dynamic(() => import('@/components/documents/DocumentDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface Document {
  id: string
  title: string
  fileName: string
  fileSize: number | null
  fileType: string | null
  fileUrl: string
  folder: string | null
  relatedTo: string | null
  createdAt: string
  uploadedBy: { name: string; email: string } | null
}

interface DocumentsResponse {
  data: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function DocumentsPage() {
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedDocumentData, setSelectedDocumentData] = useState<Document | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const params = new URLSearchParams()
  if (search) params.append('search', search)
  params.append('page', page.toString())
  params.append('limit', pageSize.toString())
  
  const apiUrl = `/api/documents?${params.toString()}`
  const { data, isLoading, mutate: mutateDocuments, error } = useData<DocumentsResponse>(apiUrl)
  
  const documents = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 }

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc)
    setFormOpen(true)
  }

  const handleManageAccess = (doc: Document) => {
    setSelectedDocument(doc)
    setAccessOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm(`${title} dökümanını silmek istediğinize emin misiniz?`)
    if (!confirmed) return

    const toastId = toast.loading('Siliniyor...')
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      await mutateDocuments()
      await mutate(apiUrl)
      toast.dismiss(toastId)
      toast.success('Silindi', 'Döküman başarıyla silindi.')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.dismiss(toastId)
      toast.error('Silme başarısız', error?.message || 'Silme işlemi sırasında bir hata oluştu.')
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-5 w-5 text-gray-500" />
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) return <SkeletonList />

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">⚠️ Dökümanlar yüklenirken hata oluştu</p>
          <p className="text-sm text-red-600 mt-2">
            {error.message || 'Bilinmeyen hata'}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Console'u (F12) kontrol edin veya sayfayı yenileyin
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Sayfayı Yenile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dökümanlar</h1>
          <p className="text-gray-500 mt-1">Dosya yönetimi ve paylaşım</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Dosya Yükle
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Dosya ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dosya</TableHead>
              <TableHead>Klasör</TableHead>
              <TableHead>İlişkili</TableHead>
              <TableHead>Boyut</TableHead>
              <TableHead>Yükleyen</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Henüz dosya yüklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.fileType)}
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-gray-500">{doc.fileName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.folder || 'Genel'}</Badge>
                  </TableCell>
                  <TableCell>
                    {doc.relatedTo && (
                      <Badge className="bg-purple-100 text-purple-800 border-0">{doc.relatedTo}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>{doc.uploadedBy?.name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDocumentId(doc.id)
                          setSelectedDocumentData(doc)
                          setDetailModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleManageAccess(doc)}
                        title="Erişim Yönetimi"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            pageSize={pagination.limit}
            totalItems={pagination.total}
            onPageChange={(newPage) => {
              setPage(newPage)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadForm
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={async (doc) => {
          // Optimistic update - yeni dokümanı cache'e ekle
          await mutateDocuments()
          await mutate(apiUrl)
          setUploadOpen(false)
        }}
      />

      {/* Edit Modal */}
      <DocumentForm
        document={selectedDocument || undefined}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedDocument(null)
        }}
        onSuccess={async (savedDocument) => {
          await mutateDocuments()
          await mutate(apiUrl)
          setFormOpen(false)
          setSelectedDocument(null)
        }}
      />

      {/* Detail Modal */}
      <DocumentDetailModal
        documentId={selectedDocumentId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedDocumentId(null)
          setSelectedDocumentData(null)
        }}
        initialData={selectedDocumentData || undefined}
      />

      {/* Access Management Modal */}
      {selectedDocument && (
        <DocumentAccessForm
          documentId={selectedDocument.id}
          open={accessOpen}
          onClose={() => {
            setAccessOpen(false)
            setSelectedDocument(null)
          }}
          onSuccess={async () => {
            await mutateDocuments()
            await mutate(apiUrl)
          }}
        />
      )}
    </div>
  )
}

