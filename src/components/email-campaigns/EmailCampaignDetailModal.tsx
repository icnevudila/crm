'use client'

import { useState } from 'react'
import { Send, Mail, Eye, MousePointerClick, AlertCircle, Calendar, User, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DetailModal from '@/components/ui/DetailModal'
import { toast, confirm } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface EmailCampaignDetailModalProps {
  campaignId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function EmailCampaignDetailModal({
  campaignId,
  open,
  onClose,
  initialData,
}: EmailCampaignDetailModalProps) {
  const [sending, setSending] = useState(false)

  const { data: campaign, isLoading, error, mutate: mutateCampaign } = useData<any>(
    campaignId && open ? `/api/email-campaigns/${campaignId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
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
  }>(campaign?.status === 'SENT' && open ? `/api/email-campaigns/${campaignId}/logs` : null)

  const emailLogs = logsData?.data || []
  const displayCampaign = campaign || initialData

  const handleSend = async () => {
    const confirmed = await confirm('Bu kampanyayı göndermek istediğinize emin misiniz?')
    if (!confirmed) return

    setSending(true)
    const toastId = toast.loading('Gönderiliyor...')
    try {
      const res = await fetch(`/api/email-campaigns/${campaignId}/send`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Gönderme işlemi başarısız')
      }

      await mutateCampaign()
      await mutate('/api/email-campaigns')
      toast.dismiss(toastId)
      toast.success('Gönderildi', { description: 'Kampanya başarıyla gönderildi.' })
    } catch (error: any) {
      console.error('Send error:', error)
      toast.dismiss(toastId)
      toast.error('Gönderme başarısız', error?.message || 'Gönderme işlemi sırasında bir hata oluştu.')
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: 'Taslak', className: 'bg-gray-600 text-white border-gray-700' },
      SCHEDULED: { label: 'Zamanlandı', className: 'bg-blue-600 text-white border-blue-700' },
      SENDING: { label: 'Gönderiliyor', className: 'bg-yellow-600 text-white border-yellow-700' },
      SENT: { label: 'Gönderildi', className: 'bg-green-600 text-white border-green-700' },
      FAILED: { label: 'Başarısız', className: 'bg-red-600 text-white border-red-700' },
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.DRAFT
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getOpenRate = () => {
    if (!displayCampaign?.totalSent) return '0%'
    return ((displayCampaign.totalOpened / displayCampaign.totalSent) * 100).toFixed(1) + '%'
  }

  const getClickRate = () => {
    if (!displayCampaign?.totalOpened) return '0%'
    return ((displayCampaign.totalClicked / displayCampaign.totalOpened) * 100).toFixed(1) + '%'
  }

  const getBounceRate = () => {
    if (!displayCampaign?.totalSent) return '0%'
    return ((displayCampaign.totalBounced / displayCampaign.totalSent) * 100).toFixed(1) + '%'
  }

  if (!open || !campaignId) return null

  if (isLoading && !initialData && !displayCampaign) {
    return (
      <DetailModal open={open} onClose={onClose} title="Kampanya Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayCampaign) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Kampanya yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayCampaign) {
    return (
      <DetailModal open={open} onClose={onClose} title="Kampanya Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Kampanya bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={displayCampaign?.name || 'Kampanya Detayları'}
      description="Email Kampanya Detayları"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        {displayCampaign?.status === 'DRAFT' && (
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </div>
        )}

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
                  <p className="mt-1 font-semibold">{displayCampaign?.subject}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">İçerik:</label>
                  <div
                    className="mt-2 border rounded-md p-4 bg-white min-h-[300px] max-h-[400px] overflow-auto"
                    dangerouslySetInnerHTML={{ __html: displayCampaign?.body || '<p>İçerik yok</p>' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {displayCampaign?.status === 'SENT' && (
              <Card>
                <CardHeader>
                  <CardTitle>İstatistikler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Mail className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                      <div className="text-2xl font-bold">{displayCampaign?.totalSent?.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-600">Gönderilen</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Eye className="h-6 w-6 mx-auto text-green-600 mb-2" />
                      <div className="text-2xl font-bold">{displayCampaign?.totalOpened?.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-600">Açılan ({getOpenRate()})</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <MousePointerClick className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <div className="text-2xl font-bold">{displayCampaign?.totalClicked?.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-600">Tıklanan ({getClickRate()})</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-2" />
                      <div className="text-2xl font-bold">{displayCampaign?.totalBounced?.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-600">Bounce ({getBounceRate()})</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Logs */}
            {displayCampaign?.status === 'SENT' && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Gönderim Logları</CardTitle>
                  <CardDescription>Kampanyaya gönderilen tüm emaillerin detayları</CardDescription>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
                  ) : emailLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Henüz email log kaydı yok
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
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
                                  <Badge className="bg-green-600 text-white border-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Teslim Edildi
                                  </Badge>
                                )}
                                {log.status === 'FAILED' && (
                                  <Badge className="bg-red-600 text-white border-red-700">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Başarısız
                                  </Badge>
                                )}
                                {log.status === 'BOUNCED' && (
                                  <Badge className="bg-orange-600 text-white border-orange-700">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Bounce
                                  </Badge>
                                )}
                                {log.status === 'OPENED' && (
                                  <Badge className="bg-blue-600 text-white border-blue-700">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Açıldı
                                  </Badge>
                                )}
                                {log.status === 'CLICKED' && (
                                  <Badge className="bg-purple-600 text-white border-purple-700">
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
                  <div className="mt-1">{getStatusBadge(displayCampaign?.status)}</div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Oluşturan</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{displayCampaign?.createdBy?.name || '-'}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {displayCampaign?.createdAt ? format(new Date(displayCampaign.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr }) : '-'}
                    </span>
                  </div>
                </div>
                {displayCampaign?.scheduledAt && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Planlanan Tarih</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-sm">
                          {format(new Date(displayCampaign.scheduledAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {displayCampaign?.sentAt && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gönderilme Tarihi</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Send className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {format(new Date(displayCampaign.sentAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Target Segment */}
            {displayCampaign?.targetSegment && (
              <Card>
                <CardHeader>
                  <CardTitle>Hedef Kitle</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-sm">
                    {displayCampaign?.segment?.name || displayCampaign?.targetSegment}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DetailModal>
  )
}

