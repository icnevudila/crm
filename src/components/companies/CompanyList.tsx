'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Download, FileSpreadsheet, FileText, Users, Briefcase, FileText as FileTextIcon, Receipt } from 'lucide-react'
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
import CompanyForm from './CompanyForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface Company {
  id: string
  name: string
  sector?: string
  city?: string
  status: string
  createdAt: string
  stats?: {
    customers: number
    deals: number
    quotes: number
    invoices: number
  }
}

export default function CompanyList() {
  const locale = useLocale()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // ENTERPRISE: SuperAdmin de bu sayfayı kullanabilir - tüm firmaları görebilir
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  // Debounced search - performans için (kullanıcı yazmayı bitirdikten 300ms sonra arama)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce - her harfte arama yapılmaz
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme (repo kurallarına uygun) - debounced search kullanıyoruz
  // ENTERPRISE: SuperAdmin için tüm firmalar, normal kullanıcı için müşteri firmaları
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  
  // SuperAdmin için tüm firmalar endpoint'i, normal kullanıcı için müşteri firmaları
  const apiUrl = isSuperAdmin 
    ? `/api/companies?${params.toString()}`
    : `/api/customer-companies?${params.toString()}`
  const { data: companies = [], isLoading, error, mutate: mutateCompanies } = useData<Company[]>(apiUrl, {
    dedupingInterval: 0, // Cache YOK - her seferinde fresh data (POST sonrası veri gelsin)
    revalidateOnFocus: true, // Focus'ta yeniden fetch yap (sayfa yenilendiğinde veri gelsin)
  })

  // Debug: Development'ta log ekle
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CompanyList data:', {
        apiUrl,
        companiesCount: companies.length,
        companies,
        isLoading,
        error,
      })
    }
  }, [apiUrl, companies, isLoading, error])

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`${name} firmasını silmek istediğinize emin misiniz?`)) {
      return
    }

      try {
      // ENTERPRISE: SuperAdmin için /api/companies, normal kullanıcı için /api/customer-companies
      const deleteUrl = isSuperAdmin 
        ? `/api/companies/${id}`
        : `/api/customer-companies/${id}`
      
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include', // Session cookie'lerini gönder
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete company')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedCompanies = companies.filter((c) => c.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      // revalidate: true = background refetch yapar, veritabanından güncel veri gelir
      await mutateCompanies(updatedCompanies, { revalidate: true })
      
      // ENTERPRISE: SuperAdmin için /api/companies, normal kullanıcı için /api/customer-companies
      const cacheKeys = isSuperAdmin
        ? ['/api/companies', '/api/companies?', apiUrl]
        : ['/api/customer-companies', '/api/customer-companies?', apiUrl]
      
      // Tüm ilgili URL'leri güncelle (revalidate ile)
      await Promise.all(
        cacheKeys.map(key => mutate(key, updatedCompanies, { revalidate: true }))
      )
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }, [companies, mutateCompanies, apiUrl, isSuperAdmin])

  const handleAdd = useCallback(() => {
    setSelectedCompany(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((company: Company) => {
    setSelectedCompany(company)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedCompany(null)
    // Form kapanırken cache'i güncelleme yapılmaz - onSuccess callback'te zaten yapılıyor
  }, [])

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/companies/export?format=${format}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `firmalar.${format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Export işlemi başarısız oldu')
    }
  }

  if (isLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isSuperAdmin ? 'Firmalar' : 'Müşteri Firmaları'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isSuperAdmin 
              ? `Toplam ${companies.length} firma`
              : `Toplam ${companies.length} müşteri firması`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button
              onClick={handleAdd}
              className="bg-gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Firma Ekle
            </Button>
          )}
          {!isSuperAdmin && (
            <Button
              onClick={handleAdd}
              className="bg-gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Müşteri Firması Ekle
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Dışa Aktar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma Adı</TableHead>
              <TableHead>Sektör</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Müşteriler</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Müşteri firması bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <Link 
                      href={`/${locale}/companies/${company.id}`} 
                      prefetch={true}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>{company.sector || '-'}</TableCell>
                  <TableCell>{company.city || '-'}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/${locale}/customers?customerCompanyId=${company.id}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{company.stats?.customers || 0}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        company.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {company.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/companies/${company.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon" aria-label={`${company.name} müşteri firmasını görüntüle`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(company)}
                        aria-label={`${company.name} müşteri firmasını düzenle`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company.id, company.name)}
                        aria-label={`${company.name} müşteri firmasını sil`}
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

      {/* Form Modal */}
      {formOpen && (
        <CompanyForm
          company={selectedCompany || undefined}
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={async (savedCompany: Company) => {
            // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
            // Böylece form kapanmadan önce firma listede görünür
            
            let updatedCompanies: Company[]
            
            if (selectedCompany) {
              // UPDATE: Mevcut kaydı güncelle
              updatedCompanies = companies.map((c) =>
                c.id === savedCompany.id ? savedCompany : c
              )
            } else {
              // CREATE: Yeni kaydı listenin başına ekle
              updatedCompanies = [savedCompany, ...companies]
            }
            
            // Cache'i güncelle - optimistic update'i hemen uygula
            // revalidate: true = background refetch yapar, veritabanından güncel veri gelir
            await mutateCompanies(updatedCompanies, { revalidate: true })
            
            // ENTERPRISE: SuperAdmin için /api/companies, normal kullanıcı için /api/customer-companies
            const cacheKeys = isSuperAdmin
              ? ['/api/companies', '/api/companies?', apiUrl]
              : ['/api/customer-companies', '/api/customer-companies?', apiUrl]
            
            // Her URL'i invalidate et ve refetch yap
            await Promise.all(
              cacheKeys.map((key) =>
                mutate(key, undefined, { revalidate: true })
              )
            )
            
            // Ayrıca global mutate ile tüm ilgili URL'leri invalidate et
            // SWR'nin key matcher'ını kullan
            const keyMatcher = isSuperAdmin
              ? (key: string) => typeof key === 'string' && key.includes('/api/companies')
              : (key: string) => typeof key === 'string' && key.includes('/api/customer-companies')
            
            await mutate(
              keyMatcher,
              undefined,
              { revalidate: true }
            )
            
            // Debug: Development'ta log ekle
            if (process.env.NODE_ENV === 'development') {
              console.log('CompanyList onSuccess - Updated companies:', {
                count: updatedCompanies.length,
                companies: updatedCompanies.map(c => ({ id: c.id, name: c.name })),
                savedCompany: savedCompany,
              })
            }
            
            // Manuel refetch - cache'den emin olmak için
            setTimeout(() => {
              mutateCompanies(undefined, { revalidate: true })
            }, 500) // 500ms sonra manuel refetch
          }}
        />
      )}
    </div>
  )
}
