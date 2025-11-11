import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('email-campaign', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabase()
    const campaignId = params.id

    // Campaign bilgisini getir (segment ilişkisiyle)
    const { data: campaign, error: campaignError } = await supabase
      .from('EmailCampaign')
      .select(`
        *,
        segment:CustomerSegment(name)
      `)
      .eq('id', campaignId)
      .eq('companyId', session.user.companyId)
      .single()

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('GET /api/email-campaigns/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
