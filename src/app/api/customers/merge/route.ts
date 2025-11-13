import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - her zaman fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * İki müşteriyi birleştir (Merge)
 * 
 * Strateji:
 * 1. Ana müşteri (keepId) korunur
 * 2. Diğer müşteri (removeId) silinir
 * 3. İlişkili kayıtlar (Deal, Quote, Invoice, Task, Ticket, Meeting) ana müşteriye taşınır
 * 4. ActivityLog kaydı oluşturulur
 */
export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('customer', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()
    const { keepId, removeId } = body

    if (!keepId || !removeId) {
      return NextResponse.json(
        { error: 'keepId ve removeId gereklidir' },
        { status: 400 }
      )
    }

    if (keepId === removeId) {
      return NextResponse.json(
        { error: 'Aynı müşteri birleştirilemez' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Müşterilerin var olup olmadığını ve yetki kontrolü yap
    let checkQuery = supabase
      .from('Customer')
      .select('id, name, email, phone, companyId')
      .in('id', [keepId, removeId])

    if (!isSuperAdmin) {
      checkQuery = checkQuery.eq('companyId', companyId)
    }

    const { data: customers, error: checkError } = await checkQuery

    if (checkError || !customers || customers.length !== 2) {
      return NextResponse.json(
        { error: 'Müşteriler bulunamadı veya yetkiniz yok' },
        { status: 404 }
      )
    }

    const keepCustomer = customers.find((c) => c.id === keepId)
    const removeCustomer = customers.find((c) => c.id === removeId)

    if (!keepCustomer || !removeCustomer) {
      return NextResponse.json(
        { error: 'Müşteriler bulunamadı' },
        { status: 404 }
      )
    }

    // Ana müşteriyi güncelle (removeCustomer'dan eksik bilgileri al)
    const updateData: any = {}
    
    if (!keepCustomer.email && removeCustomer.email) {
      updateData.email = removeCustomer.email
    }
    if (!keepCustomer.phone && removeCustomer.phone) {
      updateData.phone = removeCustomer.phone
    }

    // Ana müşteriyi güncelle
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('Customer')
        .update(updateData)
        .eq('id', keepId)

      if (updateError) {
        console.error('Customer update error:', updateError)
        // Hata olsa bile devam et
      }
    }

    // İlişkili kayıtları güncelle (customerId değiştir)
    const relatedTables = [
      'Deal',
      'Quote',
      'Invoice',
      'Task',
      'Ticket',
      'Meeting',
      'Shipment',
    ]

    const updateResults: Record<string, { updated: number; error?: string }> = {}

    for (const table of relatedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .update({ customerId: keepId })
          .eq('customerId', removeId)
          .select('id')

        if (error) {
          console.error(`${table} update error:`, error)
          updateResults[table] = { updated: 0, error: error.message }
        } else {
          updateResults[table] = { updated: data?.length || 0 }
        }
      } catch (err: any) {
        console.error(`${table} update exception:`, err)
        updateResults[table] = { updated: 0, error: err.message }
      }
    }

    // CustomerCompany ilişkisini güncelle (eğer varsa)
    try {
      const { error: ccError } = await supabase
        .from('Customer')
        .update({ customerCompanyId: keepCustomer.customerCompanyId || removeCustomer.customerCompanyId })
        .eq('id', keepId)
        .is('customerCompanyId', null)

      if (ccError) {
        console.error('CustomerCompany update error:', ccError)
      }
    } catch (err) {
      // Hata olsa bile devam et
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Customer',
          action: 'MERGE',
          description: `Müşteriler birleştirildi: ${removeCustomer.name} → ${keepCustomer.name}`,
          meta: {
            entity: 'Customer',
            action: 'merge',
            keepId,
            removeId,
            keepName: keepCustomer.name,
            removeName: removeCustomer.name,
            updateResults,
            companyId: session.user.companyId,
            createdBy: session.user.id,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      console.error('ActivityLog error:', activityError)
      // Hata olsa bile devam et
    }

    // Silinecek müşteriyi sil
    const { error: deleteError } = await supabase
      .from('Customer')
      .delete()
      .eq('id', removeId)

    if (deleteError) {
      console.error('Customer delete error:', deleteError)
      return NextResponse.json(
        { error: 'Müşteri silinemedi', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Müşteriler başarıyla birleştirildi: ${removeCustomer.name} → ${keepCustomer.name}`,
      keepId,
      removeId,
      updateResults,
    })
  } catch (error: any) {
    console.error('Merge API exception:', error)
    return NextResponse.json(
      { error: 'Failed to merge customers', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

