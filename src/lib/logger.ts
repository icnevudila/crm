/**
 * ActivityLog Otomasyonu
 * Tüm sistem işlemlerini loglar
 * SERVER-ONLY: next/headers kullanır, Client Component'lerde kullanılamaz
 */

import { getSupabase } from './supabase'
import { getServerSession } from './auth-supabase'
import { formatUserFriendlyMessage, formatEntity, formatStatus } from './logger-utils'

export interface LogActionParams {
  entity: string
  action: string
  description: string
  meta?: Record<string, any>
  userId?: string
  companyId?: string
}

// Re-export utility functions for backward compatibility
export { formatUserFriendlyMessage, formatEntity, formatStatus }

/**
 * ActivityLog kaydı oluştur
 */
export async function logAction(params: LogActionParams) {
  try {
    const session = await getServerSession()
    
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






