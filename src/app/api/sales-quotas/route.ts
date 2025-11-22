import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period')
    const year = searchParams.get('year')

    let query = supabase
      .from('SalesQuota')
      .select(`
        id, period,
        targetAmount, achievedAmount,
        createdAt, startDate, endDate,
        userId, companyId,
        user:User!SalesQuota_userId_fkey(id, name, email, role)
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (userId) query = query.eq('userId', userId)
    if (period) query = query.eq('period', period)
    // year filtresi kaldırıldı - veritabanında year kolonu yok
    
    // Search parametresi varsa kullanıcı adında ara - database query'de uygula
    const search = searchParams.get('search')
    if (search) {
      // Kullanıcı adında arama yapmak için User tablosuna join ile filtreleme
      // Supabase'de join ile arama için subquery kullanıyoruz
      // Önce userId'leri bul (User.name'de arama yaparak)
      const { data: matchingUsers } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', session.user.companyId)
        .ilike('name', `%${search}%`)
      
      if (matchingUsers && matchingUsers.length > 0) {
        const userIds = matchingUsers.map(u => u.id)
        query = query.in('userId', userIds)
      } else {
        // Eşleşen kullanıcı yoksa boş sonuç döndür
        return NextResponse.json([])
      }
    }

    const { data, error } = await query

    if (error) throw error

      // API response'unu component'lerin beklediği formata transform et
    const transformedData = (data || []).map((quota: any) => {
      const targetAmount = quota.targetAmount || 0
      const achievedAmount = quota.achievedAmount || 0
      const achievement = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0
      
      return {
        id: quota.id,
        userId: quota.userId,
        period: quota.period,
        targetRevenue: targetAmount,
        actualRevenue: achievedAmount,
        achievement: Number(achievement.toFixed(2)),
        startDate: quota.startDate || new Date().toISOString(),
        endDate: quota.endDate || new Date().toISOString(),
        user: quota.user,
        createdAt: quota.createdAt,
      }
    })

    return NextResponse.json(transformedData)
  } catch (error: any) {
    console.error('Sales quotas fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales quotas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Component'ten gelen alanları veritabanı alanlarına map et
    const insertData: any = {
      companyId: session.user.companyId,
    }

    // Component'ler targetRevenue gönderiyor, DB targetAmount bekliyor
    if (body.targetRevenue !== undefined) {
      insertData.targetAmount = body.targetRevenue
    }
    if (body.actualRevenue !== undefined) {
      insertData.achievedAmount = body.actualRevenue
    }
    // achievementPercent kolonu yok - hesaplanacak
    if (body.userId !== undefined) insertData.userId = body.userId
    if (body.period !== undefined) insertData.period = body.period
    if (body.startDate !== undefined) insertData.startDate = body.startDate
    if (body.endDate !== undefined) insertData.endDate = body.endDate

    // Validation
    if (!insertData.userId || !insertData.period || !insertData.targetAmount) {
      return NextResponse.json(
        { error: 'UserId, period, and targetRevenue are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('SalesQuota')
      .insert(insertData)
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
      action: 'CREATE',
      entityType: 'SalesQuota',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Created sales quota for ${data.period} ${yearFromDate}`,
      meta: { quotaId: data.id, targetUserId: data.userId },
    })

    // Notification - Kullanıcıya ve Admin/Sales rollere bildirim gönder
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      const userName = data.user?.name || 'Kullanıcı'
      const periodLabel = data.period === 'MONTHLY' ? 'Aylık' : data.period === 'QUARTERLY' ? 'Çeyreklik' : 'Yıllık'
      
      // year bilgisini startDate'den hesapla
      const yearFromDate = data.startDate ? new Date(data.startDate).getFullYear() : ''
      
      // Kullanıcıya bildirim (quota atanan kullanıcı)
      if (data.userId) {
        await supabase.from('Notification').insert({
          userId: data.userId,
          companyId: session.user.companyId,
          title: '🎯 Yeni Satış Kotası Atandı',
          message: `${userName} için ${periodLabel} ${yearFromDate} satış kotası oluşturuldu. Hedef: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.targetAmount || 0)}`,
          type: 'info',
          relatedTo: 'SalesQuota',
          relatedId: data.id,
          link: `/tr/sales-quotas/${data.id}`,
          priority: 'normal',
        }).catch(() => {}) // Notification hatası ana işlemi engellemez
      }

      // Admin/Sales rollere bildirim
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: '📊 Yeni Satış Kotası Oluşturuldu',
        message: `${userName} için ${periodLabel} ${yearFromDate} satış kotası oluşturuldu.`,
        type: 'info',
        relatedTo: 'SalesQuota',
        relatedId: data.id,
        link: `/tr/sales-quotas/${data.id}`,
      }).catch(() => {}) // Notification hatası ana işlemi engellemez
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

    return NextResponse.json(transformedData, { status: 201 })
  } catch (error: any) {
    console.error('Sales quota create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create sales quota' },
      { status: 500 }
    )
  }
}



