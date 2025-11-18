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
    const canCreate = await hasPermission('customer', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Orijinal customer'ı çek
    const { data: originalCustomer, error: fetchError } = await supabase
      .from('Customer')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !originalCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Yeni customer oluştur (ID'yi temizle)
    const { id: originalId, createdAt, updatedAt, ...customerData } = originalCustomer

    // Email ve telefon varsa duplicate kontrolü yap
    if (customerData.email) {
      const { data: existingCustomer } = await supabase
        .from('Customer')
        .select('id')
        .eq('email', customerData.email)
        .eq('companyId', session.user.companyId)
        .single()

      if (existingCustomer) {
        // Email zaten varsa, email'e "(Kopya)" ekle
        customerData.email = `${customerData.email.split('@')[0]}_copy@${customerData.email.split('@')[1]}`
      }
    }

    const { data: newCustomer, error: createError } = await supabase
      .from('Customer')
      .insert({
        ...customerData,
        name: `${customerData.name} (Kopya)`,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Customer duplicate create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Customer',
        action: 'CREATE',
        description: `Müşteri kopyalandı: ${newCustomer.name} (Orijinal: ${originalCustomer.name})`,
        meta: {
          customerId: newCustomer.id,
          originalCustomerId: id,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json(newCustomer)
  } catch (error: any) {
    console.error('Customer duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

















