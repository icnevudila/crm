/**
 * ActivityLog Utility Fonksiyonları
 * Client Component'lerde kullanılabilir (next/headers bağımlılığı yok)
 */

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

















