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
    const canCreate = await hasPermission('quote', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Orijinal quote'u çek
    const { data: originalQuote, error: fetchError } = await supabase
      .from('Quote')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !originalQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Yeni quote number oluştur (son quote number'ı bul)
    const { data: lastQuote } = await supabase
      .from('Quote')
      .select('quoteNumber')
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    let newQuoteNumber = 'QUO-001'
    if (lastQuote?.quoteNumber) {
      const match = lastQuote.quoteNumber.match(/(\d+)$/)
      if (match) {
        const num = parseInt(match[1]) + 1
        newQuoteNumber = `QUO-${num.toString().padStart(3, '0')}`
      }
    }

    // Yeni quote oluştur (ID ve numaraları temizle)
    const { id: originalId, quoteNumber, version, parentQuoteId, revisionNotes, createdAt, updatedAt, ...quoteData } = originalQuote

    const { data: newQuote, error: createError } = await supabase
      .from('Quote')
      .insert({
        ...quoteData,
        quoteNumber: newQuoteNumber,
        status: 'DRAFT',
        version: 1,
        parentQuoteId: null,
        revisionNotes: null,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Quote duplicate create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // QuoteItem'ları kopyala
    const { data: originalItems } = await supabase
      .from('QuoteItem')
      .select('*')
      .eq('quoteId', id)
      .eq('companyId', session.user.companyId)

    if (originalItems && originalItems.length > 0) {
      const newItems = originalItems.map((item: any) => {
        const { id: itemId, quoteId, createdAt: itemCreatedAt, updatedAt: itemUpdatedAt, ...itemData } = item
        return {
          ...itemData,
          quoteId: newQuote.id,
          companyId: session.user.companyId,
        }
      })

      const { error: itemsError } = await supabase
        .from('QuoteItem')
        .insert(newItems)

      if (itemsError) {
        console.error('QuoteItem duplicate error:', itemsError)
        // QuoteItem hatası ana işlemi engellemez, sadece log'la
      }
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Quote',
        action: 'CREATE',
        description: `Teklif kopyalandı: ${newQuoteNumber} (Orijinal: ${quoteNumber})`,
        meta: {
          quoteId: newQuote.id,
          quoteNumber: newQuoteNumber,
          originalQuoteId: id,
          originalQuoteNumber: quoteNumber,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json(newQuote)
  } catch (error: any) {
    console.error('Quote duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}





