import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Supabase bağlantı testi
    const supabase = getSupabase()
    
    // Basit bir query ile bağlantıyı test et
    const { error } = await supabase.from('Company').select('count').limit(1)
    
    if (error) {
      return NextResponse.json(
        { status: 'error', message: 'Veritabanı bağlantısı başarısız oldu', error: error.message },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Sağlık kontrolü başarısız oldu', error: String(error) },
      { status: 503 }
    )
  }
}







