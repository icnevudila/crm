import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import FinancialRecordPDF from '@/components/pdf/FinancialRecordPDF'

// Node.js runtime kullan (Edge Runtime desteklemiyor)
// export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Permission check
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('finance', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    // Finance kaydını çek
    let financeQuery = supabase
      .from('Finance')
      .select(`
        id,
        type,
        amount,
        category,
        description,
        paymentMethod,
        paymentDate,
        createdAt,
        updatedAt,
        companyId,
        customerCompanyId,
        CustomerCompany:customerCompanyId (
          id,
          name
        ),
        Company:companyId (
          id,
          name,
          address,
          city,
          phone,
          email
        )
      `)
      .eq('id', id)

    if (!isSuperAdmin) {
      financeQuery = financeQuery.eq('companyId', companyId)
    }

    const { data: finance, error: financeError } = await financeQuery.single()

    if (financeError || !finance) {
      return NextResponse.json(
        { error: 'Finans kaydı bulunamadı' },
        { status: 404 }
      )
    }

    // PDF oluştur
    let pdfBuffer: Buffer
    try {
      const FinancialRecordPDFComponent = FinancialRecordPDF as React.ComponentType<{ finance: any }>
      const pdfElement = React.createElement(FinancialRecordPDFComponent, { finance })
      pdfBuffer = await renderToBuffer(pdfElement)
    } catch (renderError: any) {
      console.error('PDF renderToBuffer error:', {
        message: renderError?.message,
        stack: renderError?.stack,
        financeId: finance?.id,
      })
      return NextResponse.json(
        { error: 'PDF oluşturulamadı', details: renderError?.message },
        { status: 500 }
      )
    }

    // PDF'i döndür
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="financial_record_${id.substring(0, 8)}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Finance PDF GET error:', error)
    return NextResponse.json(
      { error: error.message || 'PDF oluşturulamadı' },
      { status: 500 }
    )
  }
}

















