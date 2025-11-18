'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { toast, confirm } from '@/lib/toast'
import { Plus, Search, Edit, Trash2, Users, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import SegmentForm from './SegmentForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

const SegmentDetailModal = dynamic(() => import('./SegmentDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface SegmentListProps {
  isOpen?: boolean
}

interface Segment {
  id: string
  name: string
  description: string | null
  criteria: any
  autoAssign: boolean
  color: string | null
  memberCount?: number
  createdAt: string
}

export default function SegmentList({ isOpen = true }: SegmentListProps) {
  const locale = useLocale()
  const t = useTranslations('segments')
  const tCommon = useTranslations('common')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [selectedSegmentData, setSelectedSegmentData] = useState<Segment | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const apiUrl = useMemo(() => {
    if (!isOpen) return null
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    return `/api/segments${params.toString() ? `?${params.toString()}` : ''}`
  }, [isOpen, debouncedSearch])

  const { data: segments = [], isLoading, error, mutate: mutateSegments } = useData<Segment[]>(
    apiUrl,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  const handleNew = () => {
    setSelectedSegment(null)
    setFormOpen(true)
  }

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm(t('deleteConfirm', { name })))) return

    try {
      const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')

      const updated = segments.filter((item) => item.id !== id)
      await mutateSegments(updated, { revalidate: false })
      await mutate('/api/segments', updated, { revalidate: false })
      if (apiUrl) {
        await mutate(apiUrl, updated, { revalidate: false })
      }
    } catch (error: any) {
      toast.error(t('deleteFailed'), { description: error?.message || 'Silme işlemi başarısız oldu' })
    }
  }

  if (!isOpen) {
    return null
  }

  if (isLoading) return <SkeletonList />

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Segmentler yüklenirken bir hata oluştu.</p>
        <Button onClick={() => mutateSegments()}>Yeniden Dene</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('description')}</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Nasıl Çalışır?</strong> Segmentler, müşterilerinizi kriterlere göre otomatik gruplandırmanızı sağlar. 
              Örnek: "VIP Müşteriler" segmentine toplam geliri 100K+ olan müşteriler otomatik eklenebilir. 
              Segmentler müşteri filtreleme, kampanya hedefleme ve raporlama için kullanılır.
            </p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newSegment')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.description')}</TableHead>
              <TableHead>{t('tableHeaders.autoAssign')}</TableHead>
              <TableHead>{t('tableHeaders.memberCount')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  {t('noSegmentsFound')}
                </TableCell>
              </TableRow>
            ) : (
              segments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {segment.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                      )}
                      <span className="font-medium">{segment.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{segment.description || '-'}</TableCell>
                  <TableCell>
                    {segment.autoAssign ? (
                      <Badge className="bg-indigo-100 text-indigo-800 border-0">Otomatik</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 border-gray-300">Manuel</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{segment.memberCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSegmentId(segment.id)
                          setSelectedSegmentData(segment)
                          setDetailModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(segment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(segment.id, segment.name)}
                        className="text-red-600"
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
      </div>

      <SegmentForm
        segment={selectedSegment || undefined}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedSegment(null)
        }}
        onSuccess={async (saved: Segment) => {
          const updated = selectedSegment
            ? segments.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...segments]

          await mutateSegments(updated, { revalidate: false })
          await mutate('/api/segments', updated, { revalidate: false })
        }}
      />

      {/* Detail Modal */}
      {selectedSegmentId && (
        <SegmentDetailModal
          segmentId={selectedSegmentId}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedSegmentId(null)
            setSelectedSegmentData(null)
          }}
          initialData={selectedSegmentData || undefined}
        />
      )}
    </div>
  )
}

