import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase, getSupabaseWithServiceRole } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // SuperAdmin veya public erişim için - singleton pattern kullan
    const supabase = session?.user?.companyId 
      ? getSupabase()
      : getSupabaseWithServiceRole()

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    let query = supabase
      .from('Company')
      .select('id, name, sector, city, phone, email, website, taxNumber, taxOffice, status, createdAt')
      .order('name')

    if (session?.user?.companyId && !isSuperAdmin) {
      query = query.eq('id', session.user.companyId)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: companies, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Type assertion - Supabase type inference sorunu için
    type CompanyRow = {
      id: string
      name: string
      sector: string | null
      city: string | null
      phone: string | null
      email: string | null
      website: string | null
      taxNumber: string | null
      taxOffice: string | null
      status: string
      createdAt: string
    }

    const companiesTyped = (companies || []) as CompanyRow[]

    if (format === 'csv') {
      // CSV export
      const headers = ['Firma Adı', 'Sektör', 'Şehir', 'Telefon', 'E-posta', 'Website', 'Vergi No', 'Vergi Dairesi', 'Durum', 'Oluşturulma']
      const rows = companiesTyped.map(c => [
        c.name || '',
        c.sector || '',
        c.city || '',
        c.phone || '',
        c.email || '',
        c.website || '',
        c.taxNumber || '',
        c.taxOffice || '',
        c.status === 'ACTIVE' ? 'Aktif' : 'Pasif',
        new Date(c.createdAt).toLocaleDateString('tr-TR')
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="firmalar.csv"`,
        },
      })
    }

    if (format === 'excel') {
      // Excel export
      const worksheetData = [
        ['Firma Adı', 'Sektör', 'Şehir', 'Telefon', 'E-posta', 'Website', 'Vergi No', 'Vergi Dairesi', 'Durum', 'Oluşturulma'],
        ...companiesTyped.map(c => [
          c.name || '',
          c.sector || '',
          c.city || '',
          c.phone || '',
          c.email || '',
          c.website || '',
          c.taxNumber || '',
          c.taxOffice || '',
          c.status === 'ACTIVE' ? 'Aktif' : 'Pasif',
          new Date(c.createdAt).toLocaleDateString('tr-TR')
        ])
      ]

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmalar')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="firmalar.xlsx"`,
        },
      })
    }

    // PDF export (basit text-based)
    const pdfContent = `Firmalar Listesi\n\n${companiesTyped.map(c => 
      `${c.name}\n` +
      `Sektör: ${c.sector || '-'}\n` +
      `Şehir: ${c.city || '-'}\n` +
      `Telefon: ${c.phone || '-'}\n` +
      `E-posta: ${c.email || '-'}\n` +
      `Durum: ${c.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}\n` +
      `---\n`
    ).join('\n')}`

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="firmalar.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    )
  }
}







