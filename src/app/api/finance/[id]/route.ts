import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('finance', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // Finance kaydını çek - ilişkili Invoice/Contract bilgilerini de çek (eğer varsa)
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
      Invoice: invoiceData,
      Contract: contractData,
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Finans kaydı bulunamadı' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Finans kaydı getirilemedi' },
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('finance', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const body = await request.json()

    const description = `Finans kaydı güncellendi: ${body.type === 'INCOME' ? 'Gelir' : 'Gider'} - ${body.amount} ₺`
    const data = await updateRecord('Finance', id, body, description)

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Finans kaydı güncellenemedi' },
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('finance', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
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
      { error: error.message || 'Finans kaydı silinemedi' },
      { status: 500 }
    )
  }
}
