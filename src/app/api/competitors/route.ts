import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('competitor', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Rakip görüntüleme yetkiniz yok' },
        { status: 403 }
      )
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
      { error: error.message || 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canCreate = await hasPermission('competitor', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Rakip oluşturma yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
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
      description: `Added competitor: ${data.name}`,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Competitor create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create competitor' },
      { status: 500 }
    )
  }
}



