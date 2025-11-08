import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import bcrypt from 'bcryptjs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Users [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // User'ı çek
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog'ları çek
    const { data: activities } = await supabase
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
      .eq('companyId', session.user.companyId)
      .eq('entity', 'User')
      .eq('meta->>id', id)
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
      { error: error.message || 'Failed to fetch user' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Users [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Kullanıcının aynı şirkette olduğunu kontrol et
    const { data: existingUser, error: userError } = await supabase
      .from('User')
      .select('id, companyId')
      .eq('id', id)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Kullanıcı sadece kendi şirketindeki kullanıcıları güncelleyebilir (SUPER_ADMIN hariç)
    if (session.user.role !== 'SUPER_ADMIN' && (existingUser as any)?.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        { error: updateError.message || 'Failed to update user' },
        { status: 500 }
      )
    }

    // ActivityLog
    await logAction({
      entity: 'User',
      action: 'UPDATE',
      description: `Kullanıcı güncellendi: ${updateData.name || id}`,
      meta: { entity: 'User', action: 'update', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Users [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
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
        { error: deleteError.message || 'Failed to delete user' },
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
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
