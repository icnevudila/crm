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

    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    const { error } = await supabase.from('ActivityLog').insert([
      {
        entity: params.entity,
        action: params.action,
        description: params.description,
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
  await logAction({
    entity,
    action: 'STATUS_UPDATE',
    description: `${entity} durumu değiştirildi: ${oldStatus} → ${newStatus}`,
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
  await logAction({
    entity: 'Invoice',
    action: 'PAID',
    description: `Fatura ödendi: ${amount} TL`,
    meta: { entity: 'Invoice', action: 'paid', id: invoiceId, amount },
    userId,
    companyId,
  })
}






