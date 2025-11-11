import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * AutoGoalTracker API
 * Kullanıcının aylık hedefini ve ilerlemesini yönetir
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Kullanıcının hedefini al (User tablosunda veya ayrı bir UserGoal tablosunda)
    // Şimdilik User tablosuna monthlyGoal kolonu ekleyeceğiz (migration gerekebilir)
    // Geçici olarak localStorage kullanabiliriz veya User tablosuna kolon ekleyebiliriz
    
    // Bu ayın başlangıcı
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Bu ayki PAID invoice'ların toplamı
    const { data: invoices, error: invoicesError } = await supabase
      .from('Invoice')
      .select('totalAmount, total') // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount)
      .eq('companyId', companyId)
      .eq('status', 'PAID')
      .gte('createdAt', monthStart.toISOString())

    // DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount)
    const currentProgress = invoices?.reduce((sum: number, inv: any) => sum + (inv?.totalAmount || inv?.total || 0), 0) || 0

    // Kullanıcının hedefini al (User tablosundan - eğer kolon varsa)
    // Şimdilik varsayılan olarak 0 döndürüyoruz
    // Migration ile User tablosuna monthlyGoal kolonu eklenebilir
    const monthlyGoal = 0 // TODO: User tablosundan al

    const percentage = monthlyGoal > 0 ? Math.min(100, (currentProgress / monthlyGoal) * 100) : 0

    return NextResponse.json({
      monthlyGoal,
      currentProgress,
      percentage,
    })
  } catch (error: any) {
    console.error('Goal Tracker API error:', error)
    return NextResponse.json(
      {
        monthlyGoal: 0,
        currentProgress: 0,
        percentage: 0,
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 200 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const monthlyGoal = parseFloat(body.monthlyGoal) || 0

    if (monthlyGoal < 0) {
      return NextResponse.json(
        { error: 'Hedef 0\'dan küçük olamaz' },
        { status: 400 }
      )
    }

    // TODO: User tablosuna monthlyGoal kolonu eklenmeli
    // Şimdilik localStorage veya ayrı bir UserGoal tablosu kullanılabilir
    // Geçici olarak başarılı dönüyoruz
    return NextResponse.json({
      monthlyGoal,
      message: 'Hedef güncellendi (User tablosuna kolon eklenmeli)',
    })
  } catch (error: any) {
    console.error('Goal Tracker POST API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update goal' },
      { status: 500 }
    )
  }
}













