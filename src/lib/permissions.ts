import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-supabase'
import { getSupabase } from '@/lib/supabase'

export const PERMISSION_DENIED_MESSAGE =
  'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor. Lütfen kurum yöneticinizle veya bilgi işlem ekibiyle iletişime geçin.'

export function buildPermissionDeniedResponse(detail?: string) {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: PERMISSION_DENIED_MESSAGE,
      ...(detail ? { detail } : {}),
    },
    { status: 403 }
  )
}

export interface PermissionCheck {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

/**
 * Kullanıcının belirli bir modül için yetkilerini kontrol et
 * Yeni yapı: Önce kurum_modul_izinleri, sonra rol_izinleri kontrol edilir
 * @param module - Modül kodu (dashboard, companies, vendors, customers, quotes, products, finance, reports, shipments, stock)
 * @param userId - Kullanıcı ID (opsiyonel, session'dan alınır)
 * @returns PermissionCheck objesi
 */
export async function checkUserPermission(
  module: string,
  userId?: string
): Promise<PermissionCheck> {
  const session = await getServerSession()
  
  if (!session?.user?.companyId) {
    return {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    }
  }

  // SUPER_ADMIN her zaman tüm yetkilere sahip
  if (session.user.role === 'SUPER_ADMIN') {
    return {
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    }
  }

  const supabase = getSupabase()
  const companyId = session.user.companyId
  const targetUserId = userId || session.user.id

  // 1. ÖNCE kullanıcının rolünü kontrol et - Admin ve SuperAdmin bypass için
  // Kullanıcının rolünü al
  const { data: userData } = await supabase
    .from('User')
    .select('roleId, role')
    .eq('id', targetUserId)
    .single()

  if (!userData) {
    return {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    }
  }

  // ADMIN rolü her zaman tüm yetkilere sahip (kendi şirketi için) - CompanyModulePermission bypass
  if (userData.role === 'ADMIN') {
    // DEBUG: Admin bypass logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Permission Check] Admin bypass - tüm yetkiler verildi', { module, userId: targetUserId, role: userData.role })
    }
    return {
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    }
  }

  // 2. Sonra kurum_modul_izinleri kontrol et (CompanyModulePermission)
  // Modül kodundan Module ID'yi bul
  const { data: moduleData } = await supabase
    .from('Module')
    .select('id')
    .eq('code', module)
    .eq('isActive', true)
    .single()

  if (!moduleData) {
    // Modül bulunamadı veya aktif değil
    return {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    }
  }

  const moduleId = moduleData.id

  // Kurum modül izni var mı?
  const { data: companyModulePermission } = await supabase
    .from('CompanyModulePermission')
    .select('enabled')
    .eq('companyId', companyId)
    .eq('moduleId', moduleId)
    .single()

  // Kurum modül izni yoksa veya kapalıysa, erişim yok (Admin hariç - yukarıda kontrol edildi)
  if (!companyModulePermission || !companyModulePermission.enabled) {
    return {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    }
  }

  // 3. Sonra rol_izinleri kontrol et (RolePermission)

  // 3. Önce UserPermission kontrol et (kullanıcı özel yetkileri - en yüksek öncelik)
  const { data: userPermission } = await supabase
    .from('UserPermission')
    .select('"canCreate", "canRead", "canUpdate", "canDelete"')
    .eq('userId', targetUserId)
    .eq('companyId', companyId)
    .eq('module', module)
    .single()

  if (userPermission) {
    // UserPermission varsa, bu yetkileri kullan (en yüksek öncelik)
    return {
      canRead: userPermission.canRead || false,
      canCreate: userPermission.canCreate || false,
      canUpdate: userPermission.canUpdate || false,
      canDelete: userPermission.canDelete || false,
    }
  }

  // 4. UserPermission yoksa, RolePermission'dan kontrol et
  if (userData.roleId) {
    const { data: rolePermission } = await supabase
      .from('RolePermission')
      .select('"canCreate", "canRead", "canUpdate", "canDelete"')
      .eq('roleId', userData.roleId)
      .eq('moduleId', moduleId)
      .single()

    if (rolePermission) {
      return {
        canRead: rolePermission.canRead || false,
        canCreate: rolePermission.canCreate || false,
        canUpdate: rolePermission.canUpdate || false,
        canDelete: rolePermission.canDelete || false,
      }
    }
  }

  // Varsayılan: Yetki yok
  return {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  }
}

/**
 * Kullanıcının belirli bir işlem için yetkisi var mı kontrol et
 * @param module - Modül adı
 * @param action - İşlem tipi ('read' | 'create' | 'update' | 'delete')
 * @param userId - Kullanıcı ID (opsiyonel)
 * @returns boolean
 */
export async function hasPermission(
  module: string,
  action: 'read' | 'create' | 'update' | 'delete',
  userId?: string
): Promise<boolean> {
  const permissions = await checkUserPermission(module, userId)
  
  // DEBUG: Permission kontrolü logla
  if (process.env.NODE_ENV === 'development') {
    console.log('[Permission Check]', {
      module,
      action,
      userId,
      permissions,
      result: {
        read: permissions.canRead,
        create: permissions.canCreate,
        update: permissions.canUpdate,
        delete: permissions.canDelete,
      }[action],
    })
  }
  
  switch (action) {
    case 'read':
      return permissions.canRead
    case 'create':
      return permissions.canCreate
    case 'update':
      return permissions.canUpdate
    case 'delete':
      return permissions.canDelete
    default:
      return false
  }
}

