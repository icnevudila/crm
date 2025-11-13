'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Search, Plus, Info, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ApprovalForm from '@/components/approvals/ApprovalForm'
import { useData } from '@/hooks/useData'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { toast, confirm } from '@/lib/toast'
import dynamic from 'next/dynamic'

const ApprovalDetailModal = dynamic(() => import('@/components/approvals/ApprovalDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface Approval {
  id: string
  title: string
  description: string
  relatedTo: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  priority: string
  createdAt: string
  requestedBy: { name: string; email: string }
  approvedBy?: { name: string }
  rejectedBy?: { name: string }
  rejectionReason?: string
}

export default function ApprovalsPage() {
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [selectedApprovalData, setSelectedApprovalData] = useState<Approval | null>(null)

  const apiUrl = `/api/approvals${activeTab === 'mine' ? '?myApprovals=true' : ''}`
  const { data: approvals = [], isLoading, error, mutate: mutateApprovals } = useData<Approval[]>(apiUrl)

  const handleApprove = async (id: string) => {
    const confirmed = await confirm('Bu onay talebini onaylamak istediğinize emin misiniz?')
    if (!confirmed) {
      return
    }

    const toastId = toast.loading('Onaylanıyor...')
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Onaylama işlemi başarısız')
      }
      
      await mutateApprovals()
      toast.dismiss(toastId)
      toast.success('Onaylandı', 'Onay talebi başarıyla onaylandı.')
    } catch (error: any) {
      console.error('Approve error:', error)
      toast.dismiss(toastId)
      toast.error('Onaylama başarısız', error?.message || 'Onaylama işlemi sırasında bir hata oluştu.')
    }
  }

  const getRowClasses = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50/80 border-l-4 border-emerald-400'
      case 'REJECTED':
        return 'bg-rose-50/80 border-l-4 border-rose-400'
      default:
        return ''
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Red nedeni:')
    if (!reason || reason.trim() === '') {
      alert('Red nedeni girmeniz gerekiyor')
      return
    }

    const confirmed = await confirm('Bu onay talebini reddetmek istediğinize emin misiniz?')
    if (!confirmed) {
      return
    }

    const toastId = toast.loading('Reddediliyor...')
    try {
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Reddetme işlemi başarısız')
      }
      
      await mutateApprovals()
      toast.dismiss(toastId)
      toast.success('Reddedildi', 'Onay talebi reddedildi.')
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

  if (isLoading) return <SkeletonList />

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Onaylar</h1>
          <p className="text-gray-500 mt-1">Onay bekleyen ve işlenmiş talepler</p>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertTitle className="text-red-800">Hata</AlertTitle>
          <AlertDescription className="text-red-700">
            Onaylar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const filteredApprovals = approvals.filter((a) =>
    search ? a.title?.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onaylar</h1>
          <p className="text-gray-500 mt-1">Onay bekleyen ve işlenmiş talepler</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Onay Talebi
        </Button>
      </div>

      {/* Bilgilendirme Notu */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-semibold">Onay Sistemi Hakkında</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          <div className="space-y-2">
            <p className="font-medium">Otomatik Onaylanan İşlemler:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li><strong>Teklif (Quote):</strong> 50.000 TRY ve altındaki tutarlar otomatik onaylanır</li>
              <li><strong>Fırsat (Deal):</strong> 100.000 TRY ve altındaki tutarlar otomatik onaylanır</li>
              <li><strong>Fatura (Invoice):</strong> 75.000 TRY ve altındaki tutarlar otomatik onaylanır</li>
              <li><strong>Sözleşme (Contract):</strong> 50.000 TRY ve altındaki tutarlar otomatik onaylanır</li>
            </ul>
            <p className="font-medium mt-3">Yönetici Onayı Gereken İşlemler:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li><strong>Teklif (Quote):</strong> 50.000 TRY üzerindeki tutarlar için yönetici onayı gerekir</li>
              <li><strong>Fırsat (Deal):</strong> 100.000 TRY üzerindeki tutarlar için yönetici onayı gerekir</li>
              <li><strong>Fatura (Invoice):</strong> 75.000 TRY üzerindeki tutarlar için yönetici onayı gerekir</li>
              <li><strong>Sözleşme (Contract):</strong> 50.000 TRY üzerindeki tutarlar için yönetici onayı gerekir</li>
            </ul>
            <p className="text-xs mt-3 italic text-blue-600">
              💡 Tüm işlemler için onay kaydı oluşturulur ve takip edilebilir. Threshold altındaki işlemler otomatik onaylanır, üstündekiler yönetici onayı bekler.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tüm Onaylar</TabsTrigger>
          <TabsTrigger value="mine">Benim Onaylarım</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Onay ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>İlişkili</TableHead>
                  <TableHead>Talep Eden</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Onay talebi bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApprovals.map((approval) => (
                  <TableRow key={approval.id} className={getRowClasses(approval.status)}>
                      <TableCell>
                        <div>
                          <Link 
                            href={`/${locale}/approvals/${approval.id}`}
                            className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            {approval.title}
                          </Link>
                          {approval.description && (
                            <div className="text-xs text-gray-500 mt-1">{approval.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{approval.relatedTo}</Badge>
                      </TableCell>
                      <TableCell>{approval.requestedBy?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(approval.status)}</TableCell>
                      <TableCell>
                        {format(new Date(approval.createdAt), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {approval.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(approval.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(approval.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reddet
                              </Button>
                            </>
                          )}
                          {approval.status !== 'PENDING' && (
                            <div className="flex flex-col items-end gap-1 text-sm text-gray-500">
                              {approval.status === 'APPROVED' && approval.approvedBy && (
                                <span>Onaylayan: {approval.approvedBy.name}</span>
                              )}
                              {approval.status === 'REJECTED' && approval.rejectedBy && (
                                <>
                                  <span>Reddeden: {approval.rejectedBy.name}</span>
                                  {approval.rejectionReason && (
                                    <span className="text-xs italic">&quot;{approval.rejectionReason}&quot;</span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-2"
                            title="Detayları Görüntüle"
                            onClick={() => {
                              setSelectedApprovalId(approval.id)
                              setSelectedApprovalData(approval)
                              setDetailModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <ApprovalDetailModal
        approvalId={selectedApprovalId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedApprovalId(null)
          setSelectedApprovalData(null)
        }}
        initialData={selectedApprovalData || undefined}
      />

      {/* Approval Form Modal */}
      <ApprovalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          mutateApprovals()
          setFormOpen(false)
        }}
      />
    </div>
  )
}

