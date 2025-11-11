import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession()
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Son 12 ayın satış verilerini çek - Sadece PAID Invoice'ları say (KPI'larla tutarlı olması için)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // ✅ ÖNEMLİ: paymentDate varsa onu kullan (ne zaman ödendi), yoksa updatedAt kullan (ne zaman PAID oldu)
    // Tüm PAID invoice'ları çek, sonra JavaScript'te son 12 ay içinde ödenmiş olanları filtrele
    let invoicesQuery = supabase
      .from('Invoice')
      .select('totalAmount, createdAt, updatedAt, paymentDate, status') // DÜZELTME: total kaldır (050 migration ile total → totalAmount, total kolonu artık yok!)
      .eq('status', 'PAID') // ✅ Sadece PAID invoice'ları say (KPI'larla tutarlı)
      .order('createdAt', { ascending: true })
      .limit(1000) // Daha fazla kayıt çek (tüm PAID invoice'lar için)
    
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Trends API - Invoice query error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to fetch invoices', details: process.env.NODE_ENV === 'development' ? error : undefined },
        { status: 500 }
      )
    }

    // invoices null/undefined kontrolü
    if (!invoices) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Trends API - Invoices is null/undefined')
      }
      return NextResponse.json(
        { trends: [] },
        {
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }

    // Aylara göre grupla - Sadece PAID invoice'ları say (KPI'larla tutarlı)
    const monthlyData: Record<string, number> = {}

    // Önce son 12 ay için boş veri oluştur (grafik için)
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = 0
    }

    // Invoice'ları aylara göre grupla - Sadece PAID invoice'ları say (zaten query'de filtrelenmiş)
    // ✅ ÖNEMLİ: paymentDate varsa onu kullan (ne zaman ödendi), yoksa updatedAt kullan (ne zaman PAID oldu)
    // Son 12 ay içinde ödenmiş invoice'ları filtrele
    try {
      invoices.forEach((invoice: { 
        createdAt: string
        updatedAt?: string
        paymentDate?: string
        total?: number
        totalAmount?: number
        grandTotal?: number
        status?: string
      }) => {
        try {
          // paymentDate varsa onu kullan (ne zaman ödendi), yoksa updatedAt kullan (ne zaman PAID oldu)
          const paymentDate = invoice.paymentDate 
            ? new Date(invoice.paymentDate)
            : invoice.updatedAt 
              ? new Date(invoice.updatedAt)
              : new Date(invoice.createdAt) // Son çare: createdAt kullan
          
          // Geçersiz tarih kontrolü
          if (isNaN(paymentDate.getTime())) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Trends API - Invalid date for invoice:', invoice)
            }
            return // Geçersiz tarih, atla
          }
          
          // Son 12 ay içinde ödenmiş invoice'ları filtrele
          if (paymentDate < twelveMonthsAgo) {
            return // Bu invoice son 12 ay içinde değil, atla
          }
          
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          // Eğer bu ay zaten varsa topla, yoksa 0'dan başla - önce total kullan (veritabanında total var)
          // DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount)
          const invoiceTotal = invoice.totalAmount || invoice.total || invoice.grandTotal || 0
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + invoiceTotal
        } catch (invoiceError: any) {
          // Tek bir invoice'da hata varsa, diğerlerini işlemeye devam et
          if (process.env.NODE_ENV === 'development') {
            console.warn('Trends API - Error processing invoice:', invoice, invoiceError)
          }
        }
      })
    } catch (forEachError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Trends API - Error in forEach loop:', forEachError)
      }
      // Hata olsa bile boş trends dön - UI bozulmasın
      return NextResponse.json(
        { trends: [] },
        {
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }
    
    // Debug: Monthly data'yı logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoices count:', invoices?.length || 0)
      console.log('Monthly data keys:', Object.keys(monthlyData))
      console.log('Monthly data:', monthlyData)
      console.log('Trends array will have:', Object.keys(monthlyData).length, 'items')
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
      console.error('Trends API error stack:', error?.stack)
    }
    // Hata durumunda boş trends dön - UI bozulmasın
    return NextResponse.json(
      { 
        trends: [],
        error: process.env.NODE_ENV === 'development' ? (error?.message || 'Failed to fetch trends') : undefined
      },
      { status: 200 } // 200 dön - UI bozulmasın, sadece boş data göster
    )
  }
}

