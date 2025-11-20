import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    const { data, error } = await supabase
      .from('CreditNote')
      .select(`
        *,
        returnOrder:ReturnOrder!CreditNote_returnOrderId_fkey(id, returnNumber, status, totalAmount),
        invoice:Invoice!CreditNote_invoiceId_fkey(id, invoiceNumber, title, totalAmount),
        customer:Customer!CreditNote_customerId_fkey(id, name, email, phone)
      `)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Credit note fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credit note' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Check if credit note exists
    const { data: existing } = await supabase
      .from('CreditNote')
      .select('id, status')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Status güncelleme
    if (body.status) {
      updateData.status = body.status
      
      // ISSUED durumunda issuedAt set et
      if (body.status === 'ISSUED' && !(existing as any).issuedAt) {
        updateData.issuedAt = new Date().toISOString()
      }
      
      // APPLIED durumunda appliedAt set et
      if (body.status === 'APPLIED') {
        updateData.appliedAt = new Date().toISOString()
      }
    }

    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.reason) updateData.reason = body.reason

    const { data, error } = await supabase
      .from('CreditNote')
      .update(updateData)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // Otomasyon bilgilerini sakla
    const automationInfo: any = {
      financeCreated: false,
      financeId: null,
    }

    // Credit Note APPLIED olduğunda Finance kaydı oluştur
    if (body.status === 'APPLIED' && existing.status !== 'APPLIED') {
      try {
        // Zaten Finance kaydı var mı kontrol et
        const { data: existingFinance } = await supabase
          .from('Finance')
          .select('id')
          .eq('relatedEntityType', 'CreditNote')
          .eq('relatedEntityId', params.id)
          .eq('companyId', session.user.companyId)
          .maybeSingle()

        if (!existingFinance) {
          // Finance kaydı oluştur (EXPENSE - iade gideri)
          const { data: finance } = await supabase
            .from('Finance')
            .insert([
              {
                type: 'EXPENSE',
                amount: data.amount || 0,
                category: 'REFUND',
                description: `Alacak dekontu uygulandı: ${data.creditNoteNumber}`,
                transactionDate: new Date().toISOString().split('T')[0],
                relatedEntityType: 'CreditNote',
                relatedEntityId: params.id,
                companyId: session.user.companyId,
                status: 'COMPLETED',
              },
            ])
            .select()
            .single()

          if (finance) {
            automationInfo.financeCreated = true
            automationInfo.financeId = finance.id
          }
        } else {
          automationInfo.financeCreated = true
          automationInfo.financeId = existingFinance.id
        }
      } catch (financeError) {
        // Finance hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Credit Note APPLIED finance creation error:', financeError)
        }
      }
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'creditNoteUpdated', {
      creditNoteNumber: data.creditNoteNumber,
      status: body.status || existing.status,
    })

    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'CreditNote',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        creditNoteId: data.id,
        creditNoteNumber: data.creditNoteNumber,
        oldStatus: existing.status,
        newStatus: body.status,
        changes: body,
        automation: automationInfo,
      },
    })

    return NextResponse.json({
      ...data,
      automation: automationInfo,
    })
  } catch (error: any) {
    console.error('Credit note update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update credit note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Check if credit note exists
    const { data: existing } = await supabase
      .from('CreditNote')
      .select('id, creditNoteNumber, status')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    // APPLIED durumunda silinemez (Finance kaydı oluşturulmuş olabilir)
    if (existing.status === 'APPLIED') {
      return NextResponse.json(
        { error: 'Applied credit notes cannot be deleted' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('CreditNote')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'creditNoteDeleted', {
      creditNoteNumber: existing.creditNoteNumber,
    })

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'CreditNote',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: { creditNoteId: params.id, creditNoteNumber: existing.creditNoteNumber },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Credit note delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete credit note' },
      { status: 500 }
    )
  }
}


