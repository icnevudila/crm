import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { emailCampaignUpdateSchema } from '@/lib/validations/email-campaigns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canRead = await hasPermission('email-campaign', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: campaignId } = await params

    // Campaign bilgisini getir (segment ilişkisiyle)
    const { data: campaign, error: campaignError } = await supabase
      .from('EmailCampaign')
      .select(`
        *,
        createdBy:User!EmailCampaign_createdBy_fkey(id, name, email),
        segment:CustomerSegment(name)
      `)
      .eq('id', campaignId)
      .eq('companyId', session.user.companyId)
      .single()

    if (campaignError || !campaign) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('GET /api/email-campaigns/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canUpdate = await hasPermission('email-campaign', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: campaignId } = await params
    const body = await request.json()

    // Zod validation
    const validationResult = emailCampaignUpdateSchema.safeParse(body)
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

    const { data, error } = await supabase
      .from('EmailCampaign')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'EmailCampaign',
      entityId: campaignId,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Email kampanyası güncellendi: ${data.name}`,
      meta: { campaignId: data.id },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT /api/email-campaigns/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Kampanya güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canDelete = await hasPermission('email-campaign', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: campaignId } = await params

    const { error } = await supabase
      .from('EmailCampaign')
      .delete()
      .eq('id', campaignId)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'EmailCampaign',
      entityId: campaignId,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Email kampanyası silindi`,
      meta: { campaignId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/email-campaigns/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Kampanya silinemedi' },
      { status: 500 }
    )
  }
}
