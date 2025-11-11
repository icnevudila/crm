import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
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

    // SUPER_ADMIN ve ADMIN her zaman tüm yetkilere sahip
    if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN') {
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

    return NextResponse.json(permissions, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // Gerçek zamanlı kontrol için cache yok
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

