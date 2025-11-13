import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
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
      .eq('companyId', session.user.companyId)
      .order('name')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Competitors fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip listesi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('competitor', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'İsim alanı zorunludur' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .insert({
        ...body,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'Competitor',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Rakip eklendi: ${data.name}`,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Competitor create error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip oluşturulamadı' },
      { status: 500 }
    )
  }
}



