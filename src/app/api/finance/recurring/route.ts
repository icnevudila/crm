import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Tekrarlayan giderleri kontrol et ve oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Tekrarlayan giderleri çek (recurring = true olanlar)
    // NOT: Finance tablosunda recurring kolonu yoksa, bu özellik eklenebilir
    // Şimdilik relatedTo kolonunda "RECURRING:" prefix'i ile işaretlenebilir
    
    // Bu ay oluşturulmuş tekrarlayan giderleri kontrol et
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Tekrarlayan giderleri bul (relatedTo = 'RECURRING:*' formatında)
    let recurringQuery = supabase
      .from('Finance')
      .select('id, type, amount, category, description, relatedTo, createdAt')
      .like('relatedTo', 'RECURRING:%')
      .eq('type', 'EXPENSE')
      .gte('createdAt', firstDayOfMonth.toISOString())
      .lte('createdAt', lastDayOfMonth.toISOString())
    
    if (!isSuperAdmin) {
      recurringQuery = recurringQuery.eq('companyId', companyId)
    }

    const { data: thisMonthRecurring, error: recurringError } = await recurringQuery

    if (recurringError) {
      return NextResponse.json(
        { error: recurringError.message || 'Failed to fetch recurring expenses' },
        { status: 500 }
      )
    }

    // Tüm tekrarlayan giderleri çek (template'ler)
    let allRecurringQuery = supabase
      .from('Finance')
      .select('id, type, amount, category, description, relatedTo, customerCompanyId, companyId')
      .like('relatedTo', 'RECURRING:%')
      .eq('type', 'EXPENSE')
    
    if (!isSuperAdmin) {
      allRecurringQuery = allRecurringQuery.eq('companyId', companyId)
    }

    const { data: allRecurring, error: allRecurringError } = await allRecurringQuery

    if (allRecurringError) {
      return NextResponse.json(
        { error: allRecurringError.message || 'Failed to fetch all recurring expenses' },
        { status: 500 }
      )
    }

    if (!allRecurring || allRecurring.length === 0) {
      return NextResponse.json({
        message: 'No recurring expenses found',
        created: 0,
        skipped: 0,
      })
    }

    // Bu ay oluşturulmamış tekrarlayan giderleri bul
    const thisMonthRecurringIds = new Set((thisMonthRecurring || []).map((r: any) => r.relatedTo))
    const expensesToCreate: any[] = []

    for (const recurring of allRecurring) {
      // Bu ay oluşturulmamışsa ekle
      if (!thisMonthRecurringIds.has(recurring.relatedTo)) {
        expensesToCreate.push({
          type: 'EXPENSE',
          amount: recurring.amount,
          category: recurring.category,
          description: recurring.description || `Tekrarlayan gider: ${recurring.relatedTo}`,
          relatedTo: recurring.relatedTo, // Aynı relatedTo ile işaretle
          companyId: recurring.companyId,
          customerCompanyId: recurring.customerCompanyId,
        })
      }
    }

    // Tekrarlayan giderleri oluştur
    let createdCount = 0
    if (expensesToCreate.length > 0) {
      const { data: createdExpenses, error: createError } = await supabase
        .from('Finance')
        // @ts-expect-error - Supabase database type tanımları eksik
        .insert(expensesToCreate)
        .select()

      if (createError) {
        return NextResponse.json(
          { error: createError.message || 'Failed to create recurring expenses' },
          { status: 500 }
        )
      }

      createdCount = createdExpenses?.length || 0

      // ActivityLog kayıtları oluştur
      if (createdExpenses && createdExpenses.length > 0) {
        const activityLogs = createdExpenses.map((expense: any) => ({
          entity: 'Finance',
          action: 'CREATE',
          description: `Tekrarlayan gider oluşturuldu: ${expense.description || expense.relatedTo}`,
          meta: { 
            entity: 'Finance', 
            action: 'create', 
            id: expense.id, 
            recurring: true,
            relatedTo: expense.relatedTo,
          },
          userId: session.user.id,
          companyId: expense.companyId,
        }))

        await supabase.from('ActivityLog').insert(activityLogs)
      }
    }

    return NextResponse.json({
      message: 'Recurring expenses processed',
      totalRecurring: allRecurring.length,
      created: createdCount,
      skipped: allRecurring.length - createdCount,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process recurring expenses' },
      { status: 500 }
    )
  }
}











