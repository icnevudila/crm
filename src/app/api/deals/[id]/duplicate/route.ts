import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canCreate = await hasPermission('deal', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Orijinal deal'i çek
    const { data: originalDeal, error: fetchError } = await supabase
      .from('Deal')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !originalDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Yeni deal oluştur (ID'yi temizle)
    const { id: originalId, createdAt, updatedAt, ...dealData } = originalDeal

    const { data: newDeal, error: createError } = await supabase
      .from('Deal')
      .insert({
        ...dealData,
        title: `${dealData.title} (Kopya)`,
        stage: 'LEAD', // Yeni deal her zaman LEAD stage'inde başlar
        status: 'OPEN',
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Deal duplicate create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Deal',
        action: 'CREATE',
        description: `Fırsat kopyalandı: ${newDeal.title} (Orijinal: ${originalDeal.title})`,
        meta: {
          dealId: newDeal.id,
          originalDealId: id,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json(newDeal)
  } catch (error: any) {
    console.error('Deal duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

















