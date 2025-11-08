import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST/PUT sonrası fresh data için)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    const [
      { count: total },
      { count: active },
      { data: allDealsData }, // Tüm fırsatların değerleri
      { data: openDealsData }, // OPEN olan fırsatların değerleri
      { count: thisMonth },
    ] = await Promise.all([
      // Toplam fırsat sayısı
      (() => {
        let query = supabase.from('Deal').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // OPEN fırsat sayısı (Deal tablosunda status: 'OPEN' kullanılıyor, 'ACTIVE' değil)
      (() => {
        let query = supabase.from('Deal').select('*', { count: 'exact', head: true }).eq('status', 'OPEN')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Tüm fırsatların değerleri (toplam değer için)
      (() => {
        let query = supabase.from('Deal').select('value')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // OPEN olan fırsatların değerleri (aktif tutar için)
      (() => {
        let query = supabase.from('Deal').select('value').eq('status', 'OPEN')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Bu ay oluşturulan fırsatlar
      (() => {
        let query = supabase
          .from('Deal')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', new Date(new Date().setDate(1)).toISOString())
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])

    // Tüm fırsatların toplam değeri
    const totalValue = allDealsData?.reduce((sum: number, deal: any) => {
      const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0)
      return sum + dealValue
    }, 0) || 0

    // OPEN olan fırsatların toplam değeri (aktif tutar)
    const activeValue = openDealsData?.reduce((sum: number, deal: any) => {
      const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0)
      return sum + dealValue
    }, 0) || 0

    // Ortalama değer (tüm fırsatlar için)
    const avgValue = total > 0 ? Math.round(totalValue / total) : 0

    return NextResponse.json(
      {
        total: total || 0,
        active: active || 0, // OPEN olan fırsat sayısı
        totalValue, // Tüm fırsatların toplam değeri
        activeValue, // OPEN olan fırsatların toplam değeri (aktif tutar)
        avgValue, // Ortalama değer
        thisMonth: thisMonth || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // POST/PUT sonrası fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deal stats' },
      { status: 500 }
    )
  }
}



