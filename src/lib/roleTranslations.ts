/**
 * Rol Çevirileri ve Yardımcı Fonksiyonlar
 * Multi-locale rol yönetimi
 */

import { useTranslations } from 'next-intl'

/**
 * Rol kodlarından Türkçe isimlere çeviri
 */
export const ROLE_TRANSLATIONS_TR: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  ADMIN: 'Yönetici',
  SALES: 'Satış Temsilcisi',
  USER: 'Kullanıcı',
  MANAGER: 'Müdür',
  ACCOUNTANT: 'Muhasebeci',
  SUPPORT: 'Destek',
  MARKETING: 'Pazarlama',
  PURCHASE: 'Satın Alma',
  WAREHOUSE: 'Depo',
}

/**
 * Rol kodlarından İngilizce isimlere çeviri
 */
export const ROLE_TRANSLATIONS_EN: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SALES: 'Sales Representative',
  USER: 'User',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
  SUPPORT: 'Support',
  MARKETING: 'Marketing',
  PURCHASE: 'Purchase',
  WAREHOUSE: 'Warehouse',
}

/**
 * Rol açıklamaları (Türkçe)
 */
export const ROLE_DESCRIPTIONS_TR: Record<string, string> = {
  SUPER_ADMIN: 'Sistem yöneticisi - tüm yetkilere sahip',
  ADMIN: 'Şirket yöneticisi - şirket içi tüm yetkilere sahip',
  SALES: 'Satış işlemleri yapabilir',
  USER: 'Temel kullanıcı - sınırlı yetkiler',
  MANAGER: 'Yönetici - ekibi yönetebilir',
  ACCOUNTANT: 'Muhasebe işlemleri yapabilir',
  SUPPORT: 'Müşteri desteği sağlayabilir',
  MARKETING: 'Pazarlama işlemleri yapabilir',
  PURCHASE: 'Satın alma işlemleri yapabilir',
  WAREHOUSE: 'Depo işlemleri yapabilir',
}

/**
 * Rol açıklamaları (İngilizce)
 */
export const ROLE_DESCRIPTIONS_EN: Record<string, string> = {
  SUPER_ADMIN: 'System administrator - has all permissions',
  ADMIN: 'Company administrator - has all company permissions',
  SALES: 'Can perform sales operations',
  USER: 'Basic user - limited permissions',
  MANAGER: 'Manager - can manage team',
  ACCOUNTANT: 'Can perform accounting operations',
  SUPPORT: 'Can provide customer support',
  MARKETING: 'Can perform marketing operations',
  PURCHASE: 'Can perform purchase operations',
  WAREHOUSE: 'Can perform warehouse operations',
}

/**
 * Rol renkleri (Badge için)
 */
export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  SALES: 'bg-blue-100 text-blue-800 border-blue-200',
  USER: 'bg-gray-100 text-gray-800 border-gray-200',
  MANAGER: 'bg-green-100 text-green-800 border-green-200',
  ACCOUNTANT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SUPPORT: 'bg-orange-100 text-orange-800 border-orange-200',
  MARKETING: 'bg-pink-100 text-pink-800 border-pink-200',
  PURCHASE: 'bg-teal-100 text-teal-800 border-teal-200',
  WAREHOUSE: 'bg-cyan-100 text-cyan-800 border-cyan-200',
}

/**
 * Rol ikonları (lucide-react icon names)
 */
export const ROLE_ICONS: Record<string, string> = {
  SUPER_ADMIN: 'Crown',
  ADMIN: 'Shield',
  SALES: 'Briefcase',
  USER: 'User',
  MANAGER: 'Users',
  ACCOUNTANT: 'Calculator',
  SUPPORT: 'Headphones',
  MARKETING: 'Megaphone',
  PURCHASE: 'ShoppingCart',
  WAREHOUSE: 'Package',
}

/**
 * Rol çevirisi (locale'e göre)
 */
export function getRoleLabel(roleCode: string, locale: string = 'tr'): string {
  if (locale === 'tr') {
    return ROLE_TRANSLATIONS_TR[roleCode] || roleCode
  }
  return ROLE_TRANSLATIONS_EN[roleCode] || roleCode
}

/**
 * Rol açıklaması (locale'e göre)
 */
export function getRoleDescription(roleCode: string, locale: string = 'tr'): string {
  if (locale === 'tr') {
    return ROLE_DESCRIPTIONS_TR[roleCode] || ''
  }
  return ROLE_DESCRIPTIONS_EN[roleCode] || ''
}

/**
 * Rol rengi
 */
export function getRoleColor(roleCode: string): string {
  return ROLE_COLORS[roleCode] || ROLE_COLORS.USER
}

/**
 * Hook: Rol çevirisi (next-intl ile)
 */
export function useRoleTranslation() {
  const t = useTranslations('roles')
  
  return {
    getRoleLabel: (roleCode: string) => {
      return t(roleCode) || ROLE_TRANSLATIONS_TR[roleCode] || roleCode
    },
    getRoleDescription: (roleCode: string) => {
      return t(`${roleCode}_description`) || ROLE_DESCRIPTIONS_TR[roleCode] || ''
    },
  }
}





