import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || ''
    const search = searchParams.get('search') || ''

    const supabase = getSupabaseWithServiceRole()
    
    // Tüm kolonları seç
    const selectFields = 'id, type, amount, relatedTo, companyId, createdAt, updatedAt, relatedId, category, description, customerCompanyId, relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring, CustomerCompany:customerCompanyId(id, name)'
    
    // Query oluştur
    let query = supabase
      .from('Finance')
      .select(selectFields)
      .order('createdAt', { ascending: false })
      .limit(10000) // Export için daha fazla kayıt
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }

    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
    }

    // Arama filtresi
    if (search) {
      query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    const { data: financeRecords, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch finance records' },
        { status: 500 }
      )
    }

    if (!financeRecords || financeRecords.length === 0) {
      return NextResponse.json(
        { error: 'No finance records found' },
        { status: 404 }
      )
    }

    // Kategori etiketleri
    const categoryLabels: Record<string, string> = {
      SALARY: 'Maaş',
      RENT: 'Kira',
      UTILITIES: 'Faturalar',
      MARKETING: 'Pazarlama',
      TRAVEL: 'Seyahat',
      OFFICE_SUPPLIES: 'Ofis Malzemeleri',
      SHIPPING: 'Kargo',
      TAX: 'Vergi',
      INSURANCE: 'Sigorta',
      MAINTENANCE: 'Bakım',
      OTHER: 'Diğer',
      INVOICE_INCOME: 'Fatura Geliri',
      SERVICE: 'Hizmet Geliri',
      PRODUCT_SALE: 'Ürün Satışı',
    }

    // Export verisi hazırla
    const exportData = financeRecords.map((record: any) => ({
      'Tip': record.type === 'INCOME' ? 'Gelir' : 'Gider',
      'Tutar': record.amount || 0,
      'Kategori': record.category ? (categoryLabels[record.category] || record.category) : '-',
      'Firma': record.CustomerCompany?.name || '-',
      'Açıklama': record.description || '-',
      'İlişkili Tip': record.relatedEntityType || '-',
      'İlişkili ID': record.relatedEntityId ? record.relatedEntityId.substring(0, 8) + '...' : '-',
      'Ödeme Yöntemi': record.paymentMethod || '-',
      'Ödeme Tarihi': record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('tr-TR') : '-',
      'Tekrarlayan': record.isRecurring ? 'Evet' : 'Hayır',
      'Oluşturulma Tarihi': new Date(record.createdAt).toLocaleString('tr-TR'),
    }))

    if (format === 'excel') {
      // Excel export
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Finans')

      // Sütun genişliklerini ayarla
      const colWidths = [
        { wch: 10 }, // Tip
        { wch: 15 }, // Tutar
        { wch: 20 }, // Kategori
        { wch: 25 }, // Firma
        { wch: 30 }, // Açıklama
        { wch: 15 }, // İlişkili Tip
        { wch: 15 }, // İlişkili ID
        { wch: 15 }, // Ödeme Yöntemi
        { wch: 15 }, // Ödeme Tarihi
        { wch: 12 }, // Tekrarlayan
        { wch: 20 }, // Oluşturulma Tarihi
      ]
      worksheet['!cols'] = colWidths

      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="finans-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    if (format === 'csv') {
      // CSV export
      const headers = Object.keys(exportData[0])
      const csv = [
        headers.join(','),
        ...exportData.map((row: any) =>
          headers.map((header) => {
            const value = String(row[header] || '')
            // CSV için özel karakterleri escape et
            return `"${value.replace(/"/g, '""')}"`
          }).join(',')
        ),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="finans-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    if (format === 'pdf') {
      // PDF export (basit text-based)
      const pdfContent = `Finans Kayıtları\n\n` +
        `Toplam Kayıt: ${financeRecords.length}\n` +
        `Toplam Gelir: ${financeRecords
          .filter((r: any) => r.type === 'INCOME')
          .reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
          .toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}\n` +
        `Toplam Gider: ${financeRecords
          .filter((r: any) => r.type === 'EXPENSE')
          .reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
          .toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}\n\n` +
        financeRecords.map((record: any) =>
          `${record.type === 'INCOME' ? 'Gelir' : 'Gider'}: ${(record.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}\n` +
          `Kategori: ${record.category ? (categoryLabels[record.category] || record.category) : '-'}\n` +
          `Firma: ${record.CustomerCompany?.name || '-'}\n` +
          `Açıklama: ${record.description || '-'}\n` +
          `Tarih: ${new Date(record.createdAt).toLocaleString('tr-TR')}\n` +
          `---\n`
        ).join('\n')

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="finans-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format. Use excel, csv, or pdf' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Finance export error:', error)
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    )
  }
}

