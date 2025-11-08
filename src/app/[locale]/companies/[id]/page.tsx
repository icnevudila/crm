'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Users, Building2, Mail, Phone, Globe, FileText, DollarSign, Briefcase, Calendar, Plus, Receipt } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Company {
  id: string
  name: string
  sector?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  taxNumber?: string
  taxOffice?: string
  description?: string
  status: string
  logoUrl?: string
  createdAt: string
  updatedAt?: string
  User?: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
  Customer?: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    status: string
    createdAt: string
  }>
  Deal?: Array<{
    id: string
    title: string
    stage: string
    value: number
    status: string
    createdAt: string
  }>
  Quote?: Array<{
    id: string
    title: string
    status: string
    total: number
    createdAt: string
  }>
  Invoice?: Array<{
    id: string
    title: string
    status: string
    total: number
    createdAt: string
  }>
  activities?: any[]
}

async function fetchCompany(id: string): Promise<Company> {
  const res = await fetch(`/api/companies/${id}`)
  if (!res.ok) throw new Error('Failed to fetch company')
  return res.json()
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => fetchCompany(id),
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Firma bulunamadı</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/companies`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  // ENTERPRISE: Durum renkleri
  const statusColors: Record<string, string> = {
    'POTANSİYEL': 'bg-amber-100 text-amber-800 border-amber-300',
    'MÜŞTERİ': 'bg-green-100 text-green-800 border-green-300',
    'ALTBAYİ': 'bg-blue-100 text-blue-800 border-blue-300',
    'PASİF': 'bg-red-100 text-red-800 border-red-300',
    'ACTIVE': 'bg-green-100 text-green-800 border-green-300',
    'INACTIVE': 'bg-red-100 text-red-800 border-red-300',
  }

  const statusLabels: Record<string, string> = {
    'POTANSİYEL': 'Potansiyel',
    'MÜŞTERİ': 'Müşteri',
    'ALTBAYİ': 'Alt Bayi',
    'PASİF': 'Pasif',
    'ACTIVE': 'Aktif',
    'INACTIVE': 'Pasif',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/companies`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="mt-1 text-gray-600">Firma Detayları</p>
          </div>
        </div>
      </div>

      {/* ENTERPRISE: Sabit Üst Kart (Summary) - Logo, Şehir, Durum, Vergi No */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt={company.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* Firma Bilgileri */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                  {company.sector && (
                    <p className="text-sm text-gray-600 mt-1">{company.sector}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  {/* Şehir */}
                  {company.city && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{company.city}</span>
                    </div>
                  )}

                  {/* Durum */}
                  <Badge className={statusColors[company.status] || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[company.status] || company.status}
                  </Badge>

                  {/* Vergi No */}
                  {company.taxNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Vergi No: {company.taxNumber}
                      </span>
                    </div>
                  )}

                  {/* Vergi Dairesi */}
                  {company.taxOffice && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {company.taxOffice}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ENTERPRISE: Hızlı Eylemler (Sağ Taraf) */}
            <div className="flex flex-col gap-2">
              <Link href={`/${locale}/meetings/new?companyId=${company.id}`}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Calendar className="mr-2 h-4 w-4" />
                  Görüşme Ekle
                </Button>
              </Link>
              <Link href={`/${locale}/quotes/new?companyId=${company.id}`}>
                <Button variant="outline" className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                  <FileText className="mr-2 h-4 w-4" />
                  Teklif Oluştur
                </Button>
              </Link>
              <Link href={`/${locale}/finance/new?companyId=${company.id}`}>
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Receipt className="mr-2 h-4 w-4" />
                  Gider Gir
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Firma Bilgileri
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <Badge className={`${statusColors[company.status] || 'bg-gray-100 text-gray-800'} mt-1`}>
                {statusLabels[company.status] || company.status}
              </Badge>
            </div>
            {company.sector && (
              <div>
                <p className="text-sm text-gray-600">Sektör</p>
                <p className="font-medium mt-1">{company.sector}</p>
              </div>
            )}
            {company.city && (
              <div>
                <p className="text-sm text-gray-600">Şehir</p>
                <p className="font-medium mt-1">{company.city}</p>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{company.phone}</p>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{company.email}</p>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                  {company.website}
                </a>
              </div>
            )}
            {company.address && (
              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-medium mt-1">{company.address}</p>
              </div>
            )}
            {company.taxNumber && (
              <div>
                <p className="text-sm text-gray-600">Vergi No</p>
                <p className="font-medium mt-1">{company.taxNumber}</p>
              </div>
            )}
            {company.taxOffice && (
              <div>
                <p className="text-sm text-gray-600">Vergi Dairesi</p>
                <p className="font-medium mt-1">{company.taxOffice}</p>
              </div>
            )}
            {company.description && (
              <div>
                <p className="text-sm text-gray-600">Açıklama</p>
                <p className="font-medium mt-1">{company.description}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Firma ID</p>
              <p className="font-mono text-sm mt-1">{company.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(company.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {company.updatedAt && (
              <div>
                <p className="text-sm text-gray-600">Son Güncelleme</p>
                <p className="font-medium mt-1">
                  {new Date(company.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* İlişkili Veriler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kullanıcılar */}
        {company.User && company.User.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kullanıcılar ({company.User.length})
            </h2>
            <div className="space-y-2">
              {company.User.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Badge>{user.role}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Müşteriler */}
        {company.Customer && company.Customer.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Müşteriler ({company.Customer.length})
              </h2>
              {company.Customer.length > 5 && (
                <Link href={`/${locale}/customers?companyId=${company.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {company.Customer.slice(0, 5).map((customer) => (
                <Link key={customer.id} href={`/${locale}/customers/${customer.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                    </div>
                    <Badge className={customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Fırsatlar */}
        {company.Deal && company.Deal.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Fırsatlar ({company.Deal.length})
              </h2>
              {company.Deal.length > 5 && (
                <Link href={`/${locale}/deals?companyId=${company.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {company.Deal.slice(0, 5).map((deal) => (
                <Link key={deal.id} href={`/${locale}/deals/${deal.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-gray-600">{deal.stage}</p>
                    </div>
                    <p className="font-semibold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(deal.value)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Teklifler */}
        {company.Quote && company.Quote.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Teklifler ({company.Quote.length})
              </h2>
              {company.Quote.length > 5 && (
                <Link href={`/${locale}/quotes?companyId=${company.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {company.Quote.slice(0, 5).map((quote) => (
                <Link key={quote.id} href={`/${locale}/quotes/${quote.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium">{quote.title}</p>
                      <p className="text-sm text-gray-600">{quote.status}</p>
                    </div>
                    <p className="font-semibold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Faturalar */}
        {company.Invoice && company.Invoice.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Faturalar ({company.Invoice.length})
              </h2>
              {company.Invoice.length > 5 && (
                <Link href={`/${locale}/invoices?companyId=${company.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {company.Invoice.slice(0, 5).map((invoice) => (
                <Link key={invoice.id} href={`/${locale}/invoices/${invoice.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium">{invoice.title}</p>
                      <p className="text-sm text-gray-600">{invoice.status}</p>
                    </div>
                    <p className="font-semibold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(invoice.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Activity Timeline */}
      {company.activities && company.activities.length > 0 && (
        <ActivityTimeline activities={company.activities} />
      )}
    </div>
  )
}

