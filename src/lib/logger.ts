/**
 * ActivityLog Otomasyonu
 * Tüm sistem işlemlerini loglar
 */

import { getSupabase } from './supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from './authOptions'

export interface LogActionParams {
  entity: string
  action: string
  description: string
  meta?: Record<string, any>
  userId?: string
  companyId?: string
}

/**
 * Entity isimlerini kullanıcı dostu Türkçe'ye çevir
 */
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
  Meeting: 'Görüşme',
  Company: 'Firma',
  User: 'Kullanıcı',
  Vendor: 'Tedarikçi',
  PurchaseShipment: 'Mal Kabul',
}

/**
 * Status değerlerini kullanıcı dostu Türkçe'ye çevir
 */
const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  PAID: 'Ödendi',
  UNPAID: 'Ödenmedi',
  DELIVERED: 'Teslim Edildi',
  SHIPPED: 'Sevk Edildi',
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  ACCEPTED: 'Kabul Edildi',
  SENT: 'Gönderildi',
}

/**
 * Status değerini kullanıcı dostu Türkçe'ye çevir
 */
export function formatStatus(status: string): string {
  return statusLabels[status] || status
}

/**
 * Entity ismini kullanıcı dostu Türkçe'ye çevir
 */
export function formatEntity(entity: string): string {
  return entityLabels[entity] || entity
}

/**
 * Mesajı kullanıcı dostu hale getir
 * - Teknik ID'leri kaldır
 * - Status değerlerini Türkçe'ye çevir
 * - Entity isimlerini Türkçe'ye çevir
 */
export function formatUserFriendlyMessage(description: string, meta?: Record<string, any>): string {
  let message = description

  // Status değerlerini Türkçe'ye çevir
  Object.keys(statusLabels).forEach((status) => {
    const regex = new RegExp(`\\b${status}\\b`, 'gi')
    message = message.replace(regex, statusLabels[status])
  })

  // Entity isimlerini Türkçe'ye çevir
  Object.keys(entityLabels).forEach((entity) => {
    const regex = new RegExp(`\\b${entity}\\b`, 'gi')
    message = message.replace(regex, entityLabels[entity])
  })

  // Aynı ibarenin back-to-back tekrarlarını tekilleştir
  message = message.replace(/(\b[^\s]+\b)\s+\1/gi, '$1')

  // Teknik ID'leri kaldır (UUID formatı: #xxxx-xxxx-xxxx)
  message = message.replace(/#[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '')
  message = message.replace(/#[a-f0-9]{8}/gi, '')

  // "→" yerine "→" kullan (daha okunabilir)
  message = message.replace(/→/g, '→')

  // Fazla boşlukları temizle
  message = message.replace(/\s+/g, ' ').trim()

  return message
}

/**
 * ActivityLog kaydı oluştur
 */
export async function logAction(params: LogActionParams) {
  try {
    const session = await getServerSession(authOptions)
    
    // Session yoksa (seed script gibi durumlar) userId ve companyId params'tan gelecek
    const userId = params.userId || session?.user?.id
    const companyId = params.companyId || session?.user?.companyId

    if (!userId || !companyId) {
      console.warn('ActivityLog: userId veya companyId eksik', params)
      return
    }

    const supabase = getSupabase()

    // Mesajı kullanıcı dostu hale getir
    const userFriendlyDescription = formatUserFriendlyMessage(params.description, params.meta)

    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    const { error } = await supabase.from('ActivityLog').insert([
      {
        entity: params.entity,
        action: params.action,
        description: userFriendlyDescription,
        meta: params.meta || {},
        userId,
        companyId,
      },
    ])

    if (error) {
      console.error('ActivityLog error:', error)
      // Log hatası kritik değil, işlemi durdurma
    }
  } catch (error) {
    console.error('ActivityLog exception:', error)
    // Log hatası kritik değil, işlemi durdurma
  }
}

/**
 * Özel log fonksiyonları (kolaylık için)
 */
export async function logStatusUpdate(
  entity: string,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string,
  companyId?: string
) {
  const entityLabel = formatEntity(entity)
  const oldStatusLabel = formatStatus(oldStatus)
  const newStatusLabel = formatStatus(newStatus)
  
  await logAction({
    entity,
    action: 'STATUS_UPDATE',
    description: `${entityLabel} durumu değiştirildi: ${oldStatusLabel} → ${newStatusLabel}`,
    meta: { entity, action: 'status_update', id: entityId, oldStatus, newStatus },
    userId,
    companyId,
  })
}

export async function logStockUpdate(
  productId: string,
  oldStock: number,
  newStock: number,
  userId?: string,
  companyId?: string
) {
  await logAction({
    entity: 'Product',
    action: 'STOCK_UPDATE',
    description: `Ürün stoğu güncellendi: ${oldStock} → ${newStock}`,
    meta: { entity: 'Product', action: 'stock_update', id: productId, oldStock, newStock },
    userId,
    companyId,
  })
}

export async function logPayment(
  invoiceId: string,
  amount: number,
  userId?: string,
  companyId?: string
) {
  // Para formatı: 1000 → 1.000 TL
  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount)

  await logAction({
    entity: 'Invoice',
    action: 'PAID',
    description: `Fatura ödendi: ${formattedAmount}`,
    meta: { entity: 'Invoice', action: 'paid', id: invoiceId, amount },
    userId,
    companyId,
  })
}






