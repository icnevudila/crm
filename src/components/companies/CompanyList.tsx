'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { toast, confirm } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Download, FileSpreadsheet, FileText, Users, Briefcase, FileText as FileTextIcon, Receipt, Calendar, Building2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
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
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

const CompanyForm = dynamic(() => import('./CompanyForm'), { ssr: false, loading: () => null })
const DealForm = dynamic(() => import('../deals/DealForm'), { ssr: false, loading: () => null })
const InvoiceForm = dynamic(() => import('../invoices/InvoiceForm'), { ssr: false, loading: () => null })
const FinanceForm = dynamic(() => import('../finance/FinanceForm'), { ssr: false, loading: () => null })
const MeetingForm = dynamic(() => import('../meetings/MeetingForm'), { ssr: false, loading: () => null })
const CompanyDetailModal = dynamic(() => import('./CompanyDetailModal'), { ssr: false, loading: () => null })

interface Company {
  id: string
  name: string
  sector?: string
  city?: string
  status: string
  taxOffice?: string
  taxNumber?: string
  lastMeetingDate?: string
  contactPerson?: string
  phone?: string
  countryCode?: string
  logoUrl?: string
  createdAt: string
  stats?: {
    customers: number
    deals: number
    quotes: number
    invoices: number
  }
}

// Durum renkleri ve etiketleri
const statusColors: Record<string, string> = {
  POT: 'bg-amber-100 text-amber-800 border-amber-200',
  MUS: 'bg-green-100 text-green-800 border-green-200',
  ALT: 'bg-blue-100 text-blue-800 border-blue-200',
  PAS: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<string, string> = {
  POT: 'Potansiyel',
  MUS: 'MÃ¼ÅŸteri',
  ALT: 'Alt Bayi',
  PAS: 'Pasif',
}

// Durum bazlÄ± satÄ±r renkleri
const statusRowColors: Record<string, string> = {
  POT: 'bg-amber-50/30 border-l-4 border-amber-400',
  MUS: 'bg-green-50/30 border-l-4 border-green-400',
  ALT: 'bg-blue-50/30 border-l-4 border-blue-400',
  PAS: 'bg-red-50/30 border-l-4 border-red-400',
}

export default function CompanyList() {
  const locale = useLocale()
  const t = useTranslations('companies')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [city, setCity] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedCompanyData, setSelectedCompanyData] = useState<Company | null>(null)
  const [quickAction, setQuickAction] = useState<{ type: 'deal' | 'invoice' | 'finance' | 'meeting'; company: Company } | null>(null)

  // KURUM İÇİ FİRMA YÖNETİMİ: Tüm kullanıcılar (SuperAdmin dahil) müşteri firmalarını görür
  // Login sayfasındaki Company tablosu değil, CustomerCompany tablosu kullanılır
  // Bu sayede Ali Düvenci'nin çalıştığı "Tıpplus" gibi müşteri firmaları yönetilir
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
  // KURUM İÇİ FİRMA YÖNETİMİ: Tüm kullanıcılar CustomerCompany tablosundan veri çeker
  // apiUrl'i memoize et - her render'da yeni string oluşturulmasını önle (auto refresh sorunu)
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status && status !== 'all') params.append('status', status)
    if (city && city !== 'all') params.append('city', city)
    return `/api/customer-companies?${params.toString()}`
  }, [debouncedSearch, status, city])
  
  const { data: companies = [], isLoading, error, mutate: mutateCompanies } = useData<Company[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (güncellemeler daha hızlı görünsün)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma (auto refresh yok)
    refreshInterval: 0, // Otomatik refresh yok
  })

  // Şehir listesini memoize et - hook'lar component'in en üst seviyesinde olmalı (React Hook Rules)
  const cityOptions = useMemo(() => {
    // Şehir listesini çıkar (unique)
    const cities = Array.from(
      new Set(companies.map((c) => c.city).filter(Boolean))
    ).sort() as string[]
    return cities
  }, [companies])

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!(await confirm(`${name} firmasını silmek istediğinize emin misiniz?`))) {
      return
    }

    const toastId = toast.loading('Siliniyor...')
    try {
      // KURUM İÇİ FİRMA YÖNETİMİ: Tüm kullanıcılar CustomerCompany tablosundan siler
      const deleteUrl = `/api/customer-companies/${id}`
      
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include', // Session cookie'lerini gönder
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız oldu')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedCompanies = companies.filter((c) => c.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      // revalidate: false = optimistic update korunur, background refetch yapmaz
      await mutateCompanies(updatedCompanies, { revalidate: false })
      
      // KURUM İÇİ FİRMA YÖNETİMİ: CustomerCompany cache'lerini güncelle
      const cacheKeys = ['/api/customer-companies', '/api/customer-companies?', apiUrl]
      
      // Tüm ilgili URL'leri güncelle (optimistic update)
      await Promise.all(
        cacheKeys.map(key => mutate(key, updatedCompanies, { revalidate: false }))
      )

      toast.dismiss(toastId)
      toast.success('Silindi', 'Firma başarıyla silindi.')
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.dismiss(toastId)
      toast.error('Silme başarısız', error?.message || 'Silme işlemi sırasında bir hata oluştu.')
    }
  }, [companies, mutateCompanies, apiUrl])

  const handleAdd = useCallback(() => {
    setSelectedCompany(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((company: Company) => {
    setSelectedCompany(company)
    setFormOpen(true)
  }, [])

  const closeQuickAction = useCallback(() => {
    setQuickAction(null)
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
      toast.warning(t('exportFailed'))
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
            {isSuperAdmin ? t('title') : t('customerCompaniesTitle')}
          </h1>
          <p className="mt-2 text-gray-600">
            {isSuperAdmin 
              ? t('totalCompanies', { count: companies.length })
              : t('totalCustomerCompanies', { count: companies.length })
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
              {t('addCompany')}
            </Button>
          )}
          {!isSuperAdmin && (
            <Button
              onClick={handleAdd}
              className="bg-gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('addCustomerCompany')}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                DÄ±ÅŸa Aktar
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
            placeholder="Firma adÄ±, vergi dairesi, vergi no ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="POT">Potansiyel</SelectItem>
            <SelectItem value="MUS">Müşteri</SelectItem>
            <SelectItem value="ALT">Alt Bayi</SelectItem>
            <SelectItem value="PAS">Pasif</SelectItem>
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Şehir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Şehirler</SelectItem>
            {cityOptions.map((cityName) => (
              <SelectItem key={cityName} value={cityName}>
                {cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Firma AdÄ±</TableHead>
              <TableHead>Åehir</TableHead>
              <TableHead>Vergi Dairesi</TableHead>
              <TableHead>Vergi No</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Son GÃ¶rÃ¼ÅŸme</TableHead>
              <TableHead className="text-right">Ä°ÅŸlemler</TableHead>
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
              companies.map((company, index) => (
                <motion.tr
                  key={company.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    'border-b-2 border-gray-200 hover:shadow-md transition-all duration-200',
                    statusRowColors[company.status] || 'bg-white'
                  )}
                  style={{
                    willChange: 'transform',
                    transform: 'translateZ(0)', // GPU acceleration
                  }}
                >
                  <TableCell className="font-medium">
                    <Link 
                      href={`/${locale}/companies/${company.id}`} 
                      prefetch={true}
                      className="hover:text-primary-600 transition-colors flex items-center gap-2"
                    >
                      {company.logoUrl && (
                        <Image
                          src={company.logoUrl}
                          alt={company.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded object-cover"
                          unoptimized={company.logoUrl.startsWith('blob:') || company.logoUrl.startsWith('data:')}
                        />
                      )}
                      <span>{company.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{company.city || '-'}</TableCell>
                  <TableCell>{company.taxOffice || '-'}</TableCell>
                  <TableCell>{company.taxNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'font-medium border',
                        statusColors[company.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                      )}
                    >
                      {statusLabels[company.status] || company.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {company.lastMeetingDate ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(company.lastMeetingDate).toLocaleDateString('tr-TR')}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('quickActions.open', { name: company.name })}
                          >
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{t('quickActions.title')}</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onSelect={() => setQuickAction({ type: 'deal', company })}
                            disabled={!company.stats?.customers || company.stats.customers === 0}
                          >
                            <Briefcase className="h-4 w-4" />
                            {t('quickActions.createDeal')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={() => setQuickAction({ type: 'invoice', company })}
                            disabled={!company.stats?.customers || company.stats.customers === 0}
                          >
                            <Receipt className="h-4 w-4" />
                            {t('quickActions.createInvoice')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setQuickAction({ type: 'finance', company })}>
                            <FileTextIcon className="h-4 w-4" />
                            <span>{t('quickActions.createFinance')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setQuickAction({ type: 'meeting', company })}>
                            <Calendar className="h-4 w-4" />
                            <span>{t('quickActions.scheduleMeeting')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCompanyId(company.id)
                          setSelectedCompanyData(company)
                          setDetailModalOpen(true)
                        }}
                        aria-label={`${company.name} müşteri firmasını görüntüle`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
                        className="text-red-600 hover:text-red-700"
                        aria-label={`${company.name} müşteri firmasını sil`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <CompanyDetailModal
        companyId={selectedCompanyId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedCompanyId(null)
          setSelectedCompanyData(null)
        }}
        initialData={selectedCompanyData || undefined}
      />

      {/* Form Modal */}
      <CompanyForm
        company={selectedCompany || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedCompany: Company) => {
          // Optimistic update - yeni/güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
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
          
          // Cache'i güncelle - optimistic update'i hemen uygula ve koru
          // revalidate: false = background refetch yapmaz, optimistic update korunur
          await mutateCompanies(updatedCompanies, { revalidate: false })
          
          // Tüm diğer customer-companies URL'lerini de güncelle (optimistic update)
          await Promise.all([
            mutate('/api/customer-companies', updatedCompanies, { revalidate: false }),
            mutate('/api/customer-companies?', updatedCompanies, { revalidate: false }),
            mutate(apiUrl, updatedCompanies, { revalidate: false }),
          ])
          
          // Form'u kapat
          setFormOpen(false)
          setSelectedCompany(null)

          // Yeni firma oluşturulduysa detay sayfasına yönlendir
          if (!selectedCompany) {
            router.push(`/${locale}/companies/${savedCompany.id}`)
          }
        }}
      />
      <DealForm
        open={quickAction?.type === 'deal'}
        onClose={closeQuickAction}
        onSuccess={async (savedDeal) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.company.id}
        customerCompanyName={quickAction?.company.name}
      />
      <InvoiceForm
        open={quickAction?.type === 'invoice'}
        onClose={closeQuickAction}
        onSuccess={async (savedInvoice) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.company.id}
        customerCompanyName={quickAction?.company.name}
      />
      <FinanceForm
        open={quickAction?.type === 'finance'}
        onClose={closeQuickAction}
        onSuccess={async (savedFinance) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.company.id}
      />
      <MeetingForm
        open={quickAction?.type === 'meeting'}
        onClose={closeQuickAction}
        onSuccess={async (savedMeeting) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.company.id}
        customerCompanyName={quickAction?.company.name}
      />
    </div>
  )
}
