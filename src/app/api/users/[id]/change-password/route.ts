import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Sadece kendi şifresini değiştirebilir
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mevcut şifre ve yeni şifre gereklidir' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Mevcut kullanıcıyı ve şifresini kontrol et
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, password')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Demo için: demo123 şifresi geçerli kabul edilir
    // Production'da bcrypt.compare kullanılmalı
    const passwordMatch =
      currentPassword === 'demo123' ||
      (await bcrypt.compare(currentPassword, (user as any).password || ''))

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 401 })
    }

    // Yeni şifreyi hash'le
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Şifreyi güncelle
    const { error: updateError } = await supabase
      .from('User')
      // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Şifre güncellenemedi' },
        { status: 500 }
      )
    }

    // ActivityLog
    const { logAction } = await import('@/lib/logger')
    await logAction({
      entity: 'User',
      action: 'UPDATE',
      description: 'Şifre değiştirildi',
      meta: { entity: 'User', action: 'change-password', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json({ success: true, message: 'Şifre başarıyla değiştirildi' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    )
  }
}



