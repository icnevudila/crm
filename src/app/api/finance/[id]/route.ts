import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('finance', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Finans görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // Finance kaydını çek
    let financeQuery = supabase
      .from('Finance')
      .select('*')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      financeQuery = financeQuery.eq('companyId', companyId)
    }
    
    const { data: finance, error } = await financeQuery.single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('entity', 'Finance')
      .eq('meta->>id', id)
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(finance as any),
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch finance record' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('finance', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Finans kaydı güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const description = `Finans kaydı güncellendi: ${body.type === 'INCOME' ? 'Gelir' : 'Gider'} - ${body.amount} ₺`
    const data = await updateRecord('Finance', id, body, description)

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update finance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canDelete = await hasPermission('finance', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Finans kaydı silme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Finance silinmeden önce ilişkili Invoice PAID kontrolü
    const { data: finance, error: financeError } = await supabase
      .from('Finance')
      .select('id, invoiceId, relatedTo')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()
    
    if (financeError && process.env.NODE_ENV === 'development') {
      console.error('Finance DELETE - Finance check error:', financeError)
    }
    
    // Invoice ile ilişkili Finance kaydı kontrolü
    if (finance?.invoiceId) {
      // Invoice PAID durumunda Finance silinemez
      const { data: invoice, error: invoiceError } = await supabase
        .from('Invoice')
        .select('id, title, status')
        .eq('id', finance.invoiceId)
        .eq('companyId', session.user.companyId)
        .single()
      
      if (invoiceError && process.env.NODE_ENV === 'development') {
        console.error('Finance DELETE - Invoice check error:', invoiceError)
      }
      
      if (invoice && invoice.status === 'PAID') {
        return NextResponse.json(
          { 
            error: 'Finans kaydı silinemez',
            message: 'Bu finans kaydı ödenmiş bir faturaya bağlı. Finans kaydını silmek için önce faturanın durumunu değiştirmeniz gerekir.',
            reason: 'FINANCE_HAS_PAID_INVOICE',
            relatedInvoice: {
              id: invoice.id,
              title: invoice.title,
              status: invoice.status
            }
          },
          { status: 403 }
        )
      }
    }
    
    // relatedTo alanında Invoice referansı varsa kontrol et
    if (finance?.relatedTo && finance.relatedTo.includes('Invoice:')) {
      const invoiceIdMatch = finance.relatedTo.match(/Invoice:\s*([a-f0-9-]+)/i)
      if (invoiceIdMatch && invoiceIdMatch[1]) {
        const invoiceId = invoiceIdMatch[1]
        const { data: invoice, error: invoiceError } = await supabase
          .from('Invoice')
          .select('id, title, status')
          .eq('id', invoiceId)
          .eq('companyId', session.user.companyId)
          .single()
        
        if (invoiceError && process.env.NODE_ENV === 'development') {
          console.error('Finance DELETE - Invoice check error:', invoiceError)
        }
        
        if (invoice && invoice.status === 'PAID') {
          return NextResponse.json(
            { 
              error: 'Finans kaydı silinemez',
              message: 'Bu finans kaydı ödenmiş bir faturaya bağlı. Finans kaydını silmek için önce faturanın durumunu değiştirmeniz gerekir.',
              reason: 'FINANCE_HAS_PAID_INVOICE',
              relatedInvoice: {
                id: invoice.id,
                title: invoice.title,
                status: invoice.status
              }
            },
            { status: 403 }
          )
        }
      }
    }

    await deleteRecord('Finance', id, `Finans kaydı silindi: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete finance record' },
      { status: 500 }
    )
  }
}
