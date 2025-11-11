import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { checkUserPermission } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Session yoksa veya companyId yoksa varsayılan yetkiler döndür (401 yerine)
    // Client-side'da session yüklenene kadar bekleyecek
    if (!session?.user?.companyId) {
      return NextResponse.json({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      })
    }

    const { searchParams } = new URL(request.url)
    const module = searchParams.get('module')

    if (!module) {
      return NextResponse.json({ error: 'Module parameter is required' }, { status: 400 })
    }

    // checkUserPermission fonksiyonu UserPermission tablosunu da kontrol ediyor
    const permissions = await checkUserPermission(module)

    return NextResponse.json(permissions, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // Gerçek zamanlı kontrol için cache yok
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check permissions' },
      { status: 500 }
    )
  }
}

