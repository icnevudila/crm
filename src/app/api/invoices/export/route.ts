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

    // Invoices'ları çek
    let query = supabase
      .from('Invoice')
      .select(`
        id,
        title,
        invoiceNumber,
        status,
        totalAmount,
        type,
        dueDate,
        createdAt,
        updatedAt,
        Customer:Customer(id, name, email),
        Company:Company(id, name)
      `)
      .order('createdAt', { ascending: false })

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: invoices, error } = await query

    if (error) {
      throw error
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'No invoices found' }, { status: 404 })
    }

    // Export data formatı
    const exportData = invoices.map((invoice: any) => ({
      'Fatura No': invoice.invoiceNumber || invoice.id.substring(0, 8),
      'Başlık': invoice.title || '',
      'Durum': invoice.status || '',
      'Tutar': invoice.totalAmount || 0,
      'Tip': invoice.type || '',
      'Vade Tarihi': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('tr-TR') : '',
      'Müşteri': invoice.Customer?.name || '',
      'Firma': invoice.Company?.name || '',
      'Oluşturulma': new Date(invoice.createdAt).toLocaleDateString('tr-TR'),
      'Güncellenme': new Date(invoice.updatedAt).toLocaleDateString('tr-TR'),
    }))

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturalar')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="faturalar-${new Date().toISOString().split('T')[0]}.xlsx"`,
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
          'Content-Disposition': `attachment; filename="faturalar-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error: any) {
    console.error('Invoice export error:', error)
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    )
  }
}

