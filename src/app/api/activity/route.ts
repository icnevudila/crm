import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = getSupabase()

    let query = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          id,
          name,
          email
        )
      `
      )
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    // Entity filtresi
    if (entity) {
      query = query.eq('entity', entity)
    }

    // Entity ID filtresi (meta JSON içinde)
    if (entityId) {
      query = query.or(`meta->>'id'.eq.${entityId},meta->>'fromQuote'.eq.${entityId},meta->>'fromInvoice'.eq.${entityId}`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
