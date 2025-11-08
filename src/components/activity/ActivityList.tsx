'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SkeletonList from '@/components/skeletons/SkeletonList'

interface ActivityLog {
  id: string
  entity: string
  action: string
  description?: string
  meta?: any
  User?: { name: string; email: string }
  createdAt: string
}

async function fetchActivityLogs(
  entity: string,
  action: string,
  userId: string
): Promise<ActivityLog[]> {
  const params = new URLSearchParams()
  if (entity) params.append('entity', entity)
  if (action) params.append('action', action)
  if (userId) params.append('userId', userId)
  params.append('limit', '100')

  const res = await fetch(`/api/activity?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch activity logs')
  return res.json()
}

const entityLabels: Record<string, string> = {
  Quote: 'Teklif',
  Invoice: 'Fatura',
  Deal: 'Fırsat',
  Customer: 'Müşteri',
  Product: 'Ürün',
  Shipment: 'Sevkiyat',
  Finance: 'Finans',
  Task: 'Görev',
  Ticket: 'Destek',
}

const actionLabels: Record<string, string> = {
  CREATE: 'Oluşturuldu',
  UPDATE: 'Güncellendi',
  DELETE: 'Silindi',
  PAYMENT: 'Ödendi',
  DELIVERED: 'Teslim Edildi',
}

export default function ActivityList() {
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity', entity, action, userId],
    queryFn: () => fetchActivityLogs(entity, action, userId),
  })

  if (isLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aktiviteler</h1>
          <p className="mt-2 text-gray-600">Toplam {logs.length} kayıt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={entity || 'all'} onValueChange={(v) => setEntity(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="Quote">Teklif</SelectItem>
            <SelectItem value="Invoice">Fatura</SelectItem>
            <SelectItem value="Deal">Fırsat</SelectItem>
            <SelectItem value="Customer">Müşteri</SelectItem>
            <SelectItem value="Product">Ürün</SelectItem>
            <SelectItem value="Shipment">Sevkiyat</SelectItem>
            <SelectItem value="Finance">Finans</SelectItem>
            <SelectItem value="Task">Görev</SelectItem>
            <SelectItem value="Ticket">Destek</SelectItem>
          </SelectContent>
        </Select>
        <Select value={action || 'all'} onValueChange={(v) => setAction(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="CREATE">Oluşturuldu</SelectItem>
            <SelectItem value="UPDATE">Güncellendi</SelectItem>
            <SelectItem value="DELETE">Silindi</SelectItem>
            <SelectItem value="PAYMENT">Ödendi</SelectItem>
            <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Aktivite logu bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {entityLabels[log.entity] || log.entity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.description || '-'}</TableCell>
                  <TableCell>{log.User?.name || '-'}</TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

