import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Supabase Auth ile session endpoint
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('crm_session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value)

      // Session'ın geçerli olup olmadığını kontrol et
      if (new Date(sessionData.expires) < new Date()) {
        cookieStore.delete('crm_session')
        return NextResponse.json({ user: null })
      }

      // User bilgisini güncelle (veritabanından)
      const supabase = getSupabaseWithServiceRole()
      const { data: user } = await supabase
        .from('User')
        .select('id, email, name, role, companyId')
        .eq('id', sessionData.userId)
        .maybeSingle()

      if (!user) {
        cookieStore.delete('crm_session')
        return NextResponse.json({ user: null })
      }

      // Company bilgisini al
      let companyName = null
      if (user.companyId) {
        const { data: company } = await supabase
          .from('Company')
          .select('name')
          .eq('id', user.companyId)
          .maybeSingle()
        companyName = company?.name || null
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId || null,
          companyName,
        },
      })
    } catch {
      cookieStore.delete('crm_session')
      return NextResponse.json({ user: null })
    }
  } catch (error: any) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}


