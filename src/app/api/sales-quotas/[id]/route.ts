import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { id } = await params

    const { data, error } = await supabase
      .from('SalesQuota')
      .select(`
        id, period,
        targetAmount, achievedAmount,
        createdAt, updatedAt, startDate, endDate,
        userId, companyId,
        user:User!SalesQuota_userId_fkey(id, name, email, role)
      `)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sales quota not found' }, { status: 404 })
      }
      throw error
    }

    // Tarih aralığını hesapla
    const startDate = data.startDate || new Date().toISOString()
    const endDate = data.endDate || new Date().toISOString()

    // İlgili Deal'ları çek (WON status, quota tarih aralığında, assignedTo = userId)
    const { data: relatedDeals } = await supabase
      .from('Deal')
      .select('id, title, value, stage, status, createdAt, customer:Customer!Deal_customerId_fkey(id, name)')
      .eq('assignedTo', data.userId)
      .eq('status', 'WON')
      .gte('createdAt', startDate)
      .lte('createdAt', endDate)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(50)

    // İlgili Invoice'ları çek (PAID status, quota tarih aralığında, assignedTo = userId)
    const { data: relatedInvoices } = await supabase
      .from('Invoice')
      .select('id, title, invoiceNumber, totalAmount, status, createdAt, customer:Customer!Invoice_customerId_fkey(id, name)')
      .eq('assignedTo', data.userId)
      .eq('status', 'PAID')
      .gte('createdAt', startDate)
      .lte('createdAt', endDate)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(50)

    // API response'unu component'lerin beklediği formata transform et
    const targetAmount = data.targetAmount || 0
    const achievedAmount = data.achievedAmount || 0
    const achievement = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0
    
    const transformedData = {
      id: data.id,
      userId: data.userId,
      period: data.period,
      targetRevenue: targetAmount,
      actualRevenue: achievedAmount,
      achievement: Number(achievement.toFixed(2)),
      startDate,
      endDate,
      user: data.user,
      createdAt: data.createdAt,
      relatedDeals: relatedDeals || [],
      relatedInvoices: relatedInvoices || [],
      ...data, // Diğer alanları da ekle
    }

    return NextResponse.json(transformedData)
  } catch (error: any) {
    console.error('Sales quota fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales quota' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()
    const { id } = await params

    // Check if quota exists - mevcut achievement'ı da al (bildirim için)
    const { data: existing } = await supabase
      .from('SalesQuota')
      .select('id, targetAmount, achievedAmount, userId, period, startDate, user:User!SalesQuota_userId_fkey(id, name)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sales quota not found' }, { status: 404 })
    }

    const oldTargetAmount = existing.targetAmount || 0
    const oldAchievedAmount = existing.achievedAmount || 0
    const oldAchievement = oldTargetAmount > 0 ? (oldAchievedAmount / oldTargetAmount) * 100 : 0

    // Component'ten gelen alanları veritabanı alanlarına map et
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    // Component'ler targetRevenue gönderiyor, DB targetAmount bekliyor
    if (body.targetRevenue !== undefined) updateData.targetAmount = body.targetRevenue
    if (body.actualRevenue !== undefined) updateData.achievedAmount = body.actualRevenue
    // achievementPercent kolonu yok - hesaplanacak
    if (body.userId !== undefined) updateData.userId = body.userId
    if (body.period !== undefined) updateData.period = body.period
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate

    const { data, error } = await supabase
      .from('SalesQuota')
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select(`
        id, period,
        targetAmount, achievedAmount,
        createdAt, updatedAt, startDate, endDate,
        userId, companyId,
        user:User!SalesQuota_userId_fkey(id, name, email, role)
      `)
      .single()

    if (error) throw error

    // Activity Log - year bilgisini startDate'den hesapla
    const yearFromDate = data.startDate ? new Date(data.startDate).getFullYear() : ''
    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'SalesQuota',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated sales quota for ${data.period} ${yearFromDate}`,
      meta: { quotaId: data.id, changes: body },
    })

    // Notification - Achievement %100'e ulaştığında özel bildirim
    const newTargetAmount = data.targetAmount || 0
    const newAchievedAmount = data.achievedAmount || 0
    const newAchievement = newTargetAmount > 0 ? (newAchievedAmount / newTargetAmount) * 100 : 0
    const achievementReached100 = oldAchievement < 100 && newAchievement >= 100

    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      const userName = data.user?.name || existing.user?.name || 'Kullanıcı'
      const periodLabel = data.period === 'MONTHLY' ? 'Aylık' : data.period === 'QUARTERLY' ? 'Çeyreklik' : 'Yıllık'
      // year bilgisini startDate'den hesapla
      const yearFromDate = data.startDate ? new Date(data.startDate).getFullYear() : ''

      if (achievementReached100) {
        // %100 başarıya ulaşıldı - Success bildirimi
        // Kullanıcıya bildirim
        if (data.userId) {
          await supabase.from('Notification').insert({
            userId: data.userId,
            companyId: session.user.companyId,
            title: '🎉 Satış Kotası %100 Başarıya Ulaştı!',
            message: `Tebrikler! ${periodLabel} ${yearFromDate} satış kotanız %100 başarıya ulaştı.`,
            type: 'success',
            relatedTo: 'SalesQuota',
            relatedId: data.id,
            link: `/tr/sales-quotas/${data.id}`,
            priority: 'high',
          }).catch(() => {})
        }

        // Admin/Sales rollere bildirim
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: '🎉 Satış Kotası %100 Başarıya Ulaştı',
          message: `${userName} için ${periodLabel} ${yearFromDate} satış kotası %100 başarıya ulaştı!`,
          type: 'success',
          priority: 'high',
          relatedTo: 'SalesQuota',
          relatedId: data.id,
          link: `/tr/sales-quotas/${data.id}`,
        }).catch(() => {})
      } else {
        // Normal güncelleme - Kullanıcıya info bildirimi
        if (data.userId && session.user.id !== data.userId) {
          // Sadece başka biri güncelliyorsa bildirim gönder
          await supabase.from('Notification').insert({
            userId: data.userId,
            companyId: session.user.companyId,
            title: '📊 Satış Kotası Güncellendi',
            message: `${periodLabel} ${yearFromDate} satış kotanız güncellendi. Başarı oranı: ${newAchievement.toFixed(1)}%`,
            type: 'info',
            relatedTo: 'SalesQuota',
            relatedId: data.id,
            link: `/tr/sales-quotas/${data.id}`,
            priority: 'normal',
          }).catch(() => {})
        }
      }
    } catch (notificationError) {
      // Notification hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('Sales quota notification error (non-critical):', notificationError)
      }
    }

    // Response'u component formatına transform et
    const targetAmount = data.targetAmount || 0
    const achievedAmount = data.achievedAmount || 0
    const achievement = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0
    
    const transformedData = {
      id: data.id,
      userId: data.userId,
      period: data.period,
      targetRevenue: targetAmount,
      actualRevenue: achievedAmount,
      achievement: Number(achievement.toFixed(2)),
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),
      user: data.user,
      createdAt: data.createdAt,
      ...data,
    }

    return NextResponse.json(transformedData)
  } catch (error: any) {
    console.error('Sales quota update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update sales quota' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { id } = await params

    // Check if quota exists - kullanıcı bilgisini de al
    const { data: existing } = await supabase
      .from('SalesQuota')
      .select('id, period, startDate, userId, user:User!SalesQuota_userId_fkey(id, name)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sales quota not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('SalesQuota')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log - year bilgisini startDate'den hesapla
    const yearFromDate = existing.startDate ? new Date(existing.startDate).getFullYear() : ''
    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'SalesQuota',
      entityId: id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted sales quota for ${existing.period} ${yearFromDate}`,
      meta: { quotaId: id },
    })

    // Notification - Kullanıcıya ve Admin/Sales rollere bildirim
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      const userName = existing.user?.name || 'Kullanıcı'
      const periodLabel = existing.period === 'MONTHLY' ? 'Aylık' : existing.period === 'QUARTERLY' ? 'Çeyreklik' : 'Yıllık'

      // Kullanıcıya bildirim (quota silinen kullanıcı)
      if (existing.userId) {
        await supabase.from('Notification').insert({
          userId: existing.userId,
          companyId: session.user.companyId,
          title: '🗑️ Satış Kotası Silindi',
          message: `${periodLabel} ${yearFromDate} satış kotanız silindi.`,
          type: 'warning',
          relatedTo: 'SalesQuota',
          relatedId: id,
          priority: 'normal',
        }).catch(() => {})
      }

      // Admin/Sales rollere bildirim
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: '🗑️ Satış Kotası Silindi',
        message: `${userName} için ${periodLabel} ${yearFromDate} satış kotası silindi.`,
        type: 'warning',
        relatedTo: 'SalesQuota',
        relatedId: id,
      }).catch(() => {})
    } catch (notificationError) {
      // Notification hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('Sales quota notification error (non-critical):', notificationError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Sales quota delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete sales quota' },
      { status: 500 }
    )
  }
}
