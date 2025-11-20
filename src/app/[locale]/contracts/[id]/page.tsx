'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, AlertTriangle, RefreshCw, FileText, Mail, MessageSquare, Calendar } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useData } from '@/hooks/useData'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import ContractForm from '@/components/contracts/ContractForm'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { toastError, confirm } from '@/lib/toast'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import DocumentList from '@/components/documents/DocumentList'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import { useQuickActionSuccess } from '@/lib/quick-action-helper'
import { formatCurrency } from '@/lib/utils'

interface Contract {
  id: string
  title: string
  status: string
  type: string
  value: number
  startDate: string
  endDate: string
  customer?: { name: string; email: string; phone: string }
  customerCompany?: { name: string }
  deal?: { title: string; value: number }
  createdAt: string
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const contractId = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { handleQuickActionSuccess } = useQuickActionSuccess()

  const { data: contract, isLoading, mutate } = useData<Contract>(`/api/contracts/${contractId}`)

  const handleDelete = async () => {
    if (!confirm(`${contract?.title} sözleşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Silme işlemi başarısız')
      }
      router.push(`/${locale}/contracts`)
    } catch (error: any) {
      toastError('Silme işlemi başarısız oldu', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sözleşme Bulunamadı</h1>
          <Button onClick={() => router.push(`/${locale}/contracts`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-orange-100 text-orange-800',
    TERMINATED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    ACTIVE: 'Aktif',
    EXPIRED: 'Süresi Doldu',
    TERMINATED: 'Sonlandırıldı',
  }

  const isExpired = contract.status === 'EXPIRED'
  const daysUntilExpiry = contract.endDate
    ? Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="contract"
        entityId={contractId}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
        onCreateRelated={(type) => {
          if (type === 'invoice') {
            setInvoiceFormOpen(true) // Modal form aç
          }
        }}
        onSendEmail={contract.customer?.email ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={contract.customer?.phone ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={contract.customer?.phone ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/${locale}/contracts`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contract.title}</h1>
            <p className="mt-1 text-gray-600">
              Oluşturulma: {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {contract.status === 'DRAFT' && (
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          )}
          {contract.status === 'DRAFT' && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          )}
          <Badge className={statusColors[contract.status] || 'bg-gray-100'}>
            {statusLabels[contract.status] || contract.status}
          </Badge>
        </div>
      </div>

      {/* EXPIRED Uyarısı ve Öneriler */}
      {isExpired && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            ⚠️ Bu Sözleşme Süresi Doldu
          </AlertTitle>
          <AlertDescription className="text-orange-800 mt-2">
            <p className="mb-3">
              Bu sözleşme süresi doldu (EXPIRED). Müşteri ile yenileme görüşmeleri başlatabilirsiniz.
              {contract.endDate && (
                <span className="block mt-1 text-sm">
                  Bitiş Tarihi: <strong>{new Date(contract.endDate).toLocaleDateString('tr-TR')}</strong>
                </span>
              )}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/contracts/new?renewal=${contractId}`)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenileme Sözleşmesi Oluştur
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/deals/new?contract=${contractId}`)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <FileText className="h-4 w-4 mr-2" />
                Yeni Fırsat Oluştur
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Yakında Dolacak Uyarısı (30 gün kala) */}
      {contract.status === 'ACTIVE' && daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900 font-semibold">
            ⏰ Sözleşme Yakında Dolacak
          </AlertTitle>
          <AlertDescription className="text-yellow-800 mt-2">
            <p className="mb-3">
              Bu sözleşme <strong>{daysUntilExpiry} gün</strong> sonra dolacak. 
              Yenileme görüşmeleri için hazırlık yapmanız önerilir.
              {contract.endDate && (
                <span className="block mt-1 text-sm">
                  Bitiş Tarihi: <strong>{new Date(contract.endDate).toLocaleDateString('tr-TR')}</strong>
                </span>
              )}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/contracts/new?renewal=${contractId}`)}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenileme Sözleşmesi Hazırla
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Toplam Değer</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(contract.value || 0)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Başlangıç Tarihi</p>
          <p className="text-lg font-semibold">
            {contract.startDate ? new Date(contract.startDate).toLocaleDateString('tr-TR') : '-'}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Bitiş Tarihi</p>
          <p className="text-lg font-semibold">
            {contract.endDate ? new Date(contract.endDate).toLocaleDateString('tr-TR') : '-'}
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      {contract.customer && (contract.customer.email || contract.customer.phone) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {contract.customer.email && (
              <SendEmailButton
                to={contract.customer.email}
                subject={`Sözleşme: ${contract.title}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Sözleşme Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Sözleşme:</strong> ${contract.title}</p>
                      <p><strong>Durum:</strong> ${statusLabels[contract.status] || contract.status}</p>
                      <p><strong>Değer:</strong> ${formatCurrency(contract.value)}</p>
                      <p><strong>Başlangıç:</strong> ${new Date(contract.startDate).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Bitiş:</strong> ${new Date(contract.endDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                      Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                    </p>
                  </div>
                `}
                category="GENERAL"
                entityData={contract}
                onSuccess={() => handleQuickActionSuccess({
                  entityType: 'contract',
                  entityName: contract.title,
                  entityId: contract.id,
                  actionType: 'updated',
                  onClose: () => {},
                })}
              />
            )}
            {contract.customer.phone && (
              <>
                <SendSmsButton
                  to={contract.customer.phone}
                  message={`Merhaba ${contract.customer.name}, sözleşme ${contract.title} hakkında size ulaşmak istiyoruz.`}
                  onSuccess={() => handleQuickActionSuccess({
                    entityType: 'contract',
                    entityName: contract.title,
                    entityId: contract.id,
                    actionType: 'updated',
                    onClose: () => {},
                  })}
                />
                <SendWhatsAppButton
                  to={contract.customer.phone}
                  message={`Merhaba ${contract.customer.name}, sözleşme ${contract.title} hakkında size ulaşmak istiyoruz.`}
                  onSuccess={() => handleQuickActionSuccess({
                    entityType: 'contract',
                    entityName: contract.title,
                    entityId: contract.id,
                    actionType: 'updated',
                    onClose: () => {},
                  })}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Customer Info */}
      {(contract.customer || contract.customerCompany) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Müşteri Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.customer && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Bireysel Müşteri</p>
                <p className="font-medium">{contract.customer.name}</p>
                {contract.customer.email && (
                  <p className="text-sm text-gray-600">{contract.customer.email}</p>
                )}
                {contract.customer.phone && (
                  <p className="text-sm text-gray-600">{contract.customer.phone}</p>
                )}
              </div>
            )}
            {contract.customerCompany && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Firma</p>
                <p className="font-medium">{contract.customerCompany.name}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Deal Info */}
      {contract.deal && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İlgili Fırsat</h2>
          <p className="font-medium">{contract.deal.title}</p>
          <p className="text-sm text-gray-600 mt-1">
            Değer: {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(contract.deal.value || 0)}
          </p>
        </Card>
      )}

      {/* Document List */}
      <DocumentList relatedTo="Contract" relatedId={contractId} />

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">İşlem Geçmişi</h2>
        <ActivityTimeline entityType="Contract" entityId={contractId} />
      </Card>

      {/* Contract Form Modal */}
      <ContractForm
        contract={contract}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          mutate()
          setFormOpen(false)
        }}
      />

      {/* Invoice Form Modal - İlişkili kayıt oluşturma */}
      <InvoiceForm
        invoice={undefined}
        open={invoiceFormOpen}
        onClose={() => setInvoiceFormOpen(false)}
        contractId={contractId}
        customerId={contract.customer?.id}
        customerCompanyId={contract.customerCompany?.id}
        onSuccess={async (savedInvoice: any) => {
          await mutate(undefined, { revalidate: true })
          setInvoiceFormOpen(false)
        }}
      />
    </div>
  )
}


