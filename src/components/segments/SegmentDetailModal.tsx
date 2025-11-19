'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Users, Filter, UserPlus, UserMinus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DetailModal from '@/components/ui/DetailModal'
import { toast, confirm } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import SegmentForm from './SegmentForm'

interface SegmentDetailModalProps {
  segmentId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function SegmentDetailModal({
  segmentId,
  open,
  onClose,
  initialData,
}: SegmentDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)

  const { data: segment, isLoading, error, mutate: mutateSegment } = useData<any>(
    segmentId && open ? `/api/segments/${segmentId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displaySegment = segment || initialData

  const handleDelete = async () => {
    if (!(await confirm(`${displaySegment?.name} segmentini silmek istediğinize emin misiniz?`))) {
      return
    }

    const toastId = toast.loading('Siliniyor...')
    try {
      const res = await fetch(`/api/segments/${segmentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete segment')
      }

      await mutate('/api/segments')
      toast.dismiss(toastId)
      toast.success('Silindi', { description: 'Segment başarıyla silindi.' })
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.dismiss(toastId)
      toast.error('Silme başarısız', error?.message || 'Silme işlemi sırasında bir hata oluştu.')
    }
  }

  const handleRemoveMember = async (memberId: string, customerName: string) => {
    if (!(await confirm(`${customerName} müşteriyi bu segmentten çıkarmak istediğinize emin misiniz?`))) {
      return
    }

    const toastId = toast.loading('Çıkarılıyor...')
    try {
      const res = await fetch(`/api/segments/${segmentId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove member')
      }

      await mutateSegment()
      toast.dismiss(toastId)
      toast.success('Çıkarıldı', { description: 'Üye segmentten çıkarıldı.' })
    } catch (error: any) {
      console.error('Remove member error:', error)
      toast.dismiss(toastId)
      toast.error('Çıkarma başarısız', error?.message || 'Üye çıkarma işlemi sırasında bir hata oluştu.')
    }
  }

  if (!open || !segmentId) return null

  if (isLoading && !initialData && !displaySegment) {
    return (
      <DetailModal open={open} onClose={onClose} title="Segment Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displaySegment) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Segment yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displaySegment) {
    return (
      <DetailModal open={open} onClose={onClose} title="Segment Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Segment bulunamadı</p>
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
        title={displaySegment?.name || 'Segment Detayları'}
        description={`#${segmentId?.substring(0, 8)} • ${displaySegment?.createdAt ? new Date(displaySegment.createdAt).toLocaleDateString('tr-TR') : ''}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Üye</p>
                    <p className="text-2xl font-bold">{displaySegment?.memberCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Filter className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Atama Türü</p>
                    <Badge className={displaySegment?.autoAssign ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-600 text-white border-gray-700'}>
                      {displaySegment?.autoAssign ? 'Otomatik' : 'Manuel'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durum</p>
                    <Badge className={displaySegment?.status === 'ACTIVE' ? 'bg-green-600 text-white border-green-700' : 'bg-gray-600 text-white border-gray-700'}>
                      {displaySegment?.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {displaySegment?.description && (
            <Card>
              <CardHeader>
                <CardTitle>Açıklama</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{displaySegment.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Criteria */}
          {displaySegment?.criteria && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-indigo-600" />
                  Filtreleme Kriterleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(displaySegment.criteria, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Segment Üyeleri ({displaySegment?.members?.length || 0})
                </CardTitle>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Üye Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {displaySegment?.members && displaySegment.members.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Katılma Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displaySegment.members.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.customer.name}</TableCell>
                          <TableCell>{member.customer.email}</TableCell>
                          <TableCell>{member.customer.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge className={member.customer.status === 'ACTIVE' ? 'bg-green-600 text-white border-green-700' : 'bg-gray-600 text-white border-gray-700'}>
                              {member.customer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(member.joinedAt).toLocaleDateString('tr-TR')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.id, member.customer.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Bu segmentte henüz üye yok</p>
                  <Button size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    İlk Üyeyi Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DetailModal>

      {/* Edit Form Modal */}
      {formOpen && displaySegment && (
        <SegmentForm
          segment={displaySegment}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={async () => {
            await mutateSegment()
            await mutate(`/api/segments/${segmentId}`)
            setFormOpen(false)
          }}
        />
      )}
    </>
  )
}




