import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sector = searchParams.get('sector') || ''

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId

    // Tüm müşterileri çek (filtrelerle)
    let query = supabase
      .from('Customer')
      .select('*')
      .eq('companyId', companyId)
      .order('createdAt', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (sector) {
      query = query.eq('sector', sector)
    }

    const { data: customers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Excel/CSV için veri hazırla
    const exportData = customers?.map((customer: any) => ({
      'Müşteri Adı': customer.name || '',
      'E-posta': customer.email || '',
      'Telefon': customer.phone || '',
      'Şehir': customer.city || '',
      'Sektör': customer.sector || '',
      'Durum': customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif',
      'Oluşturulma': new Date(customer.createdAt).toLocaleDateString('tr-TR'),
    })) || []

    if (format === 'excel' || format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteriler')

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
          'Content-Disposition': `attachment; filename="musteriler.${format === 'excel' ? 'xlsx' : 'csv'}"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export customers' },
      { status: 500 }
    )
  }
}





