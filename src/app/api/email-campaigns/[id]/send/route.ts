import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Internal cron call kontrolü (service role key ile)
    const authHeader = request.headers.get('authorization')
    const isInternalCall = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    
    let session: any = null
    let campaignId: string
    
    // Internal call değilse normal auth kontrolü yap
    if (!isInternalCall) {
      const { session: userSession, error: sessionError } = await getSafeSession(request)
      if (sessionError) {
        return sessionError
      }
      if (!userSession?.user?.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      session = userSession

      // Permission check - canUpdate kontrolü (send işlemi update sayılır)
      const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
      const canUpdate = await hasPermission('email-campaign', 'update', session.user.id)
      if (!canUpdate) {
        return buildPermissionDeniedResponse()
      }
    }
    
    const { id } = await params
    campaignId = id

    // Get campaign
    let campaignQuery = supabase
      .from('EmailCampaign')
      .select('*')
      .eq('id', campaignId)
    
    if (!isInternalCall) {
      campaignQuery = campaignQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: campaign, error: fetchError } = await campaignQuery.single()

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
      let customerQuery = supabase
        .from('Customer')
        .select('email, name')
        .not('email', 'is', null)
      
      if (!isInternalCall && session?.user?.companyId) {
        customerQuery = customerQuery.eq('companyId', session.user.companyId)
      } else if (campaign?.companyId) {
        customerQuery = customerQuery.eq('companyId', campaign.companyId)
      }
      
      const { data } = await customerQuery
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
      .eq('id', campaignId)

    // Send emails - Resend entegrasyonu kullan
    const { sendEmail } = await import('@/lib/integrations/email')
    
    let successCount = 0
    let failCount = 0
    
    for (const customer of customers) {
      if (!customer.email) continue

      try {
        // Email gönder - Resend entegrasyonu kullan
        console.log(`Sending email to ${customer.email}`)
        
        const emailResult = await sendEmail(
          campaign.companyId,
          {
            to: customer.email,
            subject: campaign.subject,
            html: campaign.htmlContent || campaign.body || '',
            from: campaign.fromEmail || undefined,
            fromName: campaign.fromName || undefined,
          }
        )
        
        if (!emailResult.success) {
          console.error(`Failed to send email to ${customer.email}:`, emailResult.error)
          failCount++
          continue
        }
        
        // Email log oluştur (trigger stats'ı otomatik güncelleyecek)
        await supabase.from('EmailLog').insert({
          campaignId: campaignId,
          recipientEmail: customer.email,
          recipientName: customer.name,
          status: 'SENT', // Trigger 'SENT' status'ünü bekliyor
          sentAt: new Date().toISOString(),
          messageId: emailResult.messageId || null,
          companyId: campaign.companyId,
        })
        
        successCount++
      } catch (emailError) {
        console.error(`Failed to send to ${customer.email}:`, emailError)
        
        // Hata logu
        await supabase.from('EmailLog').insert({
          campaignId: campaignId,
          recipientEmail: customer.email,
          recipientName: customer.name,
          status: 'FAILED',
          sentAt: new Date().toISOString(),
          companyId: campaign.companyId,
        })
        
        failCount++
      }
    }

    // Campaign'i SENT olarak işaretle ve istatistikleri güncelle
    await supabase
      .from('EmailCampaign')
      .update({ 
        status: 'SENT',
        totalSent: successCount,
      })
      .eq('id', campaignId)

    // Activity log (sadece manuel gönderimlerde - cron call'da userId yok)
    if (session?.user?.id) {
      await supabase.from('ActivityLog').insert({
        action: 'SEND',
        entityType: 'EmailCampaign',
        entityId: campaignId,
        userId: session.user.id,
        companyId: campaign.companyId,
        description: `Sent email campaign to ${successCount} customers`,
        meta: {
          campaignName: campaign.name,
          recipientCount: successCount,
          failedCount: failCount,
        },
      })
    }

    return NextResponse.json({
      success: true,
      sentCount: customers.length,
      message: `Campaign sent to ${customers.length} customers`,
    })
  } catch (error: any) {
    console.error('Campaign send error:', error)

    // Hata durumunda FAILED olarak işaretle
    const { id: failedCampaignId } = await params
    await supabase
      .from('EmailCampaign')
      .update({ status: 'FAILED' })
      .eq('id', failedCampaignId)

    return NextResponse.json(
      { error: error.message || 'Failed to send campaign' },
      { status: 500 }
    )
  }
}


