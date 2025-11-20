import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'excel'
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Quotes'ları çek
    let query = supabase
      .from('Quote')
      .select(`
        id,
        title,
        quoteNumber,
        status,
        total,
        totalAmount,
        validUntil,
        createdAt,
        updatedAt,
        Deal:Deal(id, title),
        Company:Company(id, name)
      `)
      .order('createdAt', { ascending: false })

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: quotes, error } = await query

    if (error) {
      throw error
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ error: 'No quotes found' }, { status: 404 })
    }

    // Export data formatı
    const exportData = quotes.map((quote: any) => ({
      'Teklif No': quote.quoteNumber || quote.id.substring(0, 8),
      'Başlık': quote.title || '',
      'Durum': quote.status || '',
      'Tutar': quote.total || quote.totalAmount || 0,
      'Geçerlilik Tarihi': quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('tr-TR') : '',
      'Fırsat': quote.Deal?.title || '',
      'Firma': quote.Company?.name || '',
      'Oluşturulma': new Date(quote.createdAt).toLocaleDateString('tr-TR'),
      'Güncellenme': new Date(quote.updatedAt).toLocaleDateString('tr-TR'),
    }))

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teklifler')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="teklifler-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    if (format === 'csv') {
      const headers = Object.keys(exportData[0])
      const csv = [
        headers.join(','),
        ...exportData.map((row: any) =>
          headers.map((header) => {
            const value = String(row[header] || '')
            return `"${value.replace(/"/g, '""')}"`
          }).join(',')
        ),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="teklifler-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error: any) {
    console.error('Quote export error:', error)
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    )
  }
}

