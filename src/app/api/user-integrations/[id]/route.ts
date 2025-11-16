import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-supabase'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import { z } from 'zod'

// Cache strategy
export const revalidate = 60

// Validation schema
const updateUserIntegrationSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional(),
  lastError: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
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
      .eq('id', id)

    // RLS kontrolü
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId).eq('userId', session.user.id)
    }

    const { data: integration, error } = await query.single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!integration) {
      return NextResponse.json({ error: 'Entegrasyon bulunamadı' }, { status: 404 })
    }

    // ActivityLog'ları çek
    const { data: activities } = await supabase
      .from('ActivityLog')
      .select('*')
      .eq('entity', 'UserIntegration')
      .eq('meta->>integrationId', id)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...integration,
      activities: activities || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Entegrasyon getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Validation
    const validatedData = updateUserIntegrationSchema.parse(body)

    const supabase = getSupabaseWithServiceRole()

    // Mevcut entegrasyonu kontrol et
    const { data: existing, error: fetchError } = await supabase
      .from('UserIntegration')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Entegrasyon bulunamadı' }, { status: 404 })
    }

    // RLS kontrolü - kullanıcı sadece kendi entegrasyonlarını güncelleyebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin) {
      if (existing.companyId !== session.user.companyId || existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {}
    if (validatedData.accessToken !== undefined) updateData.accessToken = validatedData.accessToken
    if (validatedData.refreshToken !== undefined) updateData.refreshToken = validatedData.refreshToken
    if (validatedData.tokenExpiresAt !== undefined) {
      updateData.tokenExpiresAt = validatedData.tokenExpiresAt 
        ? new Date(validatedData.tokenExpiresAt).toISOString() 
        : null
    }
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.lastError !== undefined) updateData.lastError = validatedData.lastError

    // Güncelle
    const { data: updated, error } = await supabase
      .from('UserIntegration')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog (trigger otomatik oluşturur ama manuel de ekleyebiliriz)
    try {
      const changes: string[] = []
      if (validatedData.status && existing.status !== validatedData.status) {
        changes.push(`Status: ${existing.status} → ${validatedData.status}`)
      }
      if (validatedData.accessToken && existing.accessToken !== validatedData.accessToken) {
        changes.push('Token yenilendi')
      }

      if (changes.length > 0) {
        await logAction({
          entity: 'UserIntegration',
          action: 'UPDATE',
          description: `Entegrasyon güncellendi: ${changes.join(', ')}`,
          meta: {
            integrationId: id,
            integrationType: existing.integrationType,
            changes,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        })
      }
    } catch (logError) {
      console.error('ActivityLog insert error:', logError)
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Entegrasyon güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const supabase = getSupabaseWithServiceRole()

    // Mevcut entegrasyonu kontrol et
    const { data: existing, error: fetchError } = await supabase
      .from('UserIntegration')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Entegrasyon bulunamadı' }, { status: 404 })
    }

    // RLS kontrolü - kullanıcı sadece kendi entegrasyonlarını silebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin) {
      if (existing.companyId !== session.user.companyId || existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Sil
    const { error } = await supabase
      .from('UserIntegration')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    try {
      await logAction({
        entity: 'UserIntegration',
        action: 'DELETE',
        description: `Entegrasyon silindi: ${existing.integrationType}`,
        meta: {
          integrationId: id,
          integrationType: existing.integrationType,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    } catch (logError) {
      console.error('ActivityLog insert error:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Entegrasyon silinemedi' },
      { status: 500 }
    )
  }
}





