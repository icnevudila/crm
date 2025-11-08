import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const reportModule = searchParams.get('module') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')

    const companyId = session.user.companyId
    const supabase = getSupabase()

    // ActivityLog'dan raporları çek
    let query = supabase
      .from('ActivityLog')
      .select(`
        *,
        User (
          name,
          email
        )
      `)
      .eq('companyId', companyId)
      .order('createdAt', { ascending: false })
      .limit(5000)

    if (startDate) query = query.gte('createdAt', startDate)
    if (endDate) query = query.lte('createdAt', endDate)
    if (reportModule && reportModule !== 'all') query = query.eq('entity', reportModule)
    if (userId) query = query.eq('userId', userId)

    const { data: reports, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Excel/CSV için veri hazırla
    const exportData = reports?.map((report: any) => ({
      Tarih: new Date(report.createdAt).toLocaleString('tr-TR'),
      Modül: report.entity,
      İşlem: report.action,
      Açıklama: report.description,
      Kullanıcı: report.User?.name || '-',
      'Kullanıcı Email': report.User?.email || '-',
    })) || []

    if (format === 'excel' || format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Raporlar')

      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: format === 'excel' ? 'xlsx' : 'csv',
      })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            format === 'excel'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'text/csv',
          'Content-Disposition': `attachment; filename="rapor.${format === 'excel' ? 'xlsx' : 'csv'}"`,
        },
      })
    }

    // PDF için basit bir text response (PDF generation daha karmaşık)
    return NextResponse.json(
      { error: 'PDF export not implemented yet' },
      { status: 501 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export reports' },
      { status: 500 }
    )
  }
}


