'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Users, Building2, Mail, Phone, Globe, FileText, DollarSign, Briefcase, Calendar, Plus, Receipt, X, Truck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import { motion } from 'framer-motion'
import Image from 'next/image'
import CompanyForm from '@/components/companies/CompanyForm'
import { MeetingCreateButton } from '@/components/companies/actions/MeetingCreateButton'
import { QuoteCreateButton } from '@/components/companies/actions/QuoteCreateButton'
import { TaskCreateButton } from '@/components/companies/actions/TaskCreateButton'
import { cn } from '@/lib/utils'

interface Company {
  id: string
  name: string
  sector?: string
  city?: string
  address?: string
  phone?: string
  countryCode?: string
  contactPerson?: string
  email?: string
  website?: string
  taxNumber?: string
  taxOffice?: string
  description?: string
  status: string
  logoUrl?: string
  lastMeetingDate?: string
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
  Shipment?: Array<{
    id: string
    tracking?: string
    status: string
    createdAt: string
  }>
  Finance?: Array<{
    id: string
    type: string
    amount: number
    description?: string
    createdAt: string
  }>
  Meeting?: Array<{
    id: string
    title: string
    meetingDate: string
    status: string
    createdAt: string
  }>
  activities?: any[]
}

async function fetchCompany(id: string): Promise<Company> {
  // KURUM İÇİ FİRMA YÖNETİMİ: CustomerCompany endpoint'ini kullan
  const res = await fetch(`/api/customer-companies/${id}`)
  if (!res.ok) throw new Error('Failed to fetch company')
  return res.json()
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [isEditMode, setIsEditMode] = useState(false)

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

  // ENTERPRISE: Durum renkleri (POT, MUS, ALT, PAS)
  const statusColors: Record<string, string> = {
    'POT': 'bg-amber-100 text-amber-800 border-amber-300',
    'MUS': 'bg-green-100 text-green-800 border-green-300',
    'ALT': 'bg-blue-100 text-blue-800 border-blue-300',
    'PAS': 'bg-red-100 text-red-800 border-red-300',
    'POTANSİYEL': 'bg-amber-100 text-amber-800 border-amber-300',
    'MÜŞTERİ': 'bg-green-100 text-green-800 border-green-300',
    'ALTBAYİ': 'bg-blue-100 text-blue-800 border-blue-300',
    'PASİF': 'bg-red-100 text-red-800 border-red-300',
    'ACTIVE': 'bg-green-100 text-green-800 border-green-300',
    'INACTIVE': 'bg-red-100 text-red-800 border-red-300',
  }

  const statusLabels: Record<string, string> = {
    'POT': 'Potansiyel',
    'MUS': 'Müşteri',
    'ALT': 'Alt Bayi',
    'PAS': 'Pasif',
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
        {!isEditMode && (
          <Button
            variant="outline"
            onClick={() => setIsEditMode(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        )}
      </div>

      {/* Company Form (Edit Mode) */}
      {isEditMode && (
        <CompanyForm
          company={company}
          open={isEditMode}
          onClose={() => setIsEditMode(false)}
          onSuccess={async () => {
            setIsEditMode(false)
            // Cache'i invalidate et - yeni veriyi çek
            window.location.reload()
          }}
        />
      )}

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
              <MeetingCreateButton companyId={company.id} />
              <QuoteCreateButton companyId={company.id} />
              <TaskCreateButton companyId={company.id} />
              <Link href={`/${locale}/finance/new?customerCompanyId=${company.id}`} prefetch={true}>
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Receipt className="mr-2 h-4 w-4" />
                  Gider Gir
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>

      {!isEditMode && (
        <Accordion
          type="multiple"
          defaultValue={['profile', 'contacts', 'meetings', 'quotes']}
          className="space-y-4"
        >
          <AccordionItem value="profile">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Profil Bilgileri
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                <Card className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
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
                    {company.contactPerson && (
                      <div>
                        <p className="text-sm text-gray-600">Kontak Kişi</p>
                        <p className="mt-1 font-medium">{company.contactPerson}</p>
                      </div>
                    )}
                    {company.sector && (
                      <div>
                        <p className="text-sm text-gray-600">Sektör</p>
                        <p className="mt-1 font-medium">{company.sector}</p>
                      </div>
                    )}
                    {company.city && (
                      <div>
                        <p className="text-sm text-gray-600">Şehir</p>
                        <p className="mt-1 font-medium">{company.city}</p>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">
                          {company.countryCode && <span>{company.countryCode} </span>}
                          {company.phone}
                        </p>
                      </div>
                    )}
                    {company.lastMeetingDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Son Görüşme</p>
                          <p className="mt-1 font-medium">
                            {new Date(company.lastMeetingDate).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
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
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    {company.address && (
                      <div>
                        <p className="text-sm text-gray-600">Adres</p>
                        <p className="mt-1 font-medium">{company.address}</p>
                      </div>
                    )}
                    {company.taxNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Vergi No</p>
                        <p className="mt-1 font-medium">{company.taxNumber}</p>
                      </div>
                    )}
                    {company.taxOffice && (
                      <div>
                        <p className="text-sm text-gray-600">Vergi Dairesi</p>
                        <p className="mt-1 font-medium">{company.taxOffice}</p>
                      </div>
                    )}
                    {company.description && (
                      <div>
                        <p className="text-sm text-gray-600">Açıklama</p>
                        <p className="mt-1 font-medium">{company.description}</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">Kayıt Detayları</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Firma ID</p>
                      <p className="mt-1 font-mono text-sm">{company.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                      <p className="mt-1 font-medium">
                        {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {company.updatedAt && (
                      <div>
                        <p className="text-sm text-gray-600">Son Güncelleme</p>
                        <p className="mt-1 font-medium">
                          {new Date(company.updatedAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contacts">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  İletişim Kişileri
                </span>
                <Badge variant="outline">{company.Customer?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {company.Customer && Array.isArray(company.Customer) && company.Customer.length > 0 ? (
                  company.Customer.map((customer: any) => (
                    <Card key={customer.id} className="border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{customer.name}</p>
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            {customer.email && <p>{customer.email}</p>}
                            {customer.phone && <p>{customer.phone}</p>}
                          </div>
                        </div>
                        <Badge variant="outline">{customer.status || 'Bilinmiyor'}</Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <p>Henüz kayıtlı bir iletişim kişisi yok.</p>
                    <Link href={`/${locale}/customers`} prefetch={true}>
                      <Button variant="outline" className="mt-4">
                        İletişim Kişisi Ekle
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="meetings">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Görüşmeler
                </span>
                <Badge variant="outline">{company.Meeting?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                {company.Meeting && company.Meeting.length > 0 ? (
                  <>
                    {company.Meeting.map((meeting) => (
                      <Link key={meeting.id} href={`/${locale}/meetings/${meeting.id}`} prefetch={true}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">{meeting.title}</p>
                            <p className="text-sm text-slate-600">
                              {new Date(meeting.meetingDate).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <Badge>{meeting.status}</Badge>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link href={`/${locale}/meetings?customerCompanyId=${company.id}`} prefetch={true}>
                        <Button variant="outline" className="w-full">
                          Tüm Görüşmeleri Gör
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <Calendar className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p>Henüz görüşme kaydı yok</p>
                    <Link href={`/${locale}/meetings/new?customerCompanyId=${company.id}`} prefetch={true}>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Görüşme Ekle
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="quotes">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Teklifler
                </span>
                <Badge variant="outline">{company.Quote?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                {company.Quote && company.Quote.length > 0 ? (
                  <>
                    {company.Quote.map((quote) => (
                      <Link key={quote.id} href={`/${locale}/quotes/${quote.id}`} prefetch={true}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">{quote.title}</p>
                            <p className="text-sm text-slate-600">{quote.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.total)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link href={`/${locale}/quotes?customerCompanyId=${company.id}`} prefetch={true}>
                        <Button variant="outline" className="w-full">
                          Tüm Teklifleri Gör
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <FileText className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p>Henüz teklif kaydı yok</p>
                    <Link href={`/${locale}/quotes/new?customerCompanyId=${company.id}`} prefetch={true}>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Teklif Oluştur
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="deals">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Fırsatlar
                </span>
                <Badge variant="outline">{company.Deal?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                {company.Deal && company.Deal.length > 0 ? (
                  <>
                    {company.Deal.map((deal) => (
                      <Link key={deal.id} href={`/${locale}/deals/${deal.id}`} prefetch={true}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">{deal.title}</p>
                            <p className="text-sm text-slate-600">{deal.stage}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(deal.value)}
                            </p>
                            <Badge className="mt-1">{deal.status}</Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link href={`/${locale}/deals?customerCompanyId=${company.id}`} prefetch={true}>
                        <Button variant="outline" className="w-full">
                          Tüm Fırsatları Gör
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <Briefcase className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p>Henüz fırsat kaydı yok</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="invoices">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Faturalar
                </span>
                <Badge variant="outline">{company.Invoice?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                {company.Invoice && company.Invoice.length > 0 ? (
                  <>
                    {company.Invoice.map((invoice) => (
                      <Link key={invoice.id} href={`/${locale}/invoices/${invoice.id}`} prefetch={true}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">{invoice.title}</p>
                            <p className="text-sm text-slate-600">{invoice.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(invoice.total)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link href={`/${locale}/invoices?customerCompanyId=${company.id}`} prefetch={true}>
                        <Button variant="outline" className="w-full">
                          Tüm Faturaları Gör
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <DollarSign className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p>Henüz fatura kaydı yok</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shipments">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Sevkiyatlar
                </span>
                <Badge variant="outline">{company.Shipment?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                {company.Shipment && company.Shipment.length > 0 ? (
                  <>
                    {company.Shipment.map((shipment) => (
                      <Link key={shipment.id} href={`/${locale}/shipments/${shipment.id}`} prefetch={true}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">
                              {shipment.tracking || `Sevkiyat #${shipment.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-slate-600">{shipment.status}</p>
                          </div>
                          <Badge>{shipment.status}</Badge>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link href={`/${locale}/shipments?customerCompanyId=${company.id}`} prefetch={true}>
                        <Button variant="outline" className="w-full">
                          Tüm Sevkiyatları Gör
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <Truck className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p>Henüz sevkiyat kaydı yok</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="finance">
            <AccordionTrigger className="text-left">
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Giderler
                </span>
                <Badge variant="outline">{company.Finance?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                {company.Finance && company.Finance.length > 0 ? (
                  <>
                    {company.Finance.map((finance) => (
                      <Link key={finance.id} href={`/${locale}/finance/${finance.id}`} prefetch={true}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">
                              {finance.description || (finance.type === 'EXPENSE' ? 'Gider' : 'Gelir')}
                            </p>
                            <p className="text-sm text-slate-600">{finance.type}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn('font-semibold', finance.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600')}>
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(finance.amount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(finance.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link href={`/${locale}/finance?customerCompanyId=${company.id}`} prefetch={true}>
                        <Button variant="outline" className="w-full">
                          Tüm Giderleri Gör
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    <Receipt className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p>Henüz gider kaydı yok</p>
                    <Link href={`/${locale}/finance/new?customerCompanyId=${company.id}`} prefetch={true}>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Gider Gir
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Activity Timeline */}
      {company.activities && company.activities.length > 0 && (
        <ActivityTimeline activities={company.activities} />
      )}
    </div>
  )
}

