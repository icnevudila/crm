/**
 * CRM Renk Sistemi - Tüm modüllerde tutarlı renkler
 * CRM iş akışına uygun, profesyonel ve okunabilir renk paleti
 */

export interface StatusColor {
  bg: string
  text: string
  border: string
  badge: string
}

// Status Renkleri - CRM İş Akışına Uygun (Profesyonel ve Canlı Renkler)
export const CRM_STATUS_COLORS: Record<string, StatusColor> = {
  // Genel Durumlar
  DRAFT: {
    bg: 'bg-gray-100 border-2 border-gray-400',
    text: 'text-gray-800',
    border: 'border-gray-400',
    badge: 'bg-gray-600 text-white',
  },
  ACTIVE: {
    bg: 'bg-blue-100 border-2 border-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
  },
  INACTIVE: {
    bg: 'bg-gray-200 border-2 border-gray-500',
    text: 'text-gray-700',
    border: 'border-gray-500',
    badge: 'bg-gray-500 text-white',
  },
  
  // Fırsat Aşamaları
  LEAD: {
    bg: 'bg-blue-100 border-2 border-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
  },
  CONTACTED: {
    bg: 'bg-indigo-100 border-2 border-indigo-500',
    text: 'text-indigo-900',
    border: 'border-indigo-500',
    badge: 'bg-indigo-600 text-white',
  },
  CONTACT: {
    bg: 'bg-blue-100 border-2 border-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
  },
  DEMO: {
    bg: 'bg-cyan-100 border-2 border-cyan-500',
    text: 'text-cyan-900',
    border: 'border-cyan-500',
    badge: 'bg-cyan-600 text-white',
  },
  PROPOSAL: {
    bg: 'bg-yellow-100 border-2 border-yellow-500',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
    badge: 'bg-yellow-600 text-white',
  },
  NEGOTIATION: {
    bg: 'bg-orange-100 border-2 border-orange-500',
    text: 'text-orange-900',
    border: 'border-orange-500',
    badge: 'bg-orange-600 text-white',
  },
  WON: {
    bg: 'bg-green-100 border-2 border-green-600',
    text: 'text-green-900',
    border: 'border-green-600',
    badge: 'bg-green-700 text-white',
  },
  LOST: {
    bg: 'bg-red-100 border-2 border-red-600',
    text: 'text-red-900',
    border: 'border-red-600',
    badge: 'bg-red-700 text-white',
  },
  
  // Teklif Durumları
  SENT: {
    bg: 'bg-blue-100 border-2 border-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
  },
  ACCEPTED: {
    bg: 'bg-green-100 border-2 border-green-600',
    text: 'text-green-900',
    border: 'border-green-600',
    badge: 'bg-green-700 text-white',
  },
  REJECTED: {
    bg: 'bg-red-100 border-2 border-red-600',
    text: 'text-red-900',
    border: 'border-red-600',
    badge: 'bg-red-700 text-white',
  },
  DECLINED: {
    bg: 'bg-red-100 border-2 border-red-600',
    text: 'text-red-900',
    border: 'border-red-600',
    badge: 'bg-red-700 text-white',
  },
  WAITING: {
    bg: 'bg-yellow-100 border-2 border-yellow-500',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
    badge: 'bg-yellow-600 text-white',
  },
  EXPIRED: {
    bg: 'bg-orange-100 border-2 border-orange-500',
    text: 'text-orange-900',
    border: 'border-orange-500',
    badge: 'bg-orange-600 text-white',
  },
  
  // Fatura Durumları
  PAID: {
    bg: 'bg-green-100 border-2 border-green-600',
    text: 'text-green-900',
    border: 'border-green-600',
    badge: 'bg-green-700 text-white',
  },
  UNPAID: {
    bg: 'bg-red-100 border-2 border-red-600',
    text: 'text-red-900',
    border: 'border-red-600',
    badge: 'bg-red-700 text-white',
  },
  PARTIAL: {
    bg: 'bg-yellow-100 border-2 border-yellow-500',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
    badge: 'bg-yellow-600 text-white',
  },
  
  // Görev Durumları
  TODO: {
    bg: 'bg-gray-100 border-2 border-gray-400',
    text: 'text-gray-800',
    border: 'border-gray-400',
    badge: 'bg-gray-600 text-white',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-100 border-2 border-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
  },
  DONE: {
    bg: 'bg-green-100 border-2 border-green-600',
    text: 'text-green-900',
    border: 'border-green-600',
    badge: 'bg-green-700 text-white',
  },
  CANCELLED: {
    bg: 'bg-red-100 border-2 border-red-600',
    text: 'text-red-900',
    border: 'border-red-600',
    badge: 'bg-red-700 text-white',
  },
  
  // Öncelik Renkleri
  LOW: {
    bg: 'bg-gray-100 border-2 border-gray-400',
    text: 'text-gray-800',
    border: 'border-gray-400',
    badge: 'bg-gray-600 text-white',
  },
  MEDIUM: {
    bg: 'bg-blue-100 border-2 border-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
  },
  HIGH: {
    bg: 'bg-yellow-100 border-2 border-yellow-500',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
    badge: 'bg-yellow-600 text-white',
  },
  CRITICAL: {
    bg: 'bg-red-100 border-2 border-red-600',
    text: 'text-red-900',
    border: 'border-red-600',
    badge: 'bg-red-700 text-white',
  },
}

/**
 * Status'a göre renk al
 */
export function getStatusColor(
  status: string,
  type: 'bg' | 'text' | 'border' | 'badge' = 'badge'
): string {
  const color = CRM_STATUS_COLORS[status as keyof typeof CRM_STATUS_COLORS]
  return color?.[type] || CRM_STATUS_COLORS.DRAFT[type]
}

/**
 * Status badge className oluştur
 */
export function getStatusBadgeClass(status: string): string {
  return getStatusColor(status, 'badge')
}

/**
 * Status card className oluştur (Kanban için)
 */
export function getStatusCardClass(status: string): string {
  const colors = CRM_STATUS_COLORS[status as keyof typeof CRM_STATUS_COLORS] || CRM_STATUS_COLORS.DRAFT
  return `${colors.bg} ${colors.border} border`
}

/**
 * Status header className oluştur (Kanban column header için)
 */
export function getStatusHeaderClass(status: string): string {
  const colors = CRM_STATUS_COLORS[status as keyof typeof CRM_STATUS_COLORS] || CRM_STATUS_COLORS.DRAFT
  return `${colors.bg} ${colors.border} border-b-2`
}

