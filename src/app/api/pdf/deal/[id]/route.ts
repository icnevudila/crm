import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import DealRecordPDF from '@/components/pdf/DealRecordPDF'

// Edge Runtime desteklemiyor, Node.js runtime kullan
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

    // Deal'ı ilişkilerle birlikte çek
    let query = supabase
      .from('Deal')
      .select(
        `
        *,
        Customer (
          id,
          name,
          email,
          phone,
          city,
          address,
          CustomerCompany:customerCompanyId (
            id,
            name,
            address,
            city
          )
        )
      `
      )
      .eq('id', id)

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: deal, error } = await query.single()

    // Company verisini ayrı çek (InvoicePDF pattern'i ile aynı)
    let companyData = null
    if (deal) {
      try {
        // SuperAdmin için deal'ın companyId'sini kullan, değilse session'dan
        const dealCompanyId = isSuperAdmin ? (deal as any).companyId || companyId : companyId
        
        const { data: company, error: companyError } = await supabase
          .from('Company')
          .select('id, name, address, city, phone, email')
          .eq('id', dealCompanyId)
          .maybeSingle()
        
        if (!companyError && company) {
          companyData = company
        }
      } catch (companyErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Company fetch error:', companyErr)
        }
      }
    }

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found', details: error?.message }, { status: 404 })
    }

    // Deal verisini ilişkili verilerle birleştir
    const dealData = {
      ...deal,
      Company: companyData || {},
      Customer: deal.Customer || {},
    } as any

    // Debug: dealData'yı kontrol et
    if (process.env.NODE_ENV === 'development') {
      console.log('DealPDF - dealData:', {
        id: dealData.id,
        title: dealData.title,
        hasCompany: !!dealData.Company,
        hasCustomer: !!dealData.Customer,
        companyName: dealData.Company?.name,
        customerName: dealData.Customer?.name,
      })
    }

    // PDF oluştur - InvoicePDF pattern'i ile (daha güvenli)
    try {
      // Component'i doğru şekilde cast et
      const DealRecordPDFComponent = DealRecordPDF as React.ComponentType<{ deal: any }>
      const pdfElement = React.createElement(DealRecordPDFComponent, { deal: dealData })
      
      if (!pdfElement) {
        throw new Error('PDF element oluşturulamadı')
      }
      
      const pdfBuffer = await renderToBuffer(pdfElement)
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer boş')
      }
      
      // PDF response döndür
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="kayit_ozeti_${dealData.id.substring(0, 8)}.pdf"`,
        },
      })
    } catch (renderError: any) {
      console.error('PDF render error:', {
        message: renderError?.message,
        stack: renderError?.stack,
        dealId: dealData?.id,
        dealTitle: dealData?.title,
      })
      throw renderError
    }
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}
