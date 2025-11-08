import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Session kontrolü
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const status = searchParams.get('status') || ''

    // Query builder
    let query = supabase
      .from('Meeting')
      .select(`
        id,
        title,
        description,
        meetingDate,
        meetingDuration,
        location,
        status,
        companyId,
        customerId,
        dealId,
        createdBy,
        createdAt,
        Customer:Customer(id, name, email),
        Deal:Deal(id, title),
        CreatedBy:User!Meeting_createdBy_fkey(id, name, email),
        Company:Company(id, name)
      `)
      .order('meetingDate', { ascending: false })

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('meetingDate', dateFrom)
    }
    if (dateTo) {
      query = query.lte('meetingDate', dateTo)
    }

    const { data: meetings, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    // Her görüşme için gider bilgilerini çek
    const meetingsWithExpenses = await Promise.all(
      (meetings || []).map(async (meeting: any) => {
        const { data: expenses } = await supabase
          .from('Finance')
          .select('amount, description')
          .eq('relatedTo', 'Meeting')
          .eq('relatedId', meeting.id)
          .eq('type', 'EXPENSE')

        const totalExpense = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0) || 0

        return {
          ...meeting,
          totalExpense,
        }
      })
    )

    // Excel/CSV formatı için basit CSV oluştur
    if (format === 'excel' || format === 'csv') {
      const headers = ['Tarih', 'Başlık', 'Firma', 'Müşteri', 'Durum', 'Gider', 'Oluşturan']
      const rows = meetingsWithExpenses.map((m: any) => [
        new Date(m.meetingDate).toLocaleDateString('tr-TR'),
        m.title || '',
        m.Company?.name || '',
        m.Customer?.name || '',
        m.status || '',
        m.totalExpense || 0,
        m.CreatedBy?.name || '',
      ])

      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
          'Content-Disposition': `attachment; filename="gorusmeler.${format === 'excel' ? 'csv' : 'csv'}"`,
        },
      })
    }

    // PDF formatı için JSON döndür (frontend'de PDF oluşturulacak)
    return NextResponse.json(meetingsWithExpenses)
  } catch (error: any) {
    console.error('Meetings export API exception:', error)
    return NextResponse.json(
      { error: 'Failed to export meetings', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

