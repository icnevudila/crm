'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Calendar, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { useData } from '@/hooks/useData'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast, confirm } from '@/lib/toast'
import Link from 'next/link'

interface ApprovalDetail {
  id: string
  title: string
  description: string
  relatedTo: string
  relatedId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  approverIds: string[]
  approvers?: Array<{ id: string; name: string; email: string }>
  requestedBy: string
  requester?: { name: string; email: string }
  approvedBy?: string
  approver?: { name: string; email: string }
  rejectedBy?: string
  rejectionReason?: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
  companyId: string
}

export default function ApprovalDetailPage() {
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const approvalId = params.id as string

  const { data: approval, isLoading, error, mutate } = useData<ApprovalDetail>(
    `/api/approvals/${approvalId}`
  )

  const handleApprove = async () => {
    const confirmed = await confirm('Bu onay talebini onaylamak istediğinize emin misiniz?')
    if (!confirmed) return

    const toastId = toast.loading('Onaylanıyor...')
    try {
      const res = await fetch(`/api/approvals/${approvalId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Onaylama işlemi başarısız')
      }

      await mutate()
      toast.dismiss(toastId)
      toast.success('Onaylandı', { description: 'Onay talebi başarıyla onaylandı.' })
    } catch (error: any) {
      console.error('Approve error:', error)
      toast.dismiss(toastId)
      toast.error('Onaylama başarısız', error?.message || 'Onaylama işlemi sırasında bir hata oluştu.')
    }
  }

  const handleReject = async () => {
    const reason = prompt('Red nedeni:')
    if (!reason || reason.trim() === '') {
      toast.warning('Red nedeni girmeniz gerekiyor', { description: 'Lütfen red nedeni belirtin' })
      return
    }

    const confirmed = await confirm('Bu onay talebini reddetmek istediğinize emin misiniz?')
    if (!confirmed) return

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

      await mutate()
      toast.dismiss(toastId)
      toast.success('Reddedildi', { description: 'Onay talebi reddedildi.' })
    } catch (error: any) {
      console.error('Reject error:', error)
      toast.dismiss(toastId)
      toast.error('Reddetme başarısız', error?.message || 'Reddetme işlemi sırasında bir hata oluştu.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 border-0">Onaylandı</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 border-0">Reddedildi</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-200 text-gray-800 border-0">İptal</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Bekliyor</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800 border-0">Yüksek</Badge>
      case 'NORMAL':
        return <Badge className="bg-blue-100 text-blue-800 border-0">Normal</Badge>
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800 border-0">Düşük</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  if (isLoading) return <SkeletonList />

  if (error || !approval) {
    return (
      <div className="space-y-6">
        <Link href={`/${locale}/approvals`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Hata</AlertTitle>
          <AlertDescription className="text-red-700">
            Onay talebi yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/approvals`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{approval.title}</h1>
            <p className="text-gray-500 mt-1">Onay Talebi Detayları</p>
          </div>
        </div>
        {approval.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Onayla
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reddet
            </Button>
          </div>
        )}
      </div>

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
                <p className="mt-1 text-sm">{approval.description || 'Açıklama yok'}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <div className="mt-1">{getStatusBadge(approval.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Öncelik</label>
                  <div className="mt-1">{getPriorityBadge(approval.priority)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">İlişkili Modül</label>
                  <div className="mt-1">
                    <Badge variant="outline">{approval.relatedTo}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kayıt ID</label>
                  <div className="mt-1 text-sm font-mono text-gray-600">
                    {approval.relatedId.substring(0, 8)}...
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
              {approval.approvers && approval.approvers.length > 0 ? (
                <div className="space-y-2">
                  {approval.approvers.map((approver) => (
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
                  <span className="text-sm">{approval.requester?.name || '-'}</span>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(new Date(approval.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </span>
                </div>
              </div>
              {approval.approvedAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Onaylanma Tarihi</label>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {format(new Date(approval.approvedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                    {approval.approver && (
                      <p className="text-xs text-gray-500 mt-1">
                        Onaylayan: {approval.approver.name}
                      </p>
                    )}
                  </div>
                </>
              )}
              {approval.rejectedAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reddedilme Tarihi</label>
                    <div className="mt-1 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        {format(new Date(approval.rejectedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                    {approval.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1 italic">
                        &quot;{approval.rejectionReason}&quot;
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
              <Link
                href={`/${locale}/${approval.relatedTo.toLowerCase()}s/${approval.relatedId}`}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">
                  {approval.relatedTo} kaydını görüntüle
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
