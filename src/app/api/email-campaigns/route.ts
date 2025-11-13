import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { emailCampaignCreateSchema } from '@/lib/validations/email-campaigns'

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
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('email-campaign', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
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
      { error: error.message || 'E-posta kampanyaları getirilemedi' },
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
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('email-campaign', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const body = await request.json()

    // Zod validation
    const validationResult = emailCampaignCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // scheduledAt varsa SCHEDULED, yoksa DRAFT
    const status = validatedData.scheduledAt && new Date(validatedData.scheduledAt) > new Date()
      ? 'SCHEDULED'
      : 'DRAFT'

    const { data, error } = await supabase
      .from('EmailCampaign')
      .insert({
        ...validatedData,
        createdBy: session.user.id,
        companyId: session.user.companyId,
        status, // scheduledAt varsa SCHEDULED, yoksa DRAFT
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
      description: `E-posta kampanyası oluşturuldu: ${data.name}`,
      meta: { campaignId: data.id },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Email campaign create error:', error)
    return NextResponse.json(
      { error: error.message || 'E-posta kampanyası oluşturulamadı' },
      { status: 500 }
    )
  }
}



