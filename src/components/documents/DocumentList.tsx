'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { FileText, Image as ImageIcon, File, Download, Eye, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useData } from '@/hooks/useData'
import SkeletonList from '@/components/skeletons/SkeletonList'

interface Document {
  id: string
  title: string
  fileName: string
  fileSize: number | null
  fileType: string | null
  fileUrl: string
  folder: string | null
  relatedTo: string | null
  relatedId: string | null
  createdAt: string
  uploadedBy: {
    name: string
    email: string
  } | null
}

interface DocumentListProps {
  relatedTo: string
  relatedId: string
  limit?: number
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-4 w-4 text-gray-500" />
  if (fileType.includes('image')) return <ImageIcon className="h-4 w-4 text-blue-500" />
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  return <File className="h-4 w-4 text-gray-500" />
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function DocumentList({ relatedTo, relatedId, limit = 10 }: DocumentListProps) {
  const locale = useLocale()
  
  const { data, isLoading, error } = useData<{ data: Document[]; pagination: any }>(
    `/api/documents?relatedTo=${relatedTo}&relatedId=${relatedId}&limit=${limit}`,
    {
      dedupingInterval: 30000, // 30 saniye cache
      revalidateOnFocus: false,
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
    }
  )

  const documents = data?.data || []

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">İlgili Dökümanlar</h3>
        <SkeletonList />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">İlgili Dökümanlar</h3>
        <div className="text-center py-4 text-gray-500">
          Dökümanlar yüklenirken bir hata oluştu
        </div>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">İlgili Dökümanlar</h3>
        <div className="text-center py-8 text-gray-500">
          Henüz döküman eklenmemiş
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">İlgili Dökümanlar ({documents.length})</h3>
        <Link href={`/${locale}/documents?relatedTo=${relatedTo}&relatedId=${relatedId}`}>
          <Button variant="outline" size="sm">
            Tümünü Gör
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Döküman</TableHead>
              <TableHead>Boyut</TableHead>
              <TableHead>Klasör</TableHead>
              <TableHead>Yükleyen</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFileIcon(doc.fileType)}
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/${locale}/documents/${doc.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {doc.title || doc.fileName}
                      </Link>
                      {/* İlgili kayıt linki */}
                      {doc.relatedTo && doc.relatedId && (() => {
                        // Entity tipine göre pluralization (finance → finance, diğerleri → +s)
                        const entityTypeLower = doc.relatedTo.toLowerCase()
                        const entityTypePlural = entityTypeLower === 'finance' 
                          ? 'finance' 
                          : `${entityTypeLower}s`
                        
                        return (
                          <Link
                            href={`/${locale}/${entityTypePlural}/${doc.relatedId}`}
                            className="text-xs text-gray-500 hover:text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            İlgili {doc.relatedTo}'ya git
                          </Link>
                        )
                      })()}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatFileSize(doc.fileSize)}
                </TableCell>
                <TableCell>
                  {doc.folder ? (
                    <Badge variant="outline">{doc.folder}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {doc.uploadedBy?.name || doc.uploadedBy?.email || '-'}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(doc.createdAt).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      title="Görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = doc.fileUrl
                        link.download = doc.fileName
                        link.click()
                      }}
                      title="İndir"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}


