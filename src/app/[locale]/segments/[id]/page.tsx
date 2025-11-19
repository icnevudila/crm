'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Users, Filter, Edit, Trash2, UserPlus, UserMinus, TrendingUp, Search, Check } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import SegmentForm from '@/components/segments/SegmentForm'
import { mutate } from 'swr'
<<<<<<< HEAD
import { confirm } from '@/lib/toast'
=======
import { toastError, toast, toastSuccess } from '@/lib/toast'
>>>>>>> 2f6c0097c017a17c4f8c673c6450be3bfcfd0aa8

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
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const { data: segment, isLoading } = useData<Segment>(`/api/segments/${segmentId}`)
  
  // Müşteri listesi için API
  const customersApiUrl = `/api/customers?pageSize=100${customerSearch ? `&search=${customerSearch}` : ''}`
  const { data: customersData } = useData<{ data: any[] } | any[]>(customersApiUrl)
  
  // Müşteri listesini güvenli şekilde al
  const customers = Array.isArray(customersData) 
    ? customersData 
    : (customersData && typeof customersData === 'object' && 'data' in customersData && Array.isArray(customersData.data))
      ? customersData.data
      : []
  
  // Segment'te zaten üye olan müşterileri filtrele
  const existingMemberIds = segment?.members?.map(m => m.customerId) || []
  const availableCustomers = customers.filter((c: any) => !existingMemberIds.includes(c.id))

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
      toastError('Silme işlemi başarısız oldu', error?.message)
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
      toastSuccess('Üye çıkarıldı', `${customerName} segmentten çıkarıldı.`)
    } catch (error: any) {
      console.error('Remove member error:', error)
      toastError('Üye çıkarma işlemi başarısız oldu', error?.message)
    }
  }

  const handleAddMember = async () => {
    if (!selectedCustomerId) {
      toast.error('Müşteri seçilmedi', { description: 'Lütfen bir müşteri seçin.' })
      return
    }

    const selectedCustomer = availableCustomers.find((c: any) => c.id === selectedCustomerId)
    if (!selectedCustomer) {
      toast.error('Müşteri bulunamadı', { description: 'Seçilen müşteri bulunamadı.' })
      return
    }

    try {
      const res = await fetch(`/api/segments/${segmentId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomerId }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Üye eklenemedi')
      }

      // Refresh segment data
      mutate(`/api/segments/${segmentId}`)
      toastSuccess('Üye eklendi', `${selectedCustomer.name} segment'e eklendi.`)
      
      // Modal'ı kapat ve form'u temizle
      setAddMemberModalOpen(false)
      setSelectedCustomerId(null)
      setCustomerSearch('')
    } catch (error: any) {
      console.error('Add member error:', error)
      toastError('Üye ekleme işlemi başarısız oldu', error?.message)
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
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setAddMemberModalOpen(true)}
          >
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
            <Button 
              size="sm" 
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setAddMemberModalOpen(true)}
            >
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

      {/* Add Member Modal */}
      <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Segment'e Üye Ekle</DialogTitle>
            <DialogDescription>
              {segment?.name} segment'ine eklenecek müşteriyi seçin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Müşteri ara..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Customer List */}
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {availableCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Eklenecek müşteri bulunamadı</p>
                  {existingMemberIds.length > 0 && (
                    <p className="text-sm mt-2">Tüm müşteriler zaten bu segmentte</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {availableCustomers.map((customer: any) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedCustomerId(customer.id)}
                      >
                        <TableCell className="w-12">
                          {selectedCustomerId === customer.id && (
                            <Check className="h-5 w-5 text-indigo-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setAddMemberModalOpen(false)
                setSelectedCustomerId(null)
                setCustomerSearch('')
              }}>
                İptal
              </Button>
              <Button 
                onClick={handleAddMember}
                disabled={!selectedCustomerId}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

