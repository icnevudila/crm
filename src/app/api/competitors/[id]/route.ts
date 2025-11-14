import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
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

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('competitor', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .select('*')
      .eq('id', (await params).id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Competitor fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip bilgisi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
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

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('competitor', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()
    const { id } = await params

    // ✅ ÇÖZÜM: strengths ve weaknesses JSON string ise parse et, TEXT[] formatına dönüştür
    const updateData: any = { ...body }
    
    if (body.strengths !== undefined) {
      if (typeof body.strengths === 'string') {
        try {
          updateData.strengths = JSON.parse(body.strengths)
        } catch {
          // JSON parse edilemezse direkt array olarak kullan
          updateData.strengths = [body.strengths]
        }
      } else if (Array.isArray(body.strengths)) {
        updateData.strengths = body.strengths
      } else if (body.strengths === null) {
        updateData.strengths = null
      }
    }
    
    if (body.weaknesses !== undefined) {
      if (typeof body.weaknesses === 'string') {
        try {
          updateData.weaknesses = JSON.parse(body.weaknesses)
        } catch {
          // JSON parse edilemezse direkt array olarak kullan
          updateData.weaknesses = [body.weaknesses]
        }
      } else if (Array.isArray(body.weaknesses)) {
        updateData.weaknesses = body.weaknesses
      } else if (body.weaknesses === null) {
        updateData.weaknesses = null
      }
    }

    // ✅ ÇÖZÜM: averagePrice undefined ise null gönder, 0 geçerli bir değer
    if (body.averagePrice !== undefined) {
      updateData.averagePrice = body.averagePrice !== null 
        ? (isNaN(parseFloat(body.averagePrice)) ? null : parseFloat(body.averagePrice))
        : null
    }

    // ✅ ÇÖZÜM: marketShare undefined ise null gönder, 0 geçerli bir değer
    if (body.marketShare !== undefined) {
      updateData.marketShare = body.marketShare !== null 
        ? (isNaN(parseFloat(body.marketShare)) ? null : parseFloat(body.marketShare))
        : null
    }

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'Competitor',
      entityId: id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated competitor: ${data.name}`,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Competitor update error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
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

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('competitor', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()
    const { error } = await supabase
      .from('Competitor')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Competitor',
      entityId: id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted competitor`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Competitor delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip silinemedi' },
      { status: 500 }
    )
  }
}


