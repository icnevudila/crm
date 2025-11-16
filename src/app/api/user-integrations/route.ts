import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-supabase'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import { z } from 'zod'

// Cache strategy
export const revalidate = 60

// Validation schema
const userIntegrationSchema = z.object({
  integrationType: z.enum(['GOOGLE_CALENDAR', 'GOOGLE_EMAIL', 'MICROSOFT_CALENDAR', 'MICROSOFT_EMAIL']),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).default('INACTIVE'),
  lastError: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Oturum bilgisi alınamadı' },
        { status: 401 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const integrationType = searchParams.get('integrationType')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from('UserIntegration')
      .select(`
        *,
        User (
          id,
          name,
          email
        )
      `)
      .order('createdAt', { ascending: false })

    // RLS kontrolü - kullanıcılar sadece kendi entegrasyonlarını görebilir
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
      
      // Eğer userId parametresi varsa ve kullanıcı kendi entegrasyonlarını görüyorsa
      if (userId) {
        // Kullanıcı sadece kendi entegrasyonlarını görebilir
        if (userId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        query = query.eq('userId', userId)
      } else {
        // Kullanıcı sadece kendi entegrasyonlarını görebilir
        query = query.eq('userId', session.user.id)
      }
    } else {
      // SuperAdmin tüm entegrasyonları görebilir
      if (userId) {
        query = query.eq('userId', userId)
      }
      if (companyId) {
        query = query.eq('companyId', companyId)
      }
    }

    if (integrationType) {
      query = query.eq('integrationType', integrationType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: integrations, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(integrations || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Entegrasyon listesi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Oturum bilgisi alınamadı' },
        { status: 401 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validation
    const validatedData = userIntegrationSchema.parse(body)

    const supabase = getSupabaseWithServiceRole()

    // Kullanıcı sadece kendi entegrasyonlarını oluşturabilir
    const userId = body.userId || session.user.id
    if (userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Aynı entegrasyon tipi için zaten kayıt var mı kontrol et
    const { data: existing } = await supabase
      .from('UserIntegration')
      .select('id')
      .eq('userId', userId)
      .eq('companyId', session.user.companyId)
      .eq('integrationType', validatedData.integrationType)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Bu entegrasyon tipi için zaten bir kayıt mevcut' },
        { status: 400 }
      )
    }

    // Yeni entegrasyon oluştur
    const { data: integration, error } = await supabase
      .from('UserIntegration')
      .insert({
        userId,
        companyId: session.user.companyId,
        integrationType: validatedData.integrationType,
        accessToken: validatedData.accessToken,
        refreshToken: validatedData.refreshToken,
        tokenExpiresAt: validatedData.tokenExpiresAt ? new Date(validatedData.tokenExpiresAt).toISOString() : null,
        status: validatedData.status,
        lastError: validatedData.lastError,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog (trigger otomatik oluşturur ama manuel de ekleyebiliriz)
    try {
      await logAction({
        entity: 'UserIntegration',
        action: 'CREATE',
        description: `Yeni entegrasyon eklendi: ${validatedData.integrationType}`,
        meta: {
          integrationId: integration.id,
          integrationType: validatedData.integrationType,
          status: validatedData.status,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      console.error('ActivityLog insert error:', logError)
    }

    return NextResponse.json(integration, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Entegrasyon oluşturulamadı' },
      { status: 500 }
    )
  }
}





