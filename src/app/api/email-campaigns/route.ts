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
    const canRead = await hasPermission('email-campaign', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Email kampanyası görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('EmailCampaign')
      .select(`
        id, name, subject, status, scheduledAt, sentAt,
        totalSent, totalOpened, totalClicked, totalBounced,
        createdAt,
        createdBy:User!EmailCampaign_createdBy_fkey(id, name, email)
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Email campaigns fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email campaigns' },
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
    const canCreate = await hasPermission('email-campaign', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Email kampanyası oluşturma yetkiniz yok' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const body = await request.json()

    // Validation
    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('EmailCampaign')
      .insert({
        ...body,
        createdBy: session.user.id,
        companyId: session.user.companyId,
        status: 'DRAFT',
      })
      .select()
      .single()

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'EmailCampaign',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Created email campaign: ${data.name}`,
      meta: { campaignId: data.id },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Email campaign create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create email campaign' },
      { status: 500 }
    )
  }
}



