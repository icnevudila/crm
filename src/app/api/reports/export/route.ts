import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import ReportsPDF from '@/components/pdf/ReportsPDF'

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

    // ✅ PDF Export - @react-pdf/renderer ile
    if (format === 'pdf') {
      try {
        const ReportsPDFComponent = ReportsPDF as React.ComponentType<{
          reports: any[]
          filters?: {
            startDate?: string
            endDate?: string
            module?: string
            userId?: string
          }
        }>
        
        const pdfElement = React.createElement(ReportsPDFComponent, {
          reports: reports || [],
          filters: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            module: reportModule || undefined,
            userId: userId || undefined,
          },
        })
        
        const pdfBuffer = await renderToBuffer(pdfElement)
        
        return new NextResponse(pdfBuffer as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="rapor_${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        })
      } catch (pdfError: any) {
        console.error('PDF generation error:', pdfError)
        return NextResponse.json(
          { error: 'PDF oluşturulamadı', message: pdfError?.message },
          { status: 500 }
        )
      }
    }
    
    // Format tanınmıyor
    return NextResponse.json(
      { error: 'Geçersiz format. Desteklenen formatlar: excel, csv, pdf' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export reports' },
      { status: 500 }
    )
  }
}



        
        const pdfElement = React.createElement(ReportsPDFComponent, {
          reports: reports || [],
          filters: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            module: reportModule || undefined,
            userId: userId || undefined,
          },
        })
        
        const pdfBuffer = await renderToBuffer(pdfElement)
        
        return new NextResponse(pdfBuffer as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="rapor_${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        })
      } catch (pdfError: any) {
        console.error('PDF generation error:', pdfError)
        return NextResponse.json(
          { error: 'PDF oluşturulamadı', message: pdfError?.message },
          { status: 500 }
        )
      }
    }
    
    // Format tanınmıyor
    return NextResponse.json(
      { error: 'Geçersiz format. Desteklenen formatlar: excel, csv, pdf' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export reports' },
      { status: 500 }
    )
  }
}


