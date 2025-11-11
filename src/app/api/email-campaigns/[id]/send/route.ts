import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü (send işlemi update sayılır)
    const { hasPermission } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('email-campaign', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Email kampanyası gönderme yetkiniz yok' },
        { status: 403 }
      )
    }

    // Get campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('EmailCampaign')
      .select('*')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Campaign cannot be sent' },
        { status: 400 }
      )
    }

    // Get target customers
    let customers: any[] = []

    if (campaign.targetSegment) {
      // Segment'ten müşterileri al
      const { data: members } = await supabase
        .from('SegmentMember')
        .select('customerId, Customer(email, name)')
        .eq('segmentId', campaign.targetSegment)

      customers = members?.map((m: any) => ({
        email: m.Customer?.email,
        name: m.Customer?.name,
      })) || []
    } else {
      // Tüm müşterilere gönder
      const { data } = await supabase
        .from('Customer')
        .select('email, name')
        .eq('companyId', session.user.companyId)
        .not('email', 'is', null)

      customers = data || []
    }

    if (customers.length === 0) {
      return NextResponse.json(
        { error: 'No customers to send to' },
        { status: 400 }
      )
    }

    // Update campaign status
    await supabase
      .from('EmailCampaign')
      .update({
        status: 'SENDING',
        sentAt: new Date().toISOString(),
      })
      .eq('id', params.id)

    // Send emails (MOCK - gerçek email service entegrasyonu lazım)
    // TODO: SendGrid, AWS SES, veya Resend kullan
    for (const customer of customers) {
      if (!customer.email) continue

      try {
        // Email gönder (mock)
        console.log(`Sending email to ${customer.email}`)
        
        // Email log oluştur
        await supabase.from('EmailLog').insert({
          campaignId: params.id,
          recipientEmail: customer.email,
          recipientName: customer.name,
          status: 'DELIVERED', // Mock: başarılı
          sentAt: new Date().toISOString(),
          companyId: session.user.companyId,
        })
      } catch (emailError) {
        console.error(`Failed to send to ${customer.email}:`, emailError)
        
        // Hata logu
        await supabase.from('EmailLog').insert({
          campaignId: params.id,
          recipientEmail: customer.email,
          recipientName: customer.name,
          status: 'FAILED',
          sentAt: new Date().toISOString(),
          companyId: session.user.companyId,
        })
      }
    }

    // Campaign'i SENT olarak işaretle
    await supabase
      .from('EmailCampaign')
      .update({ status: 'SENT' })
      .eq('id', params.id)

    // Activity log
    await supabase.from('ActivityLog').insert({
      action: 'SEND',
      entityType: 'EmailCampaign',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Sent email campaign to ${customers.length} customers`,
      meta: {
        campaignName: campaign.name,
        recipientCount: customers.length,
      },
    })

    return NextResponse.json({
      success: true,
      sentCount: customers.length,
      message: `Campaign sent to ${customers.length} customers`,
    })
  } catch (error: any) {
    console.error('Campaign send error:', error)

    // Hata durumunda FAILED olarak işaretle
    await supabase
      .from('EmailCampaign')
      .update({ status: 'FAILED' })
      .eq('id', params.id)

    return NextResponse.json(
      { error: error.message || 'Failed to send campaign' },
      { status: 500 }
    )
  }
}


