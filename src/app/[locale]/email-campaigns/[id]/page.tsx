'use client'

import { useParams } from 'next/navigation'
import { ArrowLeft, Users, Send, Clock, TrendingUp, Mail } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/hooks/useData'
import { format } from 'date-fns'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  status: string
  segmentId?: string
  segment?: {
    name: string
  }
  scheduledFor?: string
  sentCount: number
  openCount: number
  clickCount: number
  createdAt: string
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SCHEDULED: 'Zamanlandı',
  SENDING: 'Gönderiliyor',
  SENT: 'Gönderildi',
  FAILED: 'Başarısız',
}

export default function EmailCampaignDetailPage() {
  const params = useParams()
  const locale = useLocale()
  const campaignId = params.id as string

  const { data: campaign, isLoading } = useData<EmailCampaign>(`/api/email-campaigns/${campaignId}`)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!campaign) {
    return <div>Kampanya bulunamadı</div>
  }

  const openRate = campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : '0'
  const clickRate = campaign.sentCount > 0 ? ((campaign.clickCount / campaign.sentCount) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/email-campaigns`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-gray-600">
              #{campaignId.substring(0, 8)} • {format(new Date(campaign.createdAt), 'dd.MM.yyyy')}
            </p>
          </div>
        </div>
        <Badge className={
          campaign.status === 'SENT' ? 'bg-green-100 text-green-800 border-0' :
          campaign.status === 'FAILED' ? 'bg-red-100 text-red-800 border-0' :
          campaign.status === 'SENDING' ? 'bg-blue-100 text-blue-800 border-0' :
          campaign.status === 'SCHEDULED' ? 'bg-purple-100 text-purple-800 border-0' :
          'bg-gray-100 text-gray-700 border-0'
        }>
          {statusLabels[campaign.status] || campaign.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Send className="h-4 w-4" />
            <span className="text-sm">Gönderilen</span>
          </div>
          <p className="text-2xl font-bold">{campaign.sentCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Açılan</span>
          </div>
          <p className="text-2xl font-bold">{campaign.openCount}</p>
          <p className="text-sm text-gray-500">{openRate}% açılma oranı</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Tıklanan</span>
          </div>
          <p className="text-2xl font-bold">{campaign.clickCount}</p>
          <p className="text-sm text-gray-500">{clickRate}% tıklama oranı</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Segment</span>
          </div>
          <p className="text-lg font-medium">{campaign.segment?.name || 'Tüm Liste'}</p>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Kampanya Bilgileri</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Konu</p>
              <p className="text-gray-900">{campaign.subject}</p>
            </div>
            {campaign.scheduledFor && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Zamanlanan Tarih</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(campaign.scheduledFor), 'dd.MM.yyyy HH:mm')}</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
              <p className="text-gray-900">{format(new Date(campaign.createdAt), 'dd.MM.yyyy HH:mm')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Performans Özeti</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gönderim Başarısı:</span>
              <Badge className="bg-green-100 text-green-800 border-0">
                {campaign.status === 'SENT' ? 'Başarılı' : campaign.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Açılma Oranı:</span>
              <span className="font-semibold">{openRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tıklama Oranı:</span>
              <span className="font-semibold">{clickRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Engagement:</span>
              <span className="font-semibold">
                {campaign.sentCount > 0 ? (((campaign.openCount + campaign.clickCount) / campaign.sentCount) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Preview */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">İçerik Önizleme</h3>
        <div className="prose max-w-none">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Konu:</p>
            <p className="font-semibold mb-4">{campaign.subject}</p>
            <hr className="my-4" />
            <div
              dangerouslySetInnerHTML={{ __html: campaign.content }}
              className="text-sm text-gray-800"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

