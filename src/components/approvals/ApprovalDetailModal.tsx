'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { CheckCircle, XCircle, Clock, User, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import DetailModal from '@/components/ui/DetailModal'
import { toast, confirm } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ApprovalDetailModalProps {
  approvalId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function ApprovalDetailModal({
  approvalId,
  open,
  onClose,
  initialData,
}: ApprovalDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const { data: approval, isLoading, error, mutate: mutateApproval } = useData<any>(
    approvalId && open ? `/api/approvals/${approvalId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayApproval = approval || initialData

  const handleApprove = async () => {
    const confirmed = await confirm('Bu onay talebini onaylamak istediğinize emin misiniz?')
    if (!confirmed) return

    setApproving(true)
    const toastId = toast.loading('Onaylanıyor...')
    try {
      const res = await fetch(`/api/approvals/${approvalId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Onaylama işlemi başarısız')
      }

      await mutateApproval()
      await mutate('/api/approvals')
      toast.dismiss(toastId)
      toast.success('Onaylandı', { description: 'Onay talebi başarıyla onaylandı.' })
    } catch (error: any) {
      console.error('Approve error:', error)
      toast.dismiss(toastId)
      toast.error('Onaylama başarısız', error?.message || 'Onaylama işlemi sırasında bir hata oluştu.')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Red nedeni:')
    if (!reason || reason.trim() === '') {
      toast.warning('Red nedeni girmeniz gerekiyor', { description: 'Lütfen red nedeni giriniz' })
      return
    }

    const confirmed = await confirm('Bu onay talebini reddetmek istediğinize emin misiniz?')
    if (!confirmed) return

    setRejecting(true)
    const toastId = toast.loading('Reddediliyor...')
    try {
      const res = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Reddetme işlemi başarısız')
      }

      await mutateApproval()
      await mutate('/api/approvals')
      toast.dismiss(toastId)
      toast.success('Reddedildi', { description: 'Onay talebi reddedildi.' })
    } catch (error: any) {
      console.error('Reject error:', error)
      toast.dismiss(toastId)
      toast.error('Reddetme başarısız', error?.message || 'Reddetme işlemi sırasında bir hata oluştu.')
    } finally {
      setRejecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-600 text-white border-green-700">Onaylandı</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-600 text-white border-red-700">Reddedildi</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-600 text-white border-gray-700">İptal</Badge>
      default:
        return <Badge className="bg-yellow-600 text-white border-yellow-700">Bekliyor</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-600 text-white border-red-700">Yüksek</Badge>
      case 'NORMAL':
        return <Badge className="bg-blue-600 text-white border-blue-700">Normal</Badge>
      case 'LOW':
        return <Badge className="bg-gray-600 text-white border-gray-700">Düşük</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  if (!open || !approvalId) return null

  if (isLoading && !initialData && !displayApproval) {
    return (
      <DetailModal open={open} onClose={onClose} title="Onay Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayApproval) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Onay talebi yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayApproval) {
    return (
      <DetailModal open={open} onClose={onClose} title="Onay Talebi Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Onay talebi bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={displayApproval?.title || 'Onay Detayları'}
      description="Onay Talebi Detayları"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        {displayApproval?.status === 'PENDING' && (
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {approving ? 'Onaylanıyor...' : 'Onayla'}
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejecting}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {rejecting ? 'Reddediliyor...' : 'Reddet'}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Detaylar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Açıklama</label>
                  <p className="mt-1 text-sm">{displayApproval?.description || 'Açıklama yok'}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Durum</label>
                    <div className="mt-1">{getStatusBadge(displayApproval?.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Öncelik</label>
                    <div className="mt-1">{getPriorityBadge(displayApproval?.priority)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">İlişkili Modül</label>
                    <div className="mt-1">
                      <Badge variant="outline">{displayApproval?.relatedTo}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kayıt ID</label>
                    <div className="mt-1 text-sm font-mono text-gray-600">
                      {displayApproval?.relatedId?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approvers Card */}
            <Card>
              <CardHeader>
                <CardTitle>Onaylayıcılar</CardTitle>
                <CardDescription>Bu onay talebini onaylaması gereken kişiler</CardDescription>
              </CardHeader>
              <CardContent>
                {displayApproval?.approvers && displayApproval.approvers.length > 0 ? (
                  <div className="space-y-2">
                    {displayApproval.approvers.map((approver: any) => (
                      <div
                        key={approver.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <User className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium">{approver.name}</p>
                          <p className="text-sm text-gray-500">{approver.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Onaylayıcı bulunamadı</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Durum Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Talep Eden</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{displayApproval?.requester?.name || '-'}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {displayApproval?.createdAt ? format(new Date(displayApproval.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr }) : '-'}
                    </span>
                  </div>
                </div>
                {displayApproval?.approvedAt && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Onaylanma Tarihi</label>
                      <div className="mt-1 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {format(new Date(displayApproval.approvedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
                      {displayApproval?.approver && (
                        <p className="text-xs text-gray-500 mt-1">
                          Onaylayan: {displayApproval.approver.name}
                        </p>
                      )}
                    </div>
                  </>
                )}
                {displayApproval?.rejectedAt && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reddedilme Tarihi</label>
                      <div className="mt-1 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">
                          {format(new Date(displayApproval.rejectedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
                      {displayApproval?.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 italic">
                          &quot;{displayApproval.rejectionReason}&quot;
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Related Entity Link */}
            <Card>
              <CardHeader>
                <CardTitle>İlişkili Kayıt</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  onClick={() => {
                    onClose()
                    router.push(`/${locale}/${displayApproval?.relatedTo?.toLowerCase()}s/${displayApproval?.relatedId}`)
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">
                    {displayApproval?.relatedTo} kaydını görüntüle
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DetailModal>
  )
}

