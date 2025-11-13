import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-supabase'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
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

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // User'ı çek
    let userQuery = supabase
      .from('User')
      .select('*')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      userQuery = userQuery.eq('companyId', companyId)
    }
    
    const { data: user, error } = await userQuery.single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('entity', 'User')
      .eq('meta->>id', id)
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(user as any),
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Kullanıcı bilgileri getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
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

    // Kullanıcı kendi profilini güncelleyebilir veya SUPER_ADMIN herkesi güncelleyebilir
    const canUpdate = session.user.id === id || session.user.role === 'SUPER_ADMIN'

    if (!canUpdate) {
      return buildPermissionDeniedResponse('Sadece kendi profilinizi güncelleyebilirsiniz veya SuperAdmin olmalısınız.')
    }

    const supabase = getSupabaseWithServiceRole()

    // Kullanıcının aynı şirkette olduğunu kontrol et
    const { data: existingUser, error: userError } = await supabase
      .from('User')
      .select('id, companyId')
      .eq('id', id)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Kullanıcı sadece kendi şirketindeki kullanıcıları güncelleyebilir (SUPER_ADMIN hariç)
    if (session.user.role !== 'SUPER_ADMIN' && (existingUser as any)?.companyId !== session.user.companyId) {
      return buildPermissionDeniedResponse('Kendi şirketiniz dışındaki bir kullanıcıyı güncelleyemezsiniz.')
    }

    // Şifre varsa hash'le (ama profil güncellemelerinde şifre göndermeyelim, ayrı endpoint var)
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10)
    } else {
      delete body.password // Şifre güncellenmediyse mevcut şifreyi koru
    }

    // Email değiştirilemez (güvenlik için)
    delete body.email

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (body.name) updateData.name = body.name
    if (body.role && session.user.role === 'SUPER_ADMIN') updateData.role = body.role
    if (body.password) updateData.password = body.password
    if (body.image !== undefined) updateData.image = body.image

    // Kullanıcıyı güncelle
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update(updateData)
      .eq('id', id)
      .eq('companyId', (existingUser as any)?.companyId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Kullanıcı güncellenemedi' },
        { status: 500 }
      )
    }

    // ActivityLog
    await logAction({
      entity: 'User',
      action: 'UPDATE',
      description: `Kullanıcı bilgileri güncellendi: ${updateData.name || ''}`,
      meta: { entity: 'User', action: 'update', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kullanıcı güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const session = await getServerSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Oturum bilgisi alınamadı' },
        { status: 401 }
      )
    }

    if (!session?.user?.companyId || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Kendi hesabını silmeyi engelle
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Kullanıcıyı sil
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Kullanıcı silinemedi' },
        { status: 500 }
      )
    }

    // ActivityLog
    await logAction({
      entity: 'User',
      action: 'DELETE',
      description: `Kullanıcı silindi: ${id}`,
      meta: { entity: 'User', action: 'delete', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kullanıcı silinemedi' },
      { status: 500 }
    )
  }
}
