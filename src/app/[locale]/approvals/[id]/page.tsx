'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface Approval {
  id: string
  relatedTo: string
  relatedId: string
  requestedBy: string
  requester: {
    name: string
    email: string
  }
  approverIds: string[]
  approvers: {
    id: string
    name: string
    email: string
  }[]
  status: string
  priority: string
  rejectionReason?: string
  approvedBy?: string
  approver?: {
    name: string
  }
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal',
}

const relatedToLabels: Record<string, string> = {
  Deal: 'Fırsat',
  Quote: 'Teklif',
  Contract: 'Sözleşme',
  Invoice: 'Fatura',
}

export default function ApprovalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const approvalId = params.id as string

  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: approval, isLoading } = useData<Approval>(`/api/approvals/${approvalId}`)

  const handleApprove = async () => {
    if (!confirm('Bu onay talebini onaylamak istediğinize emin misiniz?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        throw new Error('Onaylama işlemi başarısız')
      }

      mutate(`/api/approvals/${approvalId}`)
      mutate('/api/approvals')
      
      alert('✅ Onay talebi başarıyla onaylandı!')
    } catch (error: any) {
      console.error('Approve error:', error)
      alert(error?.message || 'Onaylama işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Red sebebi girmeniz gerekiyor')
      return
    }

    if (!confirm('Bu onay talebini reddetmek istediğinize emin misiniz?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (!res.ok) {
        throw new Error('Reddetme işlemi başarısız')
      }

      mutate(`/api/approvals/${approvalId}`)
      mutate('/api/approvals')
      
      alert('✅ Onay talebi reddedildi')
      router.push(`/${locale}/approvals`)
    } catch (error: any) {
      console.error('Reject error:', error)
      alert(error?.message || 'Reddetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!approval) {
    return <div>Onay talebi bulunamadı</div>
  }

  const isPending = approval.status === 'PENDING'
  const isApproved = approval.status === 'APPROVED'
  const isRejected = approval.status === 'REJECTED'

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
            <h1 className="text-3xl font-bold">Onay Talebi</h1>
            <p className="text-gray-600">
              #{approvalId.substring(0, 8)} • {new Date(approval.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <Badge className={
          isApproved ? 'bg-green-100 text-green-800 border-0' :
          isRejected ? 'bg-red-100 text-red-800 border-0' :
          'bg-yellow-100 text-yellow-800 border-0'
        }>
          {statusLabels[approval.status] || approval.status}
        </Badge>
      </div>

      {/* Status Alert */}
      {isPending && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Onay Bekliyor</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Bu talep henüz onaylanmadı. Onaylamak veya reddetmek için aşağıdaki butonları kullanın.
          </AlertDescription>
        </Alert>
      )}

      {isApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Onaylandı</AlertTitle>
          <AlertDescription className="text-green-700">
            Bu talep {approval.approver?.name || 'bir kullanıcı'} tarafından onaylandı.
            {approval.approvedAt && ` (${new Date(approval.approvedAt).toLocaleString('tr-TR')})`}
          </AlertDescription>
        </Alert>
      )}

      {isRejected && approval.rejectionReason && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Reddedildi</AlertTitle>
          <AlertDescription className="text-red-700">
            <strong>Sebep:</strong> {approval.rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Talep Bilgileri
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">İlgili Modül</p>
              <Badge className="bg-purple-100 text-purple-800 border-0">
                {relatedToLabels[approval.relatedTo] || approval.relatedTo}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Kayıt ID</p>
              <p className="text-xs text-gray-500 font-mono">{approval.relatedId}</p>
              <Link href={`/${locale}/${approval.relatedTo.toLowerCase()}s/${approval.relatedId}`}>
                <Button variant="link" size="sm" className="p-0 h-auto text-indigo-600">
                  Kaydı Görüntüle →
                </Button>
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Öncelik</p>
              <Badge className={
                approval.priority === 'HIGH' ? 'bg-red-100 text-red-800 border-0' :
                approval.priority === 'NORMAL' ? 'bg-blue-100 text-blue-800 border-0' :
                'bg-gray-100 text-gray-700 border-0'
              }>
                {approval.priority === 'HIGH' ? 'Yüksek' : approval.priority === 'NORMAL' ? 'Normal' : 'Düşük'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
              <p className="text-gray-900">{new Date(approval.createdAt).toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Kullanıcı Bilgileri
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Talep Eden</p>
              <p className="text-gray-900">{approval.requester.name}</p>
              <p className="text-sm text-gray-500">{approval.requester.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Onaylayıcılar</p>
              <div className="space-y-2">
                {approval.approvers && approval.approvers.length > 0 ? (
                  approval.approvers.map((approver) => (
                    <div key={approver.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{approver.name}</p>
                        <p className="text-xs text-gray-500">{approver.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Onaylayıcı bilgisi yok</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {isPending && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">İşlem Yapın</h3>
          <div className="space-y-4">
            {/* Approve Button */}
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Onayla
            </Button>

            {/* Reject Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Red Sebebi</label>
              <Textarea
                placeholder="Red sebebini yazın..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mb-2"
              />
              <Button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                variant="destructive"
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

