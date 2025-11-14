'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast, confirm } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import EmptyState from '@/components/ui/EmptyState'
import RefreshButton from '@/components/ui/RefreshButton'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

// Lazy load VendorForm ve VendorDetailModal - performans için
const VendorForm = dynamic(() => import('./VendorForm'), {
  ssr: false,
  loading: () => null,
})

const VendorDetailModal = dynamic(() => import('./VendorDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface Vendor {
  id: string
  name: string
  sector?: string
  city?: string
  email?: string
  phone?: string
  status: string
  createdAt: string
}

export default function VendorList() {
  const locale = useLocale()
  const t = useTranslations('vendors')
  const tCommon = useTranslations('common')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [selectedVendorData, setSelectedVendorData] = useState<Vendor | null>(null)

  // Debounced search - performans için (kullanıcı yazmayı bitirdikten 300ms sonra arama)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce - her harfte arama yapılmaz
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme (repo kurallarına uygun) - debounced search kullanıyoruz
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  
  const apiUrl = `/api/vendors?${params.toString()}`
  const { data: vendors = [], isLoading, error, mutate: mutateVendors } = useData<Vendor[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
  })

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = async () => {
    await Promise.all([
      mutateVendors(undefined, { revalidate: true }),
      mutate('/api/vendors', undefined, { revalidate: true }),
      mutate('/api/vendors?', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/vendors', undefined, { revalidate: true }),
    ])
  }

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!(await confirm(t('deleteConfirm', { name })))) {
      return
    }

    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete vendor')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedVendors = vendors.filter((v) => v.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateVendors(updatedVendors, { revalidate: false })
      
      // Tüm diğer vendor URL'lerini de güncelle
      await Promise.all([
        mutate('/api/vendors', updatedVendors, { revalidate: false }),
        mutate('/api/vendors?', updatedVendors, { revalidate: false }),
        mutate(apiUrl, updatedVendors, { revalidate: false }),
      ])
      
      // Success toast göster
      toast.success('Tedarikçi silindi', `${name} başarıyla silindi.`)
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(t('deleteFailed'), error?.message)
    }
  }, [vendors, mutateVendors, apiUrl])

  const handleAdd = useCallback(() => {
    setSelectedVendor(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedVendor(null)
    // Form kapanırken cache'i güncelleme yapılmaz - onSuccess callback'te zaten yapılıyor
  }, [])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>('/api/stats/vendors', {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return <SkeletonList />
  }

  // ModuleStats'ten gelen total değerini kullan - dashboard ile tutarlı olması için
  const totalVendors = stats?.total || vendors.length

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="vendors" statsUrl="/api/stats/vendors" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('totalVendors', { count: totalVendors })}
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefresh} />
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newVendor')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{tCommon('active')}</SelectItem>
            <SelectItem value="INACTIVE">{tCommon('inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tedarikçi Adı</TableHead>
              <TableHead>Sektör</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="Henüz tedarikçi yok"
                    description="Yeni tedarikçi ekleyerek başlayın"
                    action={{
                      label: 'Yeni Tedarikçi Ekle',
                      onClick: handleAdd,
                    }}
                    className="border-0 shadow-none"
                  />
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.sector || '-'}</TableCell>
                  <TableCell>{vendor.city || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {vendor.email && <p className="text-sm text-gray-600">{vendor.email}</p>}
                      {vendor.phone && <p className="text-sm text-gray-600">{vendor.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        vendor.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {vendor.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(vendor.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedVendorId(vendor.id)
                          setSelectedVendorData(vendor)
                          setDetailModalOpen(true)
                        }}
                        aria-label={`${vendor.name} tedarikçisini görüntüle`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(vendor)}
                        aria-label={`${vendor.name} tedarikçisini düzenle`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(vendor.id, vendor.name)}
                        aria-label={`${vendor.name} tedarikçisini sil`}
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
      </div>

      {/* Detail Modal */}
      <VendorDetailModal
        vendorId={selectedVendorId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedVendorId(null)
          setSelectedVendorData(null)
        }}
        initialData={selectedVendorData || undefined}
      />

      {/* Form Modal */}
      <VendorForm
        vendor={selectedVendor || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedVendor: Vendor) => {
          // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
          // Böylece form kapanmadan önce tedarikçi listede görünür
          
          let updatedVendors: Vendor[]
          
          if (selectedVendor) {
            // UPDATE: Mevcut kaydı güncelle
            updatedVendors = vendors.map((v) =>
              v.id === savedVendor.id ? savedVendor : v
            )
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            updatedVendors = [savedVendor, ...vendors]
          }
          
          // Cache'i güncelle - optimistic update'i hemen uygula ve koru
          // revalidate: false = background refetch yapmaz, optimistic update korunur
          await mutateVendors(updatedVendors, { revalidate: false })
          
          // Tüm diğer vendor URL'lerini de güncelle (optimistic update)
          await Promise.all([
            mutate('/api/vendors', updatedVendors, { revalidate: false }),
            mutate('/api/vendors?', updatedVendors, { revalidate: false }),
            mutate(apiUrl, updatedVendors, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}
