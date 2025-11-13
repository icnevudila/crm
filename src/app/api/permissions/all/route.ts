import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'

// PERFORMANCE FIX: Cache ekle - permissions sık değişmez
export const revalidate = 60

export async function GET(request: Request) {
  try {
    // PERFORMANCE FIX: getSafeSession kullan (cache var) - getServerSession yerine
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    // Session yoksa veya companyId yoksa boş obje döndür (401 yerine)
    // Sidebar'da session yüklenene kadar bekleyecek
    if (!session?.user?.companyId) {
      return NextResponse.json({}, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      })
    }

    const supabase = getSupabase()
    const companyId = session.user.companyId
    const userId = session.user.id

    // SUPER_ADMIN her zaman tüm yetkilere sahip
    if (session.user.role === 'SUPER_ADMIN') {
      // Tüm modüller için true döndür
      const allModules = [
        'dashboard',
        'company',
        'vendor',
        'customer',
        'meeting',
        'deal',
        'quote',
        'invoice',
        'product',
        'shipment',
        'purchase-shipment',
        'finance',
        'task',
        'ticket',
        'report',
        'user',
        'activity',
      ]

      const permissions: Record<string, { canRead: boolean }> = {}
      allModules.forEach((module) => {
        permissions[module] = { canRead: true }
      })

      return NextResponse.json(permissions, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      })
    }

    // Kullanıcının UserPermission kayıtlarını çek
    const { data: userPermissions, error } = await supabase
      .from('UserPermission')
      .select('module, "canRead"')
      .eq('userId', userId)
      .eq('companyId', companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Modül bazlı yetkileri oluştur
    const permissions: Record<string, { canRead: boolean }> = {}

    if (userPermissions && userPermissions.length > 0) {
      userPermissions.forEach((perm: any) => {
        permissions[perm.module] = {
          canRead: perm.canRead || false,
        }
      })
    }

    // PERFORMANCE FIX: Cache ekle - permissions sık değişmez, 60 saniye cache yeterli
    return NextResponse.json(permissions, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30', // 60 saniye cache (performans için)
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

