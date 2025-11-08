import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - sektör atandığında fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Distribution API session error:', sessionError)
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

    // PARALEL QUERY'LER - 3x daha hızlı!
    const [
      { data: products, error: productsError },
      { data: customers, error: customersError },
      { data: customerCompanies, error: customerCompaniesError },
    ] = await Promise.all([
      // Ürün satış dağılımı (en çok satılan ürünler) - Sadece gerekli kolonlar
      (() => {
        let query = supabase.from('Product').select('id, name, price').order('price', { ascending: false }).limit(10)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Müşteri sektör dağılımı (müşteri isimleri ile) - Sadece gerekli kolonlar
      // sector null olabilir, tüm müşterileri çek sonra filtrele
      (() => {
        let query = supabase.from('Customer').select('id, name, sector').limit(100)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Müşteri firma sektör dağılımı (müşteri firmaları) - Sadece gerekli kolonlar
      // SUPER_ADMIN bu sayfayı kullanmaz ama yine de kontrol edelim
      (() => {
        if (isSuperAdmin) {
          // SuperAdmin tüm firmaları görebilir ama bu endpoint'i kullanmaz
          return supabase.from('CustomerCompany').select('id, name, sector, status').eq('status', 'ACTIVE').limit(1000)
        }
        let query = supabase
          .from('CustomerCompany')
          .select('id, name, sector, status')
          .eq('status', 'ACTIVE')
          .eq('companyId', companyId)
          .limit(1000)
        return query
      })(),
    ])

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 })
    }

    if (customerCompaniesError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('CustomerCompanies query error:', customerCompaniesError)
      }
      // Hata olsa bile devam et (graceful degradation)
    }
    
    // Debug: CustomerCompanies verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('CustomerCompanies count:', customerCompanies?.length || 0)
      console.log('CustomerCompanies sample:', customerCompanies?.slice(0, 3))
    }

    // Sektörlere göre grupla (müşteri isimleri ile)
    // Eğer sector null ise "Belirtilmemiş" olarak işaretle
    const sectorDistribution: Record<string, { count: number; customers: Array<{ id: string; name: string }> }> = {}
    customers?.forEach((customer: { id: string; name: string; sector?: string | null }) => {
      const sector = customer.sector || 'Belirtilmemiş'
      if (!sectorDistribution[sector]) {
        sectorDistribution[sector] = { count: 0, customers: [] }
      }
      sectorDistribution[sector].count += 1
      sectorDistribution[sector].customers.push({
        id: customer.id,
        name: customer.name,
      })
    })

    const productSales = (products || []).map((product: { name: string; price?: number }) => ({
      name: product.name,
      value: product.price || 0,
    }))

    const customerSectors = Object.keys(sectorDistribution).map((sector) => ({
      name: sector,
      value: sectorDistribution[sector].count,
      customers: sectorDistribution[sector].customers.slice(0, 10), // İlk 10 müşteriyi göster (performans için)
      totalCustomers: sectorDistribution[sector].customers.length,
    }))

    // Müşteri firma sektör dağılımı - CustomerCompany tablosundan
    const companySectorDistribution: Record<string, { count: number; companies: Array<{ id: string; name: string }> }> = {}
    customerCompanies?.forEach((company: { id: string; name: string; sector?: string | null }) => {
      const sector = company.sector || 'Belirtilmemiş'
      if (!companySectorDistribution[sector]) {
        companySectorDistribution[sector] = { count: 0, companies: [] }
      }
      companySectorDistribution[sector].count += 1
      companySectorDistribution[sector].companies.push({
        id: company.id,
        name: company.name,
      })
    })

    const companySectors = Object.keys(companySectorDistribution).map((sector) => ({
      name: sector,
      value: companySectorDistribution[sector].count,
      companies: companySectorDistribution[sector].companies.slice(0, 10), // İlk 10 firmayı göster (performans için)
      totalCompanies: companySectorDistribution[sector].companies.length,
    }))
    
    // Debug: companySectors verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('companySectors count:', companySectors.length)
      console.log('companySectors data:', companySectors)
    }

    return NextResponse.json(
      {
        productSales,
        customerSectors,
        companySectors, // Müşteri firma sektör dağılımı
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // Sektör atandığında fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Distribution API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch distribution' },
      { status: 500 }
    )
  }
}

