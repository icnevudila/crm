'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Building2, Users, Briefcase, FileText, Receipt, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import DetailModal from '@/components/ui/DetailModal'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const CompanyForm = dynamic(() => import('./CompanyForm'), {
  ssr: false,
  loading: () => null,
})

interface CompanyDetailModalProps {
  companyId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

const statusColors: Record<string, string> = {
  POT: 'bg-amber-600 text-white border-amber-700',
  MUS: 'bg-green-600 text-white border-green-700',
  ALT: 'bg-blue-600 text-white border-blue-700',
  PAS: 'bg-red-600 text-white border-red-700',
}

const statusLabels: Record<string, string> = {
  POT: 'Potansiyel',
  MUS: 'Müşteri',
  ALT: 'Alt Bayi',
  PAS: 'Pasif',
}

export default function CompanyDetailModal({
  companyId,
  open,
  onClose,
  initialData,
}: CompanyDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: company, isLoading, error, mutate: mutateCompany } = useData<any>(
    companyId && open ? `/api/companies/${companyId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayCompany = company || initialData

  const handleDelete = async () => {
    if (!displayCompany || !confirm(`${displayCompany.name} firmasını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Firma silindi')
      
      await mutate('/api/companies')
      await mutate(`/api/companies/${companyId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !companyId) return null

  if (isLoading && !initialData && !displayCompany) {
    return (
      <DetailModal open={open} onClose={onClose} title="Firma Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayCompany) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Firma yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayCompany) {
    return (
      <DetailModal open={open} onClose={onClose} title="Firma Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Firma bulunamadı</p>
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
        title={displayCompany?.name || 'Firma Detayları'}
        description="Firma bilgileri ve ilişkili kayıtlar"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Badge className={statusColors[displayCompany?.status] || 'bg-gray-600 text-white border-gray-700'}>
              {statusLabels[displayCompany?.status] || displayCompany?.status}
            </Badge>
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

          {/* Company Logo */}
          {displayCompany?.logoUrl && (
            <div className="flex justify-center">
              <Image
                src={displayCompany.logoUrl}
                alt={displayCompany.name}
                width={150}
                height={150}
                className="rounded-lg border object-contain"
                unoptimized
              />
            </div>
          )}

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">İletişim Bilgileri</h2>
              <div className="space-y-3">
                {displayCompany?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCompany.phone}</span>
                  </div>
                )}
                {displayCompany?.contactPerson && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCompany.contactPerson}</span>
                  </div>
                )}
                {displayCompany?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCompany.city}</span>
                  </div>
                )}
                {displayCompany?.sector && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCompany.sector}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Vergi Bilgileri</h2>
              <div className="space-y-3">
                {displayCompany?.taxNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vergi Numarası</p>
                    <p className="font-medium">{displayCompany.taxNumber}</p>
                  </div>
                )}
                {displayCompany?.taxOffice && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vergi Dairesi</p>
                    <p className="font-medium">{displayCompany.taxOffice}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Oluşturulma</p>
                  <p className="font-medium">
                    {displayCompany?.createdAt ? new Date(displayCompany.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats */}
          {displayCompany?.stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Müşteriler</span>
                </div>
                <p className="text-2xl font-bold">{displayCompany.stats.customers || 0}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm">Fırsatlar</span>
                </div>
                <p className="text-2xl font-bold">{displayCompany.stats.deals || 0}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Teklifler</span>
                </div>
                <p className="text-2xl font-bold">{displayCompany.stats.quotes || 0}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm">Faturalar</span>
                </div>
                <p className="text-2xl font-bold">{displayCompany.stats.invoices || 0}</p>
              </Card>
            </div>
          )}

          {/* Related Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Müşteriler */}
            {displayCompany?.Customer && displayCompany.Customer.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Müşteriler ({displayCompany.Customer.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCompany.Customer.slice(0, 5).map((customer: any) => (
                    <div
                      key={customer.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/customers/${customer.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.email && (
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          )}
                        </div>
                        <Badge>{customer.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Fırsatlar */}
            {displayCompany?.Deal && displayCompany.Deal.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Fırsatlar ({displayCompany.Deal.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCompany.Deal.slice(0, 5).map((deal: any) => (
                    <div
                      key={deal.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/deals/${deal.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-gray-600">{deal.stage}</p>
                        </div>
                        <Badge>{deal.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Teklifler */}
            {displayCompany?.Quote && displayCompany.Quote.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Teklifler ({displayCompany.Quote.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCompany.Quote.slice(0, 5).map((quote: any) => (
                    <div
                      key={quote.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/quotes/${quote.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{quote.title}</p>
                          <p className="text-sm text-gray-600">{quote.status}</p>
                        </div>
                        <Badge>{quote.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Faturalar */}
            {displayCompany?.Invoice && displayCompany.Invoice.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    Faturalar ({displayCompany.Invoice.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCompany.Invoice.slice(0, 5).map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/invoices/${invoice.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invoice.title}</p>
                          <p className="text-sm text-gray-600">{invoice.status}</p>
                        </div>
                        <Badge>{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </DetailModal>

      {/* Form Modal */}
      <CompanyForm
        company={displayCompany || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateCompany()
          await mutate(`/api/companies/${companyId}`)
        }}
      />
    </>
  )
}

