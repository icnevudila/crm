'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast, confirm } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import CompetitorForm from './CompetitorForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Pagination from '@/components/ui/Pagination'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

// Lazy load CompetitorDetailModal - performans için
const CompetitorDetailModal = dynamic(() => import('./CompetitorDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface Competitor {
  id: string
  name: string
  description: string | null
  website: string | null
  strengths: string | string[] | null
  weaknesses: string | string[] | null
  pricingStrategy: string | null
  marketShare: number | null
  averagePrice: number | null
  createdAt: string
}

interface CompetitorsResponse {
  data: Competitor[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export default function CompetitorList() {
  const locale = useLocale()
  const t = useTranslations('competitors')
  const tCommon = useTranslations('common')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null)
  const [selectedCompetitorData, setSelectedCompetitorData] = useState<Competitor | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Arama değiştiğinde ilk sayfaya dön
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // API URL with pagination
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())
    return `/api/competitors?${params.toString()}`
  }, [debouncedSearch, currentPage, pageSize])
  
  const { data: response, isLoading, mutate: mutateCompetitors } = useData<CompetitorsResponse | Competitor[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
  })
  
  // Backward compatibility: Eğer response data array ise direkt kullan, değilse response.data kullan
  const competitors = Array.isArray(response) ? response : (response?.data || [])
  const pagination = Array.isArray(response) ? null : (response?.pagination || null)

  const handleNew = () => {
    setSelectedCompetitor(null)
    setFormOpen(true)
  }

  const handleEdit = (competitor: Competitor) => {
    setSelectedCompetitor(competitor)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedCompetitor(null)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm(t('deleteConfirm', { name })))) {
      return
    }

    try {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete competitor')
      }

      const updatedCompetitors = competitors.filter((item) => item.id !== id)
      await mutateCompetitors(updatedCompetitors, { revalidate: false })
      await Promise.all([
        mutate('/api/competitors', updatedCompetitors, { revalidate: false }),
        mutate(apiUrl, updatedCompetitors, { revalidate: false }),
      ])
      
      // Success toast göster
      toast.success('Rakip silindi', { description: `${name} başarıyla silindi.` })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('deleteFailed'), { description: error?.message || 'Bir hata oluştu' })
    }
  }

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('description')}</p>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('newCompetitor')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">{t('stats.totalCompetitors')}</div>
          <div className="text-2xl font-bold mt-1">{competitors.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">{t('stats.avgMarketShare')}</div>
          <div className="text-2xl font-bold mt-1">
            {competitors.length > 0
              ? (competitors.reduce((sum, c) => sum + (c.marketShare || 0), 0) / competitors.length).toFixed(1)
              : 0}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">{t('stats.avgPrice')}</div>
          <div className="text-2xl font-bold mt-1">
            {competitors.length > 0
              ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                  competitors.reduce((sum, c) => sum + (c.averagePrice || 0), 0) / competitors.length
                )
              : '₺0'}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.strengths')}</TableHead>
              <TableHead>{t('tableHeaders.weaknesses')}</TableHead>
              <TableHead>{t('tableHeaders.avgPrice')}</TableHead>
              <TableHead>{t('tableHeaders.marketShare')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  {t('noCompetitorsFound')}
                </TableCell>
              </TableRow>
            ) : (
              competitors.map((competitor) => (
                <TableRow key={competitor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{competitor.name}</div>
                      {competitor.website && (
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {competitor.website}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        const strengthsArray = competitor.strengths 
                          ? (typeof competitor.strengths === 'string' ? JSON.parse(competitor.strengths) : competitor.strengths)
                          : []
                        if (strengthsArray.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1">
                              {strengthsArray.slice(0, 2).map((strength: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs">
                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                  {strength}
                                </Badge>
                              ))}
                              {strengthsArray.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{strengthsArray.length - 2}
                                </Badge>
                              )}
                            </div>
                          )
                        }
                        return <span className="text-gray-400">-</span>
                      } catch {
                        return <span className="text-gray-400">-</span>
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        const weaknessesArray = competitor.weaknesses 
                          ? (typeof competitor.weaknesses === 'string' ? JSON.parse(competitor.weaknesses) : competitor.weaknesses)
                          : []
                        if (weaknessesArray.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1">
                              {weaknessesArray.slice(0, 2).map((weakness: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs">
                                  <TrendingDown className="h-3 w-3 text-red-600" />
                                  {weakness}
                                </Badge>
                              ))}
                              {weaknessesArray.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{weaknessesArray.length - 2}
                                </Badge>
                              )}
                            </div>
                          )
                        }
                        return <span className="text-gray-400">-</span>
                      } catch {
                        return <span className="text-gray-400">-</span>
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {competitor.averagePrice
                      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                          competitor.averagePrice
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {competitor.marketShare ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.min(competitor.marketShare, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{competitor.marketShare.toFixed(1)}%</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCompetitorId(competitor.id)
                          setSelectedCompetitorData(competitor)
                          setDetailModalOpen(true)
                        }}
                        aria-label={`${competitor.name} rakip kaydını görüntüle`}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(competitor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(competitor.id, competitor.name)}
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
        
        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1) // Sayfa boyutu değiştiğinde ilk sayfaya dön
            }}
          />
        )}
      </div>

      {/* Detail Modal */}
      <CompetitorDetailModal
        competitorId={selectedCompetitorId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedCompetitorId(null)
          setSelectedCompetitorData(null)
        }}
        initialData={selectedCompetitorData || undefined}
      />

      {/* Form Modal */}
      <CompetitorForm
        competitor={selectedCompetitor || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedCompetitor: Competitor) => {
          let updatedCompetitors: Competitor[]

          if (selectedCompetitor) {
            updatedCompetitors = competitors.map((item) =>
              item.id === savedCompetitor.id ? savedCompetitor : item
            )
          } else {
            updatedCompetitors = [savedCompetitor, ...competitors]
          }

          await mutateCompetitors(updatedCompetitors, { revalidate: false })
          await Promise.all([
            mutate('/api/competitors', updatedCompetitors, { revalidate: false }),
            mutate(apiUrl, updatedCompetitors, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}

