import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Dosya tipi kontrolü
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file' },
        { status: 400 }
      )
    }

    // Dosyayı oku
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Verileri işle ve import et
    const customers = data.map((row: any) => {
      // Excel/CSV sütun isimlerini normalize et
      const name = row['Müşteri Adı'] || row['Name'] || row['name'] || row['Müşteri'] || ''
      const email = row['E-posta'] || row['Email'] || row['email'] || ''
      const phone = row['Telefon'] || row['Phone'] || row['phone'] || ''
      const city = row['Şehir'] || row['City'] || row['city'] || ''
      const sector = row['Sektör'] || row['Sector'] || row['sector'] || ''
      const status = row['Durum'] || row['Status'] || row['status'] || 'ACTIVE'

      return {
        name,
        email: email || null,
        phone: phone || null,
        city: city || null,
        sector: sector || null,
        status: status === 'Aktif' || status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        companyId: session.user.companyId,
      }
    }).filter((c: any) => c.name) // İsimsiz kayıtları filtrele

    if (customers.length === 0) {
      return NextResponse.json({ error: 'No valid customers found in file' }, { status: 400 })
    }

    // Toplu insert
    const { data: inserted, error } = await supabase
      .from('Customer')
      // @ts-expect-error - Supabase type system is too strict for dynamic inserts
      .insert(customers)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Customer',
          action: 'BULK_IMPORT',
          description: `${customers.length} müşteri toplu olarak import edildi`,
          meta: { entity: 'Customer', action: 'bulk_import', count: customers.length, fileName: file.name },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', activityError)
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: inserted?.length || customers.length,
      totalRows: data.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to import customers' },
      { status: 500 }
    )
  }
}

