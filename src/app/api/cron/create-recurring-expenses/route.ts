import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Vercel Cron Job: Tekrarlayan giderleri aylık oluştur
// Her ayın 1'inde çalışır (saat 00:00 UTC)
export async function GET(request: Request) {
  try {
    // Vercel Cron Job secret kontrolü
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Bu ay oluşturulmuş tekrarlayan giderleri kontrol et
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Tüm şirketler için tekrarlayan giderleri çek (isRecurring = true olanlar)
    const { data: allRecurring, error: allRecurringError } = await supabase
      .from('Finance')
      .select('id, type, amount, category, description, relatedTo, customerCompanyId, companyId, isRecurring')
      .eq('type', 'EXPENSE')
      .eq('isRecurring', true)

    if (allRecurringError) {
      return NextResponse.json(
        { error: allRecurringError.message || 'Failed to fetch recurring expenses' },
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

    // Bu ay oluşturulmuş tekrarlayan giderleri kontrol et
    const { data: thisMonthRecurring, error: thisMonthError } = await supabase
      .from('Finance')
      .select('id, relatedEntityId, relatedEntityType, companyId')
      .eq('type', 'EXPENSE')
      .eq('isRecurring', true)
      .gte('createdAt', firstDayOfMonth.toISOString())
      .lte('createdAt', lastDayOfMonth.toISOString())

    if (thisMonthError) {
      return NextResponse.json(
        { error: thisMonthError.message || 'Failed to fetch this month recurring expenses' },
        { status: 500 }
      )
    }

    // Bu ay oluşturulmuş tekrarlayan giderlerin ID'lerini topla (duplicate önleme)
    const thisMonthRecurringIds = new Set(
      (thisMonthRecurring || []).map((r: any) => r.relatedEntityId || r.id)
    )

    // Şirket bazlı grupla (aynı şirket için aynı giderden sadece 1 tane oluştur)
    const expensesByCompany = new Map<string, any[]>()

    for (const recurring of allRecurring) {
      // Bu ay oluşturulmamışsa ekle
      const recurringId = (recurring as any).relatedEntityId || recurring.id
      if (!thisMonthRecurringIds.has(recurringId)) {
        const companyId = recurring.companyId
        if (!expensesByCompany.has(companyId)) {
          expensesByCompany.set(companyId, [])
        }
        expensesByCompany.get(companyId)!.push({
          type: 'EXPENSE',
          amount: recurring.amount,
          category: recurring.category,
          description: recurring.description || `Tekrarlayan gider: ${recurring.relatedTo || 'Aylık Gider'}`,
          relatedTo: recurring.relatedTo,
          relatedEntityType: 'RECURRING',
          relatedEntityId: recurring.id, // Orijinal giderin ID'si
          companyId: recurring.companyId,
          customerCompanyId: recurring.customerCompanyId,
          isRecurring: false, // Yeni oluşturulan kayıt tekrarlayan değil (template'ten türetildi)
          paymentDate: new Date().toISOString().split('T')[0], // Bugünün tarihi
        })
      }
    }

    // Tüm şirketler için tekrarlayan giderleri oluştur
    let totalCreated = 0
    const results: any[] = []

    for (const [companyId, expenses] of expensesByCompany.entries()) {
      if (expenses.length > 0) {
        const { data: createdExpenses, error: createError } = await supabase
          .from('Finance')
          // @ts-expect-error - Supabase database type tanımları eksik
          .insert(expenses)
          .select()

        if (createError) {
          results.push({
            companyId,
            error: createError.message,
            created: 0,
          })
        } else {
          totalCreated += createdExpenses?.length || 0

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
                fromRecurringId: expense.relatedEntityId,
              },
              userId: null, // Cron job - kullanıcı yok
              companyId: expense.companyId,
            }))

            await supabase.from('ActivityLog').insert(activityLogs)
          }

          results.push({
            companyId,
            created: createdExpenses?.length || 0,
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Recurring expenses processed',
      totalRecurring: allRecurring.length,
      created: totalCreated,
      skipped: allRecurring.length - totalCreated,
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process recurring expenses' },
      { status: 500 }
    )
  }
}










