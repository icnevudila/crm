'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  Edit,
  Trash2,
  Copy,
  FileText,
  Receipt,
  Truck,
  CheckSquare,
  Calendar,
  Mail,
  MessageSquare,
  MessageCircle,
  Download,
  Share2,
  MoreVertical,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { getStatusBadgeClass } from '@/lib/crm-colors'

interface ContextualActionsBarProps {
  entityType: 'quote' | 'deal' | 'invoice' | 'customer' | 'product' | 'task' | 'shipment' | 'meeting' | 'contract'
  entityId: string
  currentStatus?: string
  availableStatuses?: Array<{ value: string; label: string }>
  onStatusChange?: (newStatus: string) => Promise<void>
  onEdit?: () => void
  onDelete?: () => Promise<void>
  onDuplicate?: () => Promise<void>
  onCreateRelated?: (type: string) => void
  onSendEmail?: () => void
  onSendSms?: () => void
  onSendWhatsApp?: () => void
  onAddToCalendar?: () => void
  onDownloadPDF?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

/**
 * ContextualActionsBar - Detay sayfalarında üstte sabit, hızlı işlem butonları
 * CRM işleyişine uygun - kullanıcı tek sayfadan her şeyi halledebilir
 */
export default function ContextualActionsBar({
  entityType,
  entityId,
  currentStatus,
  availableStatuses = [],
  onStatusChange,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateRelated,
  onSendEmail,
  onSendSms,
  onSendWhatsApp,
  onAddToCalendar,
  onDownloadPDF,
  canEdit = true,
  canDelete = true,
}: ContextualActionsBarProps) {
  const router = useRouter()
  const locale = useLocale()
  const [statusChanging, setStatusChanging] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return
    
    setStatusChanging(true)
    try {
      await onStatusChange(newStatus)
      toast.success('Durum güncellendi')
    } catch (error: any) {
      toast.error('Durum güncellenemedi', error?.message)
    } finally {
      setStatusChanging(false)
    }
  }

  const handleCreateRelated = (type: string) => {
    if (onCreateRelated) {
      onCreateRelated(type)
    } else {
      // Default navigation
      const baseUrl = `/${locale}/${type}s/new`
      const params = new URLSearchParams()
      params.append(`${entityType}Id`, entityId)
      router.push(`${baseUrl}?${params.toString()}`)
    }
  }

  // Entity type'a göre ilişkili kayıtlar
  const getRelatedActions = () => {
    switch (entityType) {
      case 'deal':
        return [
          { type: 'quote', label: 'Teklif Oluştur', icon: FileText },
          { type: 'meeting', label: 'Toplantı Oluştur', icon: Calendar },
          { type: 'task', label: 'Görev Oluştur', icon: CheckSquare },
        ]
      case 'quote':
        return [
          { type: 'invoice', label: 'Fatura Oluştur', icon: Receipt },
          { type: 'contract', label: 'Sözleşme Oluştur', icon: FileText },
          { type: 'meeting', label: 'Toplantı Oluştur', icon: Calendar },
          { type: 'task', label: 'Görev Oluştur', icon: CheckSquare },
        ]
      case 'invoice':
        return [
          { type: 'shipment', label: 'Sevkiyat Oluştur', icon: Truck },
          { type: 'task', label: 'Görev Oluştur', icon: CheckSquare },
        ]
      case 'customer':
        return [
          { type: 'deal', label: 'Fırsat Oluştur', icon: FileText },
          { type: 'quote', label: 'Teklif Oluştur', icon: FileText },
          { type: 'meeting', label: 'Toplantı Oluştur', icon: Calendar },
          { type: 'task', label: 'Görev Oluştur', icon: CheckSquare },
          { type: 'ticket', label: 'Destek Talebi Oluştur', icon: MessageSquare },
        ]
      case 'contract':
        return [
          { type: 'invoice', label: 'Fatura Oluştur', icon: Receipt },
          { type: 'task', label: 'Görev Oluştur', icon: CheckSquare },
        ]
      default:
        return []
    }
  }

  const relatedActions = getRelatedActions()

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Sol Taraf - Status Değiştirme */}
          <div className="flex items-center gap-4 flex-1">
            {availableStatuses.length > 0 && onStatusChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Durum:</span>
                <Select
                  value={currentStatus || ''}
                  onValueChange={handleStatusChange}
                  disabled={statusChanging}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <span className={getStatusBadgeClass(status.value)}>
                            {status.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Sağ Taraf - Hızlı İşlemler */}
          <div className="flex items-center gap-2">
            {/* Düzenle */}
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Düzenle
              </Button>
            )}

            {/* Email Gönder */}
            {onSendEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendEmail}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            )}

            {/* SMS Gönder */}
            {onSendSms && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendSms}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                SMS
              </Button>
            )}

            {/* WhatsApp Gönder */}
            {onSendWhatsApp && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendWhatsApp}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            )}

            {/* Takvime Ekle */}
            {onAddToCalendar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddToCalendar}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Takvim
              </Button>
            )}

            {/* PDF İndir */}
            {onDownloadPDF && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadPDF}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            )}

            {/* İlişkili Kayıt Oluştur */}
            {relatedActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Oluştur
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100]" sideOffset={5}>
                  {relatedActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <DropdownMenuItem
                        key={action.type}
                        onClick={(e) => {
                          e.preventDefault()
                          handleCreateRelated(action.type)
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Daha Fazla */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[100]" sideOffset={5}>
                {onDuplicate && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      onDuplicate()
                    }} 
                    className="gap-2 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    Kopyala
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Share2 className="h-4 w-4" />
                  Paylaş
                </DropdownMenuItem>
                {canDelete && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        onDelete()
                      }}
                      className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

