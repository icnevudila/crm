'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Mail, Eye, MousePointerClick, AlertCircle, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { useData } from '@/hooks/useData'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast, confirm } from '@/lib/toast'
import Link from 'next/link'

interface EmailCampaignDetail {
  id: string
  name: string
  subject: string
  body: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
  targetSegment: string | null
  scheduledAt: string | null
  sentAt: string | null
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  createdAt: string
  createdBy?: { name: string; email: string }
  segment?: { name: string }
}

export default function EmailCampaignDetailPage() {
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const { data: campaign, isLoading, error, mutate } = useData<EmailCampaignDetail>(
    `/api/email-campaigns/${campaignId}`
  )

  const { data: logsData, isLoading: logsLoading } = useData<{
    data: Array<{
      id: string
      recipientEmail: string
      recipientName: string | null
      status: 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'OPENED' | 'CLICKED'
      sentAt: string
      openedAt: string | null
      clickedAt: string | null
    }>
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>(campaign?.status === 'SENT' ? `/api/email-campaigns/${campaignId}/logs` : null)

  const emailLogs = logsData?.data || []

  const handleSend = async () => {
    const confirmed = await confirm('Bu kampanyayı göndermek istediğinize emin misiniz?')
    if (!confirmed) return

    const toastId = toast.loading('Gönderiliyor...')
    try {
      const res = await fetch(`/api/email-campaigns/${campaignId}/send`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Gönderme işlemi başarısız')
      }

      await mutate()
      toast.dismiss(toastId)
      toast.success('Gönderildi', 'Kampanya başarıyla gönderildi.')
    } catch (error: any) {
      console.error('Send error:', error)
      toast.dismiss(toastId)
      toast.error('Gönderme başarısız', error?.message || 'Gönderme işlemi sırasında bir hata oluştu.')
    }
  }

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

  const getOpenRate = () => {
    if (!campaign?.totalSent) return '0%'
    return ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1) + '%'
  }

  const getClickRate = () => {
    if (!campaign?.totalOpened) return '0%'
    return ((campaign.totalClicked / campaign.totalOpened) * 100).toFixed(1) + '%'
  }

  const getBounceRate = () => {
    if (!campaign?.totalSent) return '0%'
    return ((campaign.totalBounced / campaign.totalSent) * 100).toFixed(1) + '%'
  }

  if (isLoading) return <SkeletonList />

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <Link href={`/${locale}/email-campaigns`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Hata</AlertTitle>
          <AlertDescription className="text-red-700">
            Kampanya yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
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
          <Link href={`/${locale}/email-campaigns`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-gray-500 mt-1">Email Kampanya Detayları</p>
          </div>
        </div>
        {campaign.status === 'DRAFT' && (
          <Button
            onClick={handleSend}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Gönder
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Email Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Konu:</label>
                <p className="mt-1 font-semibold">{campaign.subject}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">İçerik:</label>
                <div
                  className="mt-2 border rounded-md p-4 bg-white min-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: campaign.body || '<p>İçerik yok</p>' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {campaign.status === 'SENT' && (
            <Card>
              <CardHeader>
                <CardTitle>İstatistikler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Mail className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold">{campaign.totalSent.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Gönderilen</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Eye className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold">{campaign.totalOpened.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Açılan ({getOpenRate()})</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <MousePointerClick className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold">{campaign.totalClicked.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Tıklanan ({getClickRate()})</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-2" />
                    <div className="text-2xl font-bold">{campaign.totalBounced.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Bounce ({getBounceRate()})</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Logs */}
          {campaign.status === 'SENT' && (
            <Card>
              <CardHeader>
                <CardTitle>Email Gönderim Logları</CardTitle>
                <CardDescription>Kampanyaya gönderilen tüm emaillerin detayları</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <SkeletonList />
                ) : emailLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Henüz email log kaydı yok
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alıcı</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Gönderilme</TableHead>
                          <TableHead>Açılma</TableHead>
                          <TableHead>Tıklama</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.recipientName || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {log.recipientEmail}
                            </TableCell>
                            <TableCell>
                              {log.status === 'DELIVERED' && (
                                <Badge className="bg-green-100 text-green-800 border-0">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Teslim Edildi
                                </Badge>
                              )}
                              {log.status === 'FAILED' && (
                                <Badge className="bg-red-100 text-red-800 border-0">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Başarısız
                                </Badge>
                              )}
                              {log.status === 'BOUNCED' && (
                                <Badge className="bg-orange-100 text-orange-800 border-0">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Bounce
                                </Badge>
                              )}
                              {log.status === 'OPENED' && (
                                <Badge className="bg-blue-100 text-blue-800 border-0">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Açıldı
                                </Badge>
                              )}
                              {log.status === 'CLICKED' && (
                                <Badge className="bg-purple-100 text-purple-800 border-0">
                                  <MousePointerClick className="h-3 w-3 mr-1" />
                                  Tıklandı
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {log.sentAt
                                ? format(new Date(log.sentAt), 'dd MMM yyyy, HH:mm', { locale: tr })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {log.openedAt
                                ? format(new Date(log.openedAt), 'dd MMM yyyy, HH:mm', { locale: tr })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {log.clickedAt
                                ? format(new Date(log.clickedAt), 'dd MMM yyyy, HH:mm', { locale: tr })
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
                <label className="text-sm font-medium text-gray-500">Durum</label>
                <div className="mt-1">{getStatusBadge(campaign.status)}</div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Oluşturan</label>
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{campaign.createdBy?.name || '-'}</span>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(new Date(campaign.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </span>
                </div>
              </div>
              {campaign.scheduledAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Planlanan Tarih</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">
                        {format(new Date(campaign.scheduledAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </>
              )}
              {campaign.sentAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gönderilme Tarihi</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Send className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {format(new Date(campaign.sentAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Target Segment */}
          {campaign.targetSegment && (
            <Card>
              <CardHeader>
                <CardTitle>Hedef Kitle</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-sm">
                  {campaign.segment?.name || campaign.targetSegment}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
