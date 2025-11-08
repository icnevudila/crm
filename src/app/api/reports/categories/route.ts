import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Dynamic route - fresh data için
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rapor kategorileri ve her kategorideki rapor sayısı
    const categories = [
      { id: 'sales', name: 'Satış Raporları', count: 3 },
      { id: 'customers', name: 'Müşteri Raporları', count: 3 },
      { id: 'deals', name: 'Fırsat Raporları', count: 2 },
      { id: 'quotes', name: 'Teklif Raporları', count: 2 },
      { id: 'invoices', name: 'Fatura Raporları', count: 2 },
      { id: 'products', name: 'Ürün Raporları', count: 2 },
      { id: 'financial', name: 'Finansal Raporlar', count: 2 },
      { id: 'performance', name: 'Performans Raporları', count: 2 },
      { id: 'time', name: 'Zaman Bazlı Raporlar', count: 2 },
      { id: 'sector', name: 'Sektör Raporları', count: 2 },
    ]

    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch report categories' },
      { status: 500 }
    )
  }
}



