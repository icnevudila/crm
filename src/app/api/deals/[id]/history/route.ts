import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const dealId = params.id

    // Deal bilgisini getir (tüm ilişkilerle)
    const { data: deal, error: dealError } = await supabase
      .from('Deal')
      .select(`
        *,
        customer:Customer(name),
        customerCompany:CustomerCompany(name),
        leadScore:LeadScore(
          score,
          temperature
        )
      `)
      .eq('id', dealId)
      .eq('companyId', session.user.companyId)
      .single()

    if (dealError) {
      console.error('Deal fetch error:', dealError)
      return NextResponse.json({ error: 'Deal bulunamadı' }, { status: 404 })
    }

    // Deal history'yi getir
    const { data: history, error: historyError } = await supabase
      .from('DealHistory')
      .select(`
        *,
        user:User(name)
      `)
      .eq('dealId', dealId)
      .order('changedAt', { ascending: false })

    if (historyError) {
      console.error('History fetch error:', historyError)
    }

    // Deal'e history'yi ekle
    const dealWithHistory = {
      ...deal,
      history: history || []
    }

    return NextResponse.json(dealWithHistory)
  } catch (error: any) {
    console.error('GET /api/deals/[id]/history error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
