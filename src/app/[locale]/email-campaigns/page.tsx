'use client'

import { useState } from 'react'
import { Plus, Search, Send, Eye, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { useData } from '@/hooks/useData'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
  totalSent: number
  totalOpened: number
  totalClicked: number
  targetSegment: string | null
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  createdBy: { name: string } | null
}

export default function EmailCampaignsPage() {
  const [search, setSearch] = useState('')

  const apiUrl = `/api/email-campaigns${search ? `?search=${search}` : ''}`
  const { data: campaigns = [], isLoading } = useData<Campaign[]>(apiUrl)

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: 'Taslak', className: 'bg-gray-200 text-gray-800 border-0' },
      SCHEDULED: { label: 'Zamanlandı', className: 'bg-blue-100 text-blue-800 border-0' },
      SENDING: { label: 'Gönderiliyor', className: 'bg-yellow-100 text-yellow-800 border-0' },
      SENT: { label: 'Gönderildi', className: 'bg-green-100 text-green-800 border-0' },
      FAILED: { label: 'Başarısız', className: 'bg-red-100 text-red-800 border-0' },
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.DRAFT
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getOpenRate = (campaign: Campaign) => {
    if (!campaign.totalSent) return '0%'
    return ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1) + '%'
  }

  const getClickRate = (campaign: Campaign) => {
    if (!campaign.totalOpened) return '0%'
    return ((campaign.totalClicked / campaign.totalOpened) * 100).toFixed(1) + '%'
  }

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Kampanyaları</h1>
          <p className="text-gray-500 mt-1">Toplu email gönderimi ve kampanya yönetimi</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4" />
            Toplam Kampanya
          </div>
          <div className="text-2xl font-bold mt-1">{campaigns.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Gönderilen</div>
          <div className="text-2xl font-bold mt-1">
            {campaigns.reduce((sum, c) => sum + (c.totalSent || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Açılan</div>
          <div className="text-2xl font-bold mt-1">
            {campaigns.reduce((sum, c) => sum + (c.totalOpened || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Tıklanan</div>
          <div className="text-2xl font-bold mt-1">
            {campaigns.reduce((sum, c) => sum + (c.totalClicked || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Kampanya ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kampanya Adı</TableHead>
              <TableHead>Konu</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Gönderilen</TableHead>
              <TableHead>Açılma</TableHead>
              <TableHead>Tıklama</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  Henüz kampanya oluşturulmamış
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      {campaign.targetSegment && (
                        <div className="text-xs text-gray-500">Hedef: {campaign.targetSegment}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>{campaign.totalSent?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span>{campaign.totalOpened || 0}</span>
                      <span className="text-xs text-gray-500">({getOpenRate(campaign)})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-gray-400" />
                      <span>{campaign.totalClicked || 0}</span>
                      <span className="text-xs text-gray-500">({getClickRate(campaign)})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {campaign.sentAt
                      ? format(new Date(campaign.sentAt), 'dd MMM yyyy', { locale: tr })
                      : campaign.scheduledAt
                      ? `Planlandı: ${format(new Date(campaign.scheduledAt), 'dd MMM', { locale: tr })}`
                      : format(new Date(campaign.createdAt), 'dd MMM yyyy', { locale: tr })}
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

