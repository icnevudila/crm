'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Mail, Phone, MapPin, Building2, FileText, Package, Truck, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import DetailModal from '@/components/ui/DetailModal'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

const VendorForm = dynamic(() => import('./VendorForm'), {
  ssr: false,
  loading: () => null,
})

interface VendorDetailModalProps {
  vendorId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function VendorDetailModal({
  vendorId,
  open,
  onClose,
  initialData,
}: VendorDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: vendor, isLoading, error, mutate: mutateVendor } = useData<any>(
    vendorId && open ? `/api/vendors/${vendorId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayVendor = vendor || initialData

  const handleDelete = async () => {
    if (!displayVendor || !confirm(`${displayVendor.name} tedarikçisini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Tedarikçi silindi')
      
      await mutate('/api/vendors')
      await mutate(`/api/vendors/${vendorId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !vendorId) return null

  if (isLoading && !initialData && !displayVendor) {
    return (
      <DetailModal open={open} onClose={onClose} title="Tedarikçi Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayVendor) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Tedarikçi yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayVendor) {
    return (
      <DetailModal open={open} onClose={onClose} title="Tedarikçi Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Tedarikçi bulunamadı</p>
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
        title={displayVendor?.name || 'Tedarikçi Detayları'}
        description="Tedarikçi bilgileri ve ilişkili kayıtlar"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Badge className={displayVendor?.status === 'ACTIVE' ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'}>
              {displayVendor?.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
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

          {/* Vendor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">İletişim Bilgileri</h2>
              <div className="space-y-3">
                {displayVendor?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayVendor.email}</span>
                  </div>
                )}
                {displayVendor?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayVendor.phone}</span>
                  </div>
                )}
                {displayVendor?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{displayVendor.address}</span>
                  </div>
                )}
                {displayVendor?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayVendor.city}</span>
                  </div>
                )}
                {displayVendor?.sector && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayVendor.sector}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Durum</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Durum:</span>
                  <Badge className={displayVendor?.status === 'ACTIVE' ? 'bg-green-600 text-white ml-2 border-green-700' : 'bg-red-600 text-white ml-2 border-red-700'}>
                    {displayVendor?.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Oluşturulma:</span>
                  <span className="ml-2 text-gray-700">
                    {displayVendor?.createdAt ? new Date(displayVendor.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Related Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teklifler */}
            {displayVendor?.Quote && displayVendor.Quote.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Teklifler ({displayVendor.Quote.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayVendor.Quote.slice(0, 5).map((quote: any) => (
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

            {/* Ürünler */}
            {displayVendor?.Product && displayVendor.Product.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Ürünler ({displayVendor.Product.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayVendor.Product.slice(0, 5).map((product: any) => (
                    <div
                      key={product.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/products/${product.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">Stok: {product.stock || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Faturalar */}
            {displayVendor?.Invoice && displayVendor.Invoice.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    Faturalar ({displayVendor.Invoice.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayVendor.Invoice.slice(0, 5).map((invoice: any) => (
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

            {/* Sevkiyatlar */}
            {displayVendor?.Shipment && displayVendor.Shipment.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-600" />
                    Sevkiyatlar ({displayVendor.Shipment.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayVendor.Shipment.slice(0, 5).map((shipment: any) => (
                    <div
                      key={shipment.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/shipments/${shipment.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{shipment.trackingNumber || shipment.id.substring(0, 8)}</p>
                          <p className="text-sm text-gray-600">{shipment.status}</p>
                        </div>
                        <Badge>{shipment.status}</Badge>
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
      <VendorForm
        vendor={displayVendor || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateVendor()
          await mutate(`/api/vendors/${vendorId}`)
        }}
      />
    </>
  )
}

