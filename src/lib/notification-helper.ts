import { getSupabaseWithServiceRole } from '@/lib/supabase'

/**
 * Bildirim oluşturma helper fonksiyonu
 * Tüm otomasyonlar için kullanılacak
 */
export async function createNotification({
  userId,
  companyId,
  title,
  message,
  type = 'info',
  relatedTo,
  relatedId,
  link,
  priority,
  expiresAt,
  actionType,
}: {
  userId: string
  companyId: string
  title: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'system'
  relatedTo?: string
  relatedId?: string
  link?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  expiresAt?: string | null
  actionType?: string | null
}) {
  try {
    const supabase = getSupabaseWithServiceRole()

    // Link yoksa otomatik oluştur
    let notificationLink = link
    if (!notificationLink && relatedTo && relatedId) {
      // Locale varsayılan 'tr' - kullanıcı locale'ini bilmiyoruz, API route'da
      const entityPathMap: Record<string, string> = {
        Quote: 'quotes',
        Invoice: 'invoices',
        Deal: 'deals',
        Customer: 'customers',
        Task: 'tasks',
        Ticket: 'tickets',
        Shipment: 'shipments',
        Product: 'products',
        Finance: 'finance',
        Meeting: 'meetings',
      }
      const path = entityPathMap[relatedTo]
      if (path) {
        notificationLink = `/tr/${path}/${relatedId}`
      }
    }

    // Tablo adını doğru yaz (boşluk olmadan)
    const { error } = await supabase
      .from('Notification')
      // @ts-ignore - Supabase type definitions eksik
      .insert([
        {
          userId,
          companyId,
          title,
          message: message || null,
          type,
          relatedTo: relatedTo || null,
          relatedId: relatedId || null,
          link: notificationLink || null,
          isRead: false,
          priority: priority || 'normal',
          expiresAt: expiresAt || null,
          actionType: actionType || null,
          actionDone: false,
        },
      ])

    if (error) {
      console.error('Notification creation error:', error)
      // Bildirim oluşturma hatası ana işlemi engellemez
    }
  } catch (error) {
    console.error('Notification helper error:', error)
    // Bildirim oluşturma hatası ana işlemi engellemez
  }
}

/**
 * Birden fazla kullanıcıya bildirim gönder (rol bazlı)
 */
export async function createNotificationForRole({
  companyId,
  role,
  title,
  message,
  type = 'info',
  relatedTo,
  relatedId,
  link,
  priority,
  expiresAt,
  actionType,
}: {
  companyId: string
  role: string | string[]
  title: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'system'
  relatedTo?: string
  relatedId?: string
  link?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  expiresAt?: string | null
  actionType?: string | null
}) {
  try {
    const supabase = getSupabaseWithServiceRole()

    // Belirtilen rol(ler)deki kullanıcıları bul
    const roles = Array.isArray(role) ? role : [role]
    
    // SuperAdmin için özel kontrol: SuperAdmin tüm şirketlerin bildirimlerini alabilir
    const isSuperAdminInRoles = roles.includes('SUPER_ADMIN')
    const otherRoles = roles.filter((r) => r !== 'SUPER_ADMIN')
    
    let users: any[] = []
    
    // SuperAdmin varsa: SuperAdmin'leri companyId kontrolü olmadan ekle
    if (isSuperAdminInRoles) {
      const { data: superAdminUsers, error: superAdminError } = await supabase
        .from('User')
        .select('id')
        .eq('role', 'SUPER_ADMIN')
        .eq('status', 'ACTIVE')
      
      if (!superAdminError && superAdminUsers) {
        users = [...users, ...superAdminUsers]
      }
    }
    
    // Diğer rolleri bul (companyId kontrolü ile)
    if (otherRoles.length > 0) {
      const { data: otherUsers, error: otherUsersError } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', companyId)
        .in('role', otherRoles)
        .eq('status', 'ACTIVE')
      
      if (!otherUsersError && otherUsers) {
        users = [...users, ...otherUsers]
      }
    }
    
    // Duplicate'leri kaldır (aynı kullanıcı hem SuperAdmin hem diğer rol olabilir)
    users = users.filter((user, index, self) => 
      index === self.findIndex((u) => u.id === user.id)
    )

    if (users.length === 0) {
      return
    }

    // Link yoksa otomatik oluştur
    let notificationLink = link
    if (!notificationLink && relatedTo && relatedId) {
      const entityPathMap: Record<string, string> = {
        Quote: 'quotes',
        Invoice: 'invoices',
        Deal: 'deals',
        Customer: 'customers',
        Task: 'tasks',
        Ticket: 'tickets',
        Shipment: 'shipments',
        Product: 'products',
        Finance: 'finance',
        Meeting: 'meetings',
      }
      const path = entityPathMap[relatedTo]
      if (path) {
        notificationLink = `/tr/${path}/${relatedId}`
      }
    }

    // Her kullanıcı için bildirim oluştur
    const notifications = users.map((user: any) => ({
      userId: user.id,
      companyId,
      title,
      message: message || null,
      type,
      relatedTo: relatedTo || null,
      relatedId: relatedId || null,
      link: notificationLink || null,
      isRead: false,
      priority: priority || 'normal',
      expiresAt: expiresAt || null,
      actionType: actionType || null,
      actionDone: false,
    }))

    // Tablo adını doğru yaz (boşluk olmadan)
    const { error } = await supabase
      .from('Notification')
      // @ts-ignore - Supabase type definitions eksik
      .insert(notifications)

    if (error) {
      console.error('Notification creation error:', error)
    }
  } catch (error) {
    console.error('Notification helper error:', error)
  }
}







