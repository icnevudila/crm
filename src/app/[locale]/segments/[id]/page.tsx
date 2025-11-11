'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Users, Filter, Edit, Trash2, UserPlus, UserMinus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useData } from '@/hooks/useData'
import SegmentForm from '@/components/segments/SegmentForm'
import { mutate } from 'swr'

interface SegmentMember {
  id: string
  customerId: string
  customer: {
    name: string
    email: string
    phone?: string
    status: string
  }
  joinedAt: string
}

interface Segment {
  id: string
  name: string
  description?: string
  criteria?: any
  autoAssign: boolean
  memberCount: number
  status: string
  members: SegmentMember[]
  createdAt: string
  updatedAt: string
}

export default function SegmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const segmentId = params.id as string

  const [formOpen, setFormOpen] = useState(false)

  const { data: segment, isLoading } = useData<Segment>(`/api/segments/${segmentId}`)

  const handleDelete = async () => {
    if (!confirm(`${segment?.name} segmentini silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/segments/${segmentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete segment')
      }

      router.push(`/${locale}/segments`)
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }

  const handleRemoveMember = async (memberId: string, customerName: string) => {
    if (!confirm(`${customerName} müşteriyi bu segmentten çıkarmak istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/segments/${segmentId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to remove member')
      }

      // Refresh segment data
      mutate(`/api/segments/${segmentId}`)
    } catch (error: any) {
      console.error('Remove member error:', error)
      alert(error?.message || 'Üye çıkarma işlemi başarısız oldu')
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

  if (!segment) {
    return <div>Segment bulunamadı</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/segments`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{segment.name}</h1>
            <p className="text-gray-600">
              #{segmentId.substring(0, 8)} • {new Date(segment.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Üye</p>
              <p className="text-2xl font-bold">{segment.memberCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Filter className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Atama Türü</p>
              <Badge className={segment.autoAssign ? 'bg-indigo-100 text-indigo-800 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                {segment.autoAssign ? 'Otomatik' : 'Manuel'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <Badge className={segment.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                {segment.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Description */}
      {segment.description && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Açıklama</h3>
          <p className="text-gray-600">{segment.description}</p>
        </Card>
      )}

      {/* Criteria */}
      {segment.criteria && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600" />
            Filtreleme Kriterleri
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify(segment.criteria, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {/* Members List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Segment Üyeleri ({segment.members?.length || 0})
          </h3>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Üye Ekle
          </Button>
        </div>

        {segment.members && segment.members.length > 0 ? (
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
                {segment.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.customer.name}</TableCell>
                    <TableCell>{member.customer.email}</TableCell>
                    <TableCell>{member.customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={member.customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
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
      </Card>

      {/* Edit Form Modal */}
      <SegmentForm
        segment={segment}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          mutate(`/api/segments/${segmentId}`)
          setFormOpen(false)
        }}
      />
    </div>
  )
}

