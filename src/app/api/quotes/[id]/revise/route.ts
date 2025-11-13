import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

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

    const { id } = await params
    const body = await request.json()
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

    // Yeni quote number oluştur
    const newQuoteNumber = `${originalQuote.quoteNumber}-R${originalQuote.version + 1}`

    // Yeni revizyon oluştur
    const { data: newQuote, error: createError } = await supabase
      .from('Quote')
      .insert({
        quoteNumber: newQuoteNumber,
        title: originalQuote.title,
        customerId: originalQuote.customerId,
        customerCompanyId: originalQuote.customerCompanyId,
        dealId: originalQuote.dealId,
        totalAmount: originalQuote.totalAmount,
        discount: originalQuote.discount,
        tax: originalQuote.tax,
        validUntil: originalQuote.validUntil,
        status: 'DRAFT',
        version: originalQuote.version + 1,
        parentQuoteId: originalQuote.parentQuoteId || originalQuote.id, // İlk revizyon ise kendini, değilse parent'ı
        revisionNotes: body.revisionNotes || 'Revizyon oluşturuldu',
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Quote revision create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // ActivityLog
    await supabase.from('ActivityLog').insert({
      entity: 'Quote',
      action: 'CREATE',
      description: `Teklif revizyonu oluşturuldu: ${newQuoteNumber}`,
      meta: {
        quoteId: newQuote.id,
        quoteNumber: newQuoteNumber,
        parentQuoteId: originalQuote.id,
        parentQuoteNumber: originalQuote.quoteNumber,
        version: newQuote.version,
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(newQuote)
  } catch (error: any) {
    console.error('Quote revise error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



