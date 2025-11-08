import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Trends API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Son 12 ayın satış verilerini çek - Sadece gerekli kolonlar
    // Tüm Invoice'ları çek (status'e bakmadan), sonra PAID olanları filtrele
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let invoicesQuery = supabase
      .from('Invoice')
      .select('total, createdAt, status')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(1000) // Daha fazla kayıt çek (tüm invoice'lar için)
    
    if (!isSuperAdmin) {
      invoicesQuery = invoicesQuery.eq('companyId', companyId)
    }
    
    const { data: invoices, error } = await invoicesQuery
    
    // Debug: Invoice verilerini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoices count:', invoices?.length || 0)
      console.log('Invoices sample:', invoices?.slice(0, 3))
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aylara göre grupla - Sadece PAID invoice'ları say
    const monthlyData: Record<string, number> = {}

    invoices?.forEach((invoice: { createdAt: string; total?: number; status?: string }) => {
      // Sadece PAID invoice'ları say
      if (invoice.status === 'PAID') {
        const date = new Date(invoice.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (invoice.total || 0)
      }
    })
    
    // Debug: Monthly data'yı logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Monthly data keys:', Object.keys(monthlyData))
      console.log('Monthly data:', monthlyData)
    }
    
    // Eğer hiç veri yoksa, son 12 ay için boş veri oluştur (grafik için)
    if (Object.keys(monthlyData).length === 0) {
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyData[monthKey] = 0
      }
    }

    // Array formatına dönüştür
    const trends = Object.keys(monthlyData)
      .sort()
      .map((month) => ({
        month,
        total_sales: monthlyData[month],
      }))

    return NextResponse.json(
      { trends },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // Fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Trends API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch trends' },
      { status: 500 }
    )
  }
}

