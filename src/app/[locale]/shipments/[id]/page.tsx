'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useData } from '@/hooks/useData'
import { 
  ArrowLeft, 
  Edit, 
  Truck, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Package, 
  User, 
  MapPin, 
  Calendar,
  Clock,
  FileText,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  Phone,
  Mail,
  Building2,
  ShoppingCart,
  DollarSign,
  Hash,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { toastSuccess, toastError } from '@/lib/toast'
import { motion } from 'framer-motion'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import { useQuickActionSuccess } from '@/lib/quick-action-helper'

async function fetchShipment(id: string) {
  const res = await fetch(`/api/shipments/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Sevkiyat detayları yüklenemedi')
  }
  return res.json()
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-gray-100 text-gray-800 border-gray-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  IN_TRANSIT: 'bg-blue-100 text-blue-800 border-blue-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  PENDING: 'Beklemede',
  APPROVED: 'Onaylı',
  IN_TRANSIT: 'Yolda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
}

const statusIcons: Record<string, any> = {
  DRAFT: FileText,
  PENDING: Clock,
  APPROVED: CheckCircle,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
}

export default function ShipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [approving, setApproving] = useState(false)
  const { handleQuickActionSuccess } = useQuickActionSuccess()

  const { data: shipment, isLoading, error, refetch } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => fetchShipment(id),
    retry: 1,
    retryDelay: 500,
  })

  const handleApprove = async () => {
    if (!confirm('Bu sevkiyatı onaylamak istediğinize emin misiniz? Onaylandığında stok düşecek ve rezerve miktar azalacak.')) {
      return
    }

    setApproving(true)
    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Sevkiyat onaylanamadı')
      }

      const result = await res.json()

      // Cache'i güncelle
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shipment', id] }),
        queryClient.invalidateQueries({ queryKey: ['shipments'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      ])

      // Veriyi yeniden çek
      await refetch()

      toastSuccess('Sevkiyat başarıyla onaylandı!', result.message || 'Stok düşürüldü ve rezerve miktar azaltıldı.')
    } catch (error: any) {
      console.error('Approve error:', error)
      toastError('Sevkiyat onaylanırken bir hata oluştu', error?.message)
    } finally {
      setApproving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Sevkiyat durumunu "${statusLabels[newStatus]}" olarak değiştirmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Durum değiştirilemedi')
      }

      const result = await res.json()

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shipment', id] }),
        queryClient.invalidateQueries({ queryKey: ['shipments'] }),
      ])

      await refetch()

      toastSuccess('Sevkiyat durumu güncellendi', result.message || `Sevkiyat durumu "${statusLabels[newStatus]}" olarak güncellendi.`)
    } catch (error: any) {
      console.error('Status change error:', error)
      toastError('Durum değiştirilemedi', error?.message)
    }
  }

  // Müşteri bilgisini al
  const getCustomer = () => {
    if (shipment?.Invoice?.Customer) {
      return shipment.Invoice.Customer
    }
    if (shipment?.Invoice?.Quote?.Deal?.Customer) {
      return shipment.Invoice.Quote.Deal.Customer
    }
    return null
  }

  const customer = getCustomer()

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !shipment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sevkiyat Bulunamadı
          </h1>
          <p className="text-gray-600 mb-4">
            {(error as any)?.message || 'Sevkiyat yüklenirken bir hata oluştu'}
          </p>
          <Button onClick={() => router.push(`/${locale}/shipments`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusIcons[shipment.status] || Info

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/shipments`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="h-8 w-8 text-indigo-600" />
              {(() => {
                const shipmentName = shipment.Invoice?.title 
                  ? `${shipment.Invoice.title} faturasına ait Sevkiyat`
                  : shipment.Invoice?.invoiceNumber
                  ? `Fatura #${shipment.Invoice.invoiceNumber} sevkiyatı`
                  : shipment.invoiceId
                  ? `Fatura #${shipment.invoiceId.substring(0, 8)} sevkiyatı`
                  : `Sevkiyat #${shipment.tracking || shipment.id.substring(0, 8)}`
                return shipmentName
              })()}
            </h1>
            {shipment.tracking && (
              <p className="mt-1 text-sm text-gray-500 font-mono">
                Takip No: {shipment.tracking}
              </p>
            )}
            <p className="mt-1 text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Oluşturulma: {new Date(shipment.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {shipment.status === 'DRAFT' && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {approving ? 'Onaylanıyor...' : 'Onayla'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/shipments`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Durum ve Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-card p-6 border-l-4 border-indigo-500"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Durum</p>
            <StatusIcon className={`h-5 w-5 ${statusColors[shipment.status]?.split(' ')[1] || 'text-gray-600'}`} />
          </div>
          <Badge className={`${statusColors[shipment.status]} text-base px-3 py-1`}>
            {statusLabels[shipment.status] || shipment.status}
          </Badge>
          {shipment.status === 'DRAFT' && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              ⚠️ Onaylandığında stok düşecek
            </p>
          )}
          {shipment.status === 'APPROVED' && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✓ Stok düşürüldü
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Takip Numarası</p>
            <Hash className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-lg font-mono font-semibold text-gray-900">
            {shipment.tracking || '-'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Fatura Toplamı</p>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {shipment.Invoice ? formatCurrency(shipment.Invoice.total || shipment.Invoice.totalAmount || 0) : '-'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Tahmini Teslim</p>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {shipment.estimatedDelivery 
              ? new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR')
              : '-'}
          </p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      {customer && (customer.email || customer.phone) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {customer.email && (
              <SendEmailButton
                to={customer.email}
                subject={`Sevkiyat Takip: ${shipment.tracking || shipment.id.substring(0, 8)}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Sevkiyat Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Takip No:</strong> ${shipment.tracking || shipment.id.substring(0, 8)}</p>
                      <p><strong>Durum:</strong> ${statusLabels[shipment.status] || shipment.status}</p>
                      ${shipment.Invoice?.invoiceNumber ? `<p><strong>Fatura No:</strong> ${shipment.Invoice.invoiceNumber}</p>` : ''}
                      ${shipment.shippingDate ? `<p><strong>Sevkiyat Tarihi:</strong> ${new Date(shipment.shippingDate).toLocaleDateString('tr-TR')}</p>` : ''}
                      ${shipment.expectedDeliveryDate ? `<p><strong>Tahmini Teslimat:</strong> ${new Date(shipment.expectedDeliveryDate).toLocaleDateString('tr-TR')}</p>` : ''}
                    </div>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                      Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                    </p>
                  </div>
                `}
                category="GENERAL"
                entityData={shipment}
                onSuccess={() => handleQuickActionSuccess({
                  entityType: 'shipment',
                  entityName: shipment.tracking || shipment.id.substring(0, 8),
                  entityId: shipment.id,
                })}
              />
            )}
            {customer.phone && (
              <>
                <SendSmsButton
                  to={customer.phone}
                  message={`Merhaba ${customer.name}, sevkiyatınız hakkında bilgi vermek istiyoruz. Takip No: ${shipment.tracking || shipment.id.substring(0, 8)}`}
                />
                <SendWhatsAppButton
                  phoneNumber={customer.phone}
                  entityType="shipment"
                  entityId={shipment.id}
                  customerName={customer.name}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Tabs: Detaylı Bilgiler */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Ürünler ({shipment.invoiceItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="customer">
            <User className="h-4 w-4 mr-2" />
            Müşteri
          </TabsTrigger>
          <TabsTrigger value="stock">
            <TrendingDown className="h-4 w-4 mr-2" />
            Stok Hareketleri ({shipment.stockMovements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        {/* Genel Bakış Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Sevkiyat Bilgileri */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              Sevkiyat Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sevkiyat ID</p>
                <p className="font-mono text-sm text-gray-900">{shipment.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Durum</p>
                <Badge className={statusColors[shipment.status]}>
                  {statusLabels[shipment.status] || shipment.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Takip Numarası</p>
                <p className="font-mono font-medium text-gray-900">
                  {shipment.tracking || 'Belirtilmemiş'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
                <p className="text-gray-900">
                  {new Date(shipment.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              {shipment.updatedAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Güncellenme Tarihi</p>
                  <p className="text-gray-900">
                    {new Date(shipment.updatedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
              {shipment.estimatedDelivery && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tahmini Teslim Tarihi</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {shipment.shippingCompany && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kargo Firması</p>
                  <p className="text-gray-900 font-medium">{shipment.shippingCompany}</p>
                </div>
              )}
              {shipment.deliveryAddress && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Teslimat Adresi</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{shipment.deliveryAddress}</p>
                </div>
              )}
            </div>
          </Card>

          {/* İlgili Fatura */}
          {shipment.Invoice && (
            <Card className="p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-indigo-600" />
                  İlgili Fatura
                </h2>
                <Link href={`/${locale}/invoices/${shipment.Invoice.id}`}>
                  <Button variant="outline" size="sm">
                    <Receipt className="mr-2 h-4 w-4" />
                    Faturaya Git
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fatura No</p>
                  <p className="font-medium text-gray-900">
                    {shipment.Invoice.invoiceNumber || shipment.Invoice.id.substring(0, 8)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fatura Başlığı</p>
                  <p className="font-medium text-gray-900">{shipment.Invoice.title || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Durum</p>
                  <Badge>{shipment.Invoice.status || '-'}</Badge>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Toplam Tutar</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(shipment.Invoice.total || shipment.Invoice.totalAmount || 0)}
                  </p>
                  {/* KDV ve İndirim Detayları */}
                  {(() => {
                    const taxRate = shipment.Invoice.taxRate || 18
                    const itemsTotal = shipment.invoiceItems?.reduce((sum: number, item: any) => 
                      sum + ((item.unitPrice || item.price || 0) * (item.quantity || 0)), 0) || 0
                    const discount = shipment.Invoice.discount || 0
                    const subtotal = itemsTotal - discount
                    const taxAmount = (subtotal * taxRate) / 100
                    const totalWithTax = subtotal + taxAmount
                    
                    return (
                      <div className="mt-3 pt-3 border-t space-y-1 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Ara Toplam (KDV Hariç):</span>
                          <span className="font-medium">{formatCurrency(itemsTotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>İndirim:</span>
                            <span className="font-medium">-{formatCurrency(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                          <span>KDV (%{taxRate}):</span>
                          <span className="font-medium">{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-semibold pt-1 border-t">
                          <span>Genel Toplam (KDV Dahil):</span>
                          <span>{formatCurrency(totalWithTax)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
                  <p className="text-gray-900">
                    {new Date(shipment.Invoice.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Müşteri Bilgileri */}
          {customer && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                Müşteri Bilgileri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Müşteri Adı</p>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">E-posta</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {customer.email}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Ürünler Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Sevkiyat İçeriği
                {shipment.invoiceItems && shipment.invoiceItems.length > 0 && (
                  <Badge variant="outline">({shipment.invoiceItems.length} ürün)</Badge>
                )}
              </h2>
            </div>
            {shipment.invoiceItems && shipment.invoiceItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>SKU/Barkod</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Mevcut Stok</TableHead>
                      <TableHead>Rezerve</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipment.invoiceItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.Product?.name || 'Ürün bulunamadı'}
                            </div>
                            {item.Product?.category && (
                              <div className="text-xs text-gray-500">{item.Product.category}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.Product?.sku && (
                              <div className="font-mono">SKU: {item.Product.sku}</div>
                            )}
                            {item.Product?.barcode && (
                              <div className="font-mono text-xs text-gray-500">
                                Barkod: {item.Product.barcode}
                              </div>
                            )}
                            {!item.Product?.sku && !item.Product?.barcode && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {item.quantity} {item.Product?.unit || 'ADET'}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(item.total || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.Product?.stock > 0 ? 'default' : 'destructive'}
                          >
                            {item.Product?.stock || 0} {item.Product?.unit || 'ADET'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(item.Product as any)?.reservedQuantity > 0 ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              {(item.Product as any).reservedQuantity} {item.Product?.unit || 'ADET'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Henüz ürün eklenmemiş
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Müşteri Tab */}
        <TabsContent value="customer" className="mt-6">
          {customer ? (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                Müşteri Detayları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Müşteri Adı</p>
                  <p className="text-lg font-semibold text-gray-900">{customer.name}</p>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">E-posta</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {customer.email}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="text-center py-8 text-gray-500">
                Müşteri bilgisi bulunamadı
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Stok Hareketleri Tab */}
        <TabsContent value="stock" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-indigo-600" />
              Stok Hareketleri
              {shipment.stockMovements && shipment.stockMovements.length > 0 && (
                <Badge variant="outline">({shipment.stockMovements.length} kayıt)</Badge>
              )}
            </h2>
            {shipment.stockMovements && shipment.stockMovements.length > 0 ? (
              <div className="space-y-3">
                {shipment.stockMovements.map((movement: any) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {movement.type === 'OUT' ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {movement.Product?.name || 'Ürün bulunamadı'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {movement.type === 'OUT' ? 'Çıkış' : 'Giriş'} - {movement.reason || '-'}
                        </p>
                        {movement.User && (
                          <p className="text-xs text-gray-400 mt-1">
                            {movement.User.name} tarafından
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${movement.type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                        {movement.type === 'OUT' ? '-' : '+'}{Math.abs(movement.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(movement.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Henüz stok hareketi yok
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Geçmiş Tab */}
        <TabsContent value="history" className="mt-6">
          {shipment.activities && shipment.activities.length > 0 ? (
            <ActivityTimeline activities={shipment.activities} />
          ) : (
            <Card className="p-6">
              <div className="text-center py-8 text-gray-500">
                Henüz aktivite kaydı yok
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Durum Değiştirme Butonları */}
      {shipment.status !== 'CANCELLED' && shipment.status !== 'DELIVERED' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Durum Yönetimi
          </h3>
          <div className="flex gap-2 flex-wrap">
            {shipment.status !== 'IN_TRANSIT' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('IN_TRANSIT')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Truck className="mr-2 h-4 w-4" />
                Yolda Yap
              </Button>
            )}
            {shipment.status !== 'DELIVERED' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('DELIVERED')}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Teslim Edildi Yap
              </Button>
            )}
            {shipment.status !== 'CANCELLED' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('CANCELLED')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <XCircle className="mr-2 h-4 w-4" />
                İptal Et
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
