import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // DEBUG: Session ve companyId kontrolü logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stats Products API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
        isSuperAdmin: session.user.role === 'SUPER_ADMIN',
      })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    const [
      { count: total },
      { count: active },
      { count: lowStock },
      { count: outOfStock },
      { count: thisMonth },
    ] = await Promise.all([
      // Toplam ürün sayısı - sadece id kolonunu seç (status kolonu yok!)
      (() => {
        let query = supabase.from('Product').select('id', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Aktif ürünler (stokta olan ürünler - status kolonu yok, stock > 0 kullanıyoruz)
      (() => {
        let query = supabase.from('Product').select('id', { count: 'exact', head: true }).gt('stock', 0)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Düşük stoklu ürünler
      (() => {
        let query = supabase.from('Product').select('id', { count: 'exact', head: true }).lte('stock', 10).gt('stock', 0)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Stokta olmayan ürünler
      (() => {
        let query = supabase.from('Product').select('id', { count: 'exact', head: true }).eq('stock', 0)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Bu ay oluşturulan ürünler
      (() => {
        let query = supabase
          .from('Product')
          .select('id', { count: 'exact', head: true })
          .gte('createdAt', new Date(new Date().setDate(1)).toISOString())
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])

    return NextResponse.json(
      {
        total: total || 0,
        active: active || 0,
        lowStock: lowStock || 0,
        outOfStock: outOfStock || 0,
        thisMonth: thisMonth || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Product stats API error:', {
        message: error?.message,
        stack: error?.stack,
      })
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch product stats',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        }),
      },
      { status: 500 }
    )
  }
}



