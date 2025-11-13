import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Supabase Auth ile logout endpoint
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('crm_session')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


