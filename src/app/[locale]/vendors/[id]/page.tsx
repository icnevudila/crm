'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Users, Building2, Mail, Phone, Globe, FileText, DollarSign, Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'

interface Vendor {
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
  createdAt: string
  updatedAt?: string
  Quote?: Array<{
    id: string
    title: string
    status: string
    total: number
    createdAt: string
  }>
  Product?: Array<{
    id: string
    name: string
    price: number
    stock: number
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
    trackingNumber?: string
    status: string
    createdAt: string
  }>
  activities?: any[]
}

async function fetchVendor(id: string): Promise<Vendor> {
  const res = await fetch(`/api/vendors/${id}`)
  if (!res.ok) throw new Error('Failed to fetch vendor')
  return res.json()
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => fetchVendor(id),
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tedarikçi bulunamadı</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/vendors`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/vendors`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
            <p className="mt-1 text-gray-600">Tedarikçi Detayları</p>
          </div>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tedarikçi Bilgileri
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <Badge
                className={
                  vendor.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 mt-1'
                    : 'bg-red-100 text-red-800 mt-1'
                }
              >
                {vendor.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            {vendor.sector && (
              <div>
                <p className="text-sm text-gray-600">Sektör</p>
                <p className="font-medium mt-1">{vendor.sector}</p>
              </div>
            )}
            {vendor.city && (
              <div>
                <p className="text-sm text-gray-600">Şehir</p>
                <p className="font-medium mt-1">{vendor.city}</p>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{vendor.phone}</p>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{vendor.email}</p>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                  {vendor.website}
                </a>
              </div>
            )}
            {vendor.address && (
              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-medium mt-1">{vendor.address}</p>
              </div>
            )}
            {vendor.taxNumber && (
              <div>
                <p className="text-sm text-gray-600">Vergi No</p>
                <p className="font-medium mt-1">{vendor.taxNumber}</p>
              </div>
            )}
            {vendor.taxOffice && (
              <div>
                <p className="text-sm text-gray-600">Vergi Dairesi</p>
                <p className="font-medium mt-1">{vendor.taxOffice}</p>
              </div>
            )}
            {vendor.description && (
              <div>
                <p className="text-sm text-gray-600">Açıklama</p>
                <p className="font-medium mt-1">{vendor.description}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Tedarikçi ID</p>
              <p className="font-mono text-sm mt-1">{vendor.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(vendor.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {vendor.updatedAt && (
              <div>
                <p className="text-sm text-gray-600">Son Güncelleme</p>
                <p className="font-medium mt-1">
                  {new Date(vendor.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* İlişkili Veriler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teklifler */}
        {vendor.Quote && vendor.Quote.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Teklifler ({vendor.Quote.length})
              </h2>
              {vendor.Quote.length > 5 && (
                <Link href={`/${locale}/quotes?vendorId=${vendor.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {vendor.Quote.slice(0, 5).map((quote) => (
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

        {/* Ürünler */}
        {vendor.Product && vendor.Product.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ürünler ({vendor.Product.length})
              </h2>
              {vendor.Product.length > 5 && (
                <Link href={`/${locale}/products?vendorId=${vendor.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {vendor.Product.slice(0, 5).map((product) => (
                <Link key={product.id} href={`/${locale}/products/${product.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">Stok: {product.stock}</p>
                    </div>
                    <p className="font-semibold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Faturalar */}
        {vendor.Invoice && vendor.Invoice.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Faturalar ({vendor.Invoice.length})
              </h2>
              {vendor.Invoice.length > 5 && (
                <Link href={`/${locale}/invoices?vendorId=${vendor.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {vendor.Invoice.slice(0, 5).map((invoice) => (
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

        {/* Sevkiyatlar */}
        {vendor.Shipment && vendor.Shipment.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Sevkiyatlar ({vendor.Shipment.length})
              </h2>
              {vendor.Shipment.length > 5 && (
                <Link href={`/${locale}/shipments?vendorId=${vendor.id}`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {vendor.Shipment.slice(0, 5).map((shipment: any) => (
                <Link key={shipment.id} href={`/${locale}/shipments/${shipment.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium">{shipment.trackingNumber || 'Sevkiyat'}</p>
                      <p className="text-sm text-gray-600">{shipment.status}</p>
                    </div>
                    <Badge>{shipment.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Activity Timeline */}
      {vendor.activities && vendor.activities.length > 0 && (
        <ActivityTimeline activities={vendor.activities} />
      )}
    </div>
  )
}





