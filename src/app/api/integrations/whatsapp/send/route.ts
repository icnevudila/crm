import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * POST /api/integrations/whatsapp/send
 * WhatsApp mesajı gönderir
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const supabase = getSupabase()

    const body = await request.json()
    const { phoneNumber, message, entityType, entityId } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'phoneNumber and message are required' },
        { status: 400 }
      )
    }

    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // WhatsApp Business API entegrasyonu burada yapılacak
    // Şimdilik mock response döndürüyoruz
    // Gerçek entegrasyon için WhatsApp Business API veya Twilio gibi servisler kullanılabilir

    // ActivityLog'a kaydet
    try {
      await supabase.from('ActivityLog').insert({
        userId: session.user.id,
        companyId,
        action: 'WHATSAPP_SENT',
        entityType: entityType || 'Customer',
        entityId: entityId || null,
        metadata: {
          phoneNumber: cleanPhone,
          message: message.substring(0, 100), // İlk 100 karakter
        },
      })
    } catch (logError) {
      console.error('ActivityLog error:', logError)
      // Log hatası mesaj gönderimini engellemez
    }

    // Mock response - Gerçek entegrasyon için WhatsApp API çağrısı yapılacak
    return NextResponse.json({
      success: true,
      messageId: `wa_${Date.now()}`,
      phoneNumber: cleanPhone,
      message: 'WhatsApp mesajı gönderildi (Mock)',
      // Gerçek entegrasyon için:
      // - WhatsApp Business API response
      // - Twilio WhatsApp API response
      // - veya başka bir servis
    })
  } catch (error: any) {
    console.error('WhatsApp send API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
